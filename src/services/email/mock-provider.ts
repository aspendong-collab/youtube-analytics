/**
 * 模拟邮件服务（用于测试）
 * 这个服务不会真正发送邮件，而是记录日志并返回成功
 */

import { logger } from '@/core/logger';
import { EmailOptions, EmailProvider } from '../auto-campaign/types';

interface MockEmailResponse {
  success: boolean;
  data?: any;
  error?: string;
  messageId?: string;
}

export class MockEmailProvider {
  /**
   * 发送邮件（模拟）
   */
  async sendEmail(options: EmailOptions): Promise<MockEmailResponse> {
    try {
      logger.info('[Mock Email] Simulating email send', {
        to: options.to,
        toName: options.toName,
        subject: options.subject,
        campaignId: options.campaignId,
        influencerId: options.influencerId,
        emailType: options.emailType,
      });

      // 模拟发送延迟
      await this.sleep(500);

      // 生成模拟的 Message ID
      const messageId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      logger.info('[Mock Email] Email "sent" successfully', {
        messageId,
        to: options.to,
      });

      return {
        success: true,
        messageId: messageId,
        data: {
          simulated: true,
          message: 'This is a mock email, no real email was sent.',
          timestamp: new Date().toISOString(),
        },
      };

    } catch (error) {
      logger.error('[Mock Email] Send failed', error as Error, {
        to: options.to,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 批量发送邮件（模拟）
   */
  async sendBatchEmails(options: EmailOptions[]): Promise<{
    successful: Array<{ to: string; messageId: string }>;
    failed: Array<{ to: string; error: string }>;
  }> {
    const successful: Array<{ to: string; messageId: string }> = [];
    const failed: Array<{ to: string; error: string }> = [];

    for (const emailOption of options) {
      try {
        const result = await this.sendEmail(emailOption);

        if (result.success && result.messageId) {
          successful.push({
            to: emailOption.to,
            messageId: result.messageId,
          });
        } else {
          failed.push({
            to: emailOption.to,
            error: result.error || 'Unknown error',
          });
        }

        // 避免触发速率限制（即使是模拟）
        await this.sleep(100);

      } catch (error) {
        failed.push({
          to: emailOption.to,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.info('[Mock Email] Batch email "sending" completed', {
      total: options.length,
      successful: successful.length,
      failed: failed.length,
    });

    return { successful, failed };
  }

  /**
   * 测试连接（模拟）
   */
  async testConnection(): Promise<boolean> {
    // 模拟连接总是成功
    return true;
  }

  /**
   * 获取邮件统计（模拟）
   */
  async getEmailStatistics(emailId: string): Promise<any> {
    // 模拟返回统计数据
    return {
      messageId: emailId,
      status: 'delivered',
      opened: true,
      clicked: false,
      deliveredAt: new Date().toISOString(),
      openedAt: new Date(Date.now() + 60000).toISOString(),
    };
  }

  /**
   * 工具方法：延迟
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出工厂函数
export function createMockEmailProvider(): MockEmailProvider {
  return new MockEmailProvider();
}
