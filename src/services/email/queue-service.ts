/**
 * 邮件队列服务
 * 管理邮件发送队列、重试逻辑和追踪
 */

import { dbInstance as db } from '@/lib/db';
import { campaignEmailQueue, campaignAutoMatches, influencers } from '@/storage/database/shared/schema';
import { logger } from '@/core/logger';
import { createElasticEmailProvider } from './elastic-provider';
import { emailTemplateService } from './templates';
import { EmailOptions, EmailType, EmailStatus } from '../auto-campaign/types';
import { generateId } from '@/shared/utils/string';
import { and, sql, eq, gte, or, desc } from 'drizzle-orm';

export class EmailQueueService {
  private static instance: EmailQueueService;
  private emailProvider = createElasticEmailProvider();
  
  // Elastic Email 限制
  private readonly MAX_PER_HOUR = 500;
  private readonly MAX_PER_DAY = 5000;

  private constructor() {}

  static getInstance(): EmailQueueService {
    if (!EmailQueueService.instance) {
      EmailQueueService.instance = new EmailQueueService();
    }
    return EmailQueueService.instance;
  }

  /**
   * 批量创建邀请邮件
   */
  async batchCreateInvitations(
    campaignId: string,
    influencerIds: string[],
    campaignContext: any
  ): Promise<{ created: number; queued: number; failed: number }> {
    let created = 0;
    let queued = 0;
    let failed = 0;

    for (const influencerId of influencerIds) {
      try {
        // 获取达人信息
        const [influencer] = await db
          .select()
          .from(influencers)
          .where(eq(influencers.id, influencerId))
          .limit(1);

        if (!influencer || !influencer.email) {
          logger.warn('Influencer not found or no email', { influencerId });
          failed++;
          continue;
        }

        // 生成邀请邮件内容
        const emailContent = emailTemplateService.renderInvitation({
          influencerName: influencer.channelTitle,
          influencerChannel: influencer.channelId,
          influencerCategory: influencer.category || 'Unknown',
          campaignName: campaignContext.name,
          campaignDescription: campaignContext.description || '',
          budgetRange: `$${campaignContext.minPrice} - $${campaignContext.maxPrice}`,
          senderName: campaignContext.senderName || 'Marketing Team',
          senderEmail: campaignContext.senderEmail || 'noreply@yourdomain.com',
          companyName: campaignContext.companyName || '',
        });

        // 创建邮件队列记录
        await db.insert(campaignEmailQueue).values({
          id: generateId(),
          campaignId,
          influencerId,
          autoMatchId: null,
          emailType: 'invitation',
          recipientEmail: influencer.email,
          recipientName: influencer.channelTitle,
          subject: emailContent.subject,
          content: emailContent.text,
          htmlContent: emailContent.html,
          provider: 'elastic',
          status: 'queued',
          scheduledAt: new Date(),
          trackingEnabled: true,
          retryCount: 0,
          maxRetries: 3,
        });

        created++;

      } catch (error) {
        logger.error('Failed to create email queue item', error as Error, {
          campaignId,
          influencerId,
        });
        failed++;
      }
    }

    logger.info('Batch email queue creation completed', {
      campaignId,
      created,
      queued,
      failed,
    });

    return { created, queued, failed };
  }

  /**
   * 处理邮件队列
   */
  async processQueue(limit: number = 10): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    try {
      // 检查过去 1 小时的发送数量
      const sentInLastHour = await this.getSentCount('1 hour');
      
      if (sentInLastHour >= this.MAX_PER_HOUR) {
        logger.info('Hourly limit reached, skipping queue processing', {
          sentInLastHour,
          limit: this.MAX_PER_HOUR,
        });
        return { processed: 0, succeeded: 0, failed: 0 };
      }

      // 计算本次可发送数量
      const canSend = Math.min(
        this.MAX_PER_HOUR - sentInLastHour,
        limit
      );

      if (canSend <= 0) {
        logger.info('No capacity to send emails');
        return { processed: 0, succeeded: 0, failed: 0 };
      }

      // 获取待发送的邮件
      const queuedEmails = await db
        .select()
        .from(campaignEmailQueue)
        .where(
          and(
            eq(campaignEmailQueue.status, 'queued'),
            gte(campaignEmailQueue.scheduledAt, new Date()),
            or(
              sql`${campaignEmailQueue.failedAt} IS NULL`,
              sql`${campaignEmailQueue.retryCount} < ${campaignEmailQueue.maxRetries}`
            )
          )
        )
        .orderBy(campaignEmailQueue.scheduledAt)
        .limit(canSend);

      logger.info(`Processing ${queuedEmails.length} emails from queue`);

      for (const email of queuedEmails) {
        try {
          processed++;

          // 更新状态为发送中
          await db
            .update(campaignEmailQueue)
            .set({ status: 'sending' })
            .where(eq(campaignEmailQueue.id, email.id));

          // 发送邮件
          const result = await this.emailProvider.sendEmail({
            to: email.recipientEmail,
            toName: email.recipientName,
            subject: email.subject,
            html: email.htmlContent || email.content,
            text: email.content,
            campaignId: email.campaignId,
            influencerId: email.influencerId,
            emailType: email.emailType as EmailType,
            trackingEnabled: email.trackingEnabled,
          });

          if (result.success && result.messageId) {
            // 发送成功
            await db
              .update(campaignEmailQueue)
              .set({
                status: 'sent',
                sentAt: new Date(),
                providerMessageId: result.messageId,
              })
              .where(eq(campaignEmailQueue.id, email.id));

            succeeded++;
          } else {
            // 发送失败
            await this.handleSendFailure(email.id, result.error || 'Unknown error');
            failed++;
          }

          // 避免触发速率限制
          await this.sleep(1000);

        } catch (error) {
          logger.error('Failed to process email from queue', error as Error, {
            emailId: email.id,
          });
          await this.handleSendFailure(email.id, error instanceof Error ? error.message : 'Unknown error');
          failed++;
        }
      }

      logger.info('Email queue processing completed', {
        processed,
        succeeded,
        failed,
      });

      return { processed, succeeded, failed };

    } catch (error) {
      logger.error('Email queue processing failed', error as Error);
      return { processed, succeeded, failed };
    }
  }

  /**
   * 处理发送失败
   */
  private async handleSendFailure(emailId: string, errorMessage: string): Promise<void> {
    const [email] = await db
      .select()
      .from(campaignEmailQueue)
      .where(eq(campaignEmailQueue.id, emailId))
      .limit(1);

    if (!email) return;

    const retryCount = email.retryCount + 1;

    if (retryCount >= email.maxRetries) {
      // 超过最大重试次数，标记为失败
      await db
        .update(campaignEmailQueue)
        .set({
          status: 'failed',
          failedAt: new Date(),
          errorMessage,
          retryCount,
        })
        .where(eq(campaignEmailQueue.id, emailId));

      logger.error('Email failed after max retries', { emailId, retryCount });
    } else {
      // 重新入队，等待重试
      const nextRetryAt = new Date(Date.now() + 5 * 60 * 1000 * retryCount); // 指数退避

      await db
        .update(campaignEmailQueue)
        .set({
          status: 'queued',
          retryCount,
          nextRetryAt,
          errorMessage,
        })
        .where(eq(campaignEmailQueue.id, emailId));

      logger.info('Email queued for retry', { emailId, retryCount, nextRetryAt });
    }
  }

  /**
   * 获取已发送数量
   */
  private async getSentCount(timeframe: string): Promise<number> {
    const [result] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(campaignEmailQueue)
      .where(
        and(
          eq(campaignEmailQueue.status, 'sent'),
          sql`${campaignEmailQueue.sentAt} >= NOW() - INTERVAL '${timeframe}'`
        )
      );

    return Number(result?.count || 0);
  }

  /**
   * 获取邮件统计
   */
  async getStatistics(campaignId: string): Promise<any> {
    const [result] = await db
      .select({
        queued: sql<number>`COUNT(CASE WHEN status = 'queued' THEN 1 END)`,
        sending: sql<number>`COUNT(CASE WHEN status = 'sending' THEN 1 END)`,
        sent: sql<number>`COUNT(CASE WHEN status = 'sent' THEN 1 END)`,
        failed: sql<number>`COUNT(CASE WHEN status = 'failed' THEN 1 END)`,
        bounced: sql<number>`COUNT(CASE WHEN status = 'bounced' THEN 1 END)`,
        opened: sql<number>`COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END)`,
        clicked: sql<number>`COUNT(CASE WHEN clicked_at IS NOT NULL THEN 1 END)`,
      })
      .from(campaignEmailQueue)
      .where(eq(campaignEmailQueue.campaignId, campaignId));

    return result;
  }

  /**
   * 获取邮件列表
   */
  async getEmails(
    campaignId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ items: any[]; total: number }> {
    const offset = (page - 1) * pageSize;

    const items = await db
      .select()
      .from(campaignEmailQueue)
      .where(eq(campaignEmailQueue.campaignId, campaignId))
      .orderBy(desc(campaignEmailQueue.createdAt))
      .limit(pageSize)
      .offset(offset);

    const [totalResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(campaignEmailQueue)
      .where(eq(campaignEmailQueue.campaignId, campaignId));

    return {
      items,
      total: Number(totalResult?.count || 0),
    };
  }

  /**
   * 延迟工具
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出单例
export const emailQueueService = EmailQueueService.getInstance();
