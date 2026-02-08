/**
 * Resend 邮件服务
 * 文档：https://resend.com/docs/api-reference/emails/send-email
 */

import { logger } from '@/core/logger';
import { EmailOptions, EmailProvider } from '../auto-campaign/types';

interface ResendConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

interface ResendResponse {
  success: boolean;
  data?: any;
  error?: string;
  messageId?: string;
}

export class ResendProvider {
  private config: ResendConfig;
  private apiUrl: string = 'https://api.resend.com/emails';

  constructor(config: ResendConfig) {
    this.config = config;
  }

  /**
   * 发送邮件
   */
  async sendEmail(options: EmailOptions): Promise<ResendResponse> {
    try {
      logger.info('[Resend] Sending email', {
        to: options.to,
        toName: options.toName,
        subject: options.subject,
        campaignId: options.campaignId,
        influencerId: options.influencerId,
        emailType: options.emailType,
      });

      // Resend API 格式
      const requestBody = {
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: [options.to],
        subject: options.subject,
        html: options.html || '<p>' + (options.text || '') + '</p>',
        text: options.text,
        tags: [
          { name: 'campaign_id', value: options.campaignId || 'unknown' },
          { name: 'influencer_id', value: options.influencerId || 'unknown' },
          { name: 'email_type', value: options.emailType || 'unknown' },
        ],
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        const messageId = data.id;

        logger.info('[Resend] Email sent successfully', {
          messageId,
          to: options.to,
        });

        return {
          success: true,
          messageId: messageId,
          data: data,
        };
      } else {
        throw new Error(data.message || 'Failed to send email');
      }

    } catch (error) {
      logger.error('[Resend] Email send failed', error as Error, {
        to: options.to,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 批量发送邮件
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

        // Resend 速率限制：约 10 req/sec，保守一点每 200ms 发送一封
        await this.sleep(200);

      } catch (error) {
        failed.push({
          to: emailOption.to,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.info('[Resend] Batch email sending completed', {
      total: options.length,
      successful: successful.length,
      failed: failed.length,
    });

    return { successful, failed };
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      // Resend 没有专门的测试端点，我们通过发送一封测试邮件来验证
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          from: `${this.config.fromName} <${this.config.fromEmail}>`,
          to: ['test@resend.dev'],
          subject: 'Connection Test',
          html: '<p>Connection test successful.</p>',
        }),
      });

      return response.ok;
    } catch (error) {
      logger.error('[Resend] Connection test failed', error as Error);
      return false;
    }
  }

  /**
   * 获取邮件统计
   * Resend 提供 webhook 来追踪邮件事件，这里简化实现
   */
  async getEmailStatistics(emailId: string): Promise<any> {
    try {
      // Resend API v1 没有直接查询邮件状态的端点
      // 需要通过 webhook 来追踪
      logger.info('[Resend] Email statistics require webhook setup', { emailId });
      
      return {
        messageId: emailId,
        note: 'Resend uses webhooks for real-time tracking',
      };
    } catch (error) {
      logger.error('[Resend] Failed to get email statistics', error as Error, { emailId });
      return null;
    }
  }

  /**
   * 工具方法：延迟
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出工厂函数
export function createResendProvider(): ResendProvider {
  return new ResendProvider({
    apiKey: process.env.RESEND_API_KEY || '',
    fromEmail: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    fromName: process.env.EMAIL_FROM_NAME || 'Your Brand',
  });
}
