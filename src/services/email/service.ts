/**
 * 邮件服务
 */

import { logger } from '@/core/logger';
import { config } from '@/core/config';

export interface Email {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export class EmailService {
  private static instance: EmailService;
  private enabled: boolean;
  private defaultFrom: string;

  private constructor() {
    this.enabled = config.get('email.enabled') as boolean || false;
    this.defaultFrom = config.get('email.from') as string || 'noreply@example.com';
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * 发送邮件
   */
  async send(email: Email): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.enabled) {
      logger.warn('Email service is disabled', { to: email.to });
      return {
        success: false,
        error: 'Email service is disabled',
      };
    }

    logger.info('Sending email', {
      to: email.to,
      subject: email.subject,
      hasHtml: !!email.html,
      hasText: !!email.text,
      hasAttachments: email.attachments && email.attachments.length > 0,
    });

    try {
      // TODO: 集成实际的邮件服务（如 Resend、SendGrid、Nodemailer 等）
      // 这里使用模拟实现
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      logger.info('Email sent successfully', { messageId, to: email.to });

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      logger.error('Failed to send email', error as Error, { to: email.to });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 批量发送邮件
   */
  async sendBatch(emails: Email[]): Promise<{
    total: number;
    success: number;
    failed: number;
    results: Array<{ to: string; success: boolean; messageId?: string; error?: string }>;
  }> {
    logger.info('Sending batch emails', { count: emails.length });

    let success = 0;
    let failed = 0;
    const results = [];

    for (const email of emails) {
      const result = await this.send(email);
      results.push({ to: email.to, ...result });

      if (result.success) {
        success++;
      } else {
        failed++;
      }
    }

    logger.info('Batch email sending completed', { total: emails.length, success, failed });

    return {
      total: emails.length,
      success,
      failed,
      results,
    };
  }

  /**
   * 发送邀请邮件
   */
  async sendInvitationEmail(
    to: string,
    influencerName: string,
    campaignName: string,
    invitationUrl: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const subject = `Invitation to collaborate on ${campaignName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Collaboration Invitation</h2>
        <p>Dear ${influencerName},</p>
        <p>We would like to invite you to collaborate on our campaign <strong>${campaignName}</strong>.</p>
        <p>We believe your content and audience align perfectly with our campaign goals, and we would love to work together.</p>
        <p>Please review the campaign details and accept the invitation at the following link:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${invitationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">View Invitation</a>
        </p>
        <p>If you have any questions or need more information, please don't hesitate to reach out.</p>
        <p>Best regards,<br>Our Team</p>
      </div>
    `;

    return this.send({
      to,
      subject,
      html,
    });
  }

  /**
   * 发送谈判通知邮件
   */
  async sendNegotiationEmail(
    to: string,
    influencerName: string,
    campaignName: string,
    negotiationUrl: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const subject = `New negotiation for ${campaignName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Negotiation Update</h2>
        <p>Dear ${influencerName},</p>
        <p>There is a new proposal for negotiation regarding the campaign <strong>${campaignName}</strong>.</p>
        <p>Please review the terms and respond at your earliest convenience:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${negotiationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">View Negotiation</a>
        </p>
        <p>We look forward to your response.</p>
        <p>Best regards,<br>Our Team</p>
      </div>
    `;

    return this.send({
      to,
      subject,
      html,
    });
  }

  /**
   * 发送活动确认邮件
   */
  async sendCampaignConfirmationEmail(
    to: string,
    influencerName: string,
    campaignName: string,
    startDate: Date
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const subject = `Campaign Confirmed: ${campaignName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Campaign Confirmation</h2>
        <p>Dear ${influencerName},</p>
        <p>We are pleased to confirm your participation in the campaign <strong>${campaignName}</strong>.</p>
        <h3>Campaign Details</h3>
        <ul>
          <li><strong>Campaign:</strong> ${campaignName}</li>
          <li><strong>Start Date:</strong> ${startDate.toLocaleDateString()}</li>
        </ul>
        <p>Please review the deliverables and timeline. If you have any questions, feel free to reach out.</p>
        <p>Thank you for your collaboration!</p>
        <p>Best regards,<br>Our Team</p>
      </div>
    `;

    return this.send({
      to,
      subject,
      html,
    });
  }

  /**
   * 检查邮件服务状态
   */
  async checkStatus(): Promise<{ enabled: boolean; configured: boolean; from: string }> {
    return {
      enabled: this.enabled,
      configured: this.enabled,
      from: this.defaultFrom,
    };
  }

  /**
   * 启用/禁用邮件服务
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    logger.info('Email service status changed', { enabled });
  }
}

// 导出单例实例
export const emailService = EmailService.getInstance();
