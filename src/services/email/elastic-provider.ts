/**
 * Elastic Email 邮件服务
 */

import { logger } from '@/core/logger';
import { EmailOptions, EmailProvider } from '../auto-campaign/types';

interface ElasticEmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

interface ElasticEmailResponse {
  success: boolean;
  data?: any;
  error?: string;
  messageId?: string;
}

export class ElasticEmailProvider {
  private config: ElasticEmailConfig;
  private apiUrl: string = 'https://api.elasticemail.com/v2/email/send';

  constructor(config: ElasticEmailConfig) {
    this.config = config;
  }

  /**
   * 发送邮件
   */
  async sendEmail(options: EmailOptions): Promise<ElasticEmailResponse> {
    try {
      logger.info('Sending email via Elastic Email v2', {
        to: options.to,
        subject: options.subject,
      });

      // 使用 form-data 格式（v2 API）
      const formData = new URLSearchParams();
      formData.append('apikey', this.config.apiKey);
      formData.append('from', this.config.fromEmail);
      formData.append('fromName', this.config.fromName);
      formData.append('subject', options.subject);
      formData.append('to', options.to);
      formData.append('bodyText', options.text || '');
      formData.append('bodyHtml', options.html || '');

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success === true) {
        logger.info('Email sent successfully', {
          transactionId: data.transactionid,
          messageId: data.messageid,
          to: options.to,
        });

        return {
          success: true,
          messageId: data.messageid,
          data: data,
        };
      } else {
        throw new Error(data.error || 'Failed to send email');
      }

    } catch (error) {
      logger.error('Elastic Email send failed', error as Error, {
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

        // 避免触发 Elastic Email 速率限制（每分钟最多 60 封）
        await this.sleep(1000);

      } catch (error) {
        failed.push({
          to: emailOption.to,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.info('Batch email sending completed', {
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
      const response = await fetch('https://api.elasticemail.com/v4/account/load', {
        method: 'GET',
        headers: {
          'X-ElasticEmail-ApiKey': this.config.apiKey,
        },
      });

      return response.ok;
    } catch (error) {
      logger.error('Elastic Email connection test failed', error as Error);
      return false;
    }
  }

  /**
   * 获取邮件统计
   */
  async getEmailStatistics(emailId: string): Promise<any> {
    try {
      const response = await fetch(`https://api.elasticemail.com/v4/emails/status?messageIds=${emailId}`, {
        method: 'GET',
        headers: {
          'X-ElasticEmail-ApiKey': this.config.apiKey,
        },
      });

      if (response.ok) {
        return await response.json();
      }

      return null;
    } catch (error) {
      logger.error('Failed to get email statistics', error as Error, { emailId });
      return null;
    }
  }

  /**
   * 工具方法：HTML 转 Text
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/g, '')
      .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  /**
   * 工具方法：延迟
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出工厂函数
export function createElasticEmailProvider(): ElasticEmailProvider {
  return new ElasticEmailProvider({
    apiKey: process.env.ELASTIC_EMAIL_API_KEY || '',
    fromEmail: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
    fromName: process.env.EMAIL_FROM_NAME || 'Your Brand',
  });
}
