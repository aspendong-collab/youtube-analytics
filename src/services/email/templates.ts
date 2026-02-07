/**
 * 邮件模板系统
 */

import {
  InvitationTemplateContext,
  NegotiationTemplateContext,
  EmailTemplate
} from '../auto-campaign/types';

export class EmailTemplateService {
  private static instance: EmailTemplateService;

  private constructor() {}

  static getInstance(): EmailTemplateService {
    if (!EmailTemplateService.instance) {
      EmailTemplateService.instance = new EmailTemplateService();
    }
    return EmailTemplateService.instance;
  }

  /**
   * 邀请邮件模板
   */
  getInvitationTemplate(): EmailTemplate {
    return {
      name: 'invitation',
      subject: `合作邀请 - {{campaignName}}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>合作邀请</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
            .highlight { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .cta { background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>合作邀请</h1>
            </div>
            
            <div class="content">
              <p>Hi <strong>{{influencerName}}</strong>,</p>
              
              <p>我们注意到您在 <strong>{{influencerCategory}}</strong> 领域的内容创作非常出色！您的频道 <strong>{{influencerChannel}}</strong> 给我们留下了深刻印象。</p>
              
              <p>我们正在寻找像您这样优秀的创作者进行合作，推广我们的 <strong>{{campaignName}}</strong> 项目。</p>
              
              <div class="highlight">
                <strong>关于我们的项目：</strong><br>
                • 项目名称：{{campaignName}}<br>
                • 项目描述：{{campaignDescription}}<br>
                • 预算范围：{{budgetRange}}
              </div>
              
              <p>我们对您的内容质量非常认可，相信这次合作能够为双方带来巨大的价值。如果您有兴趣，请回复确认我们是否可以进一步沟通合作细节。</p>
              
              <p>期待您的回复！</p>
              
              <p>Best regards,<br>
              <strong>{{senderName}}</strong><br>
              {{senderEmail}}<br>
              {{companyName}}</p>
            </div>
            
            <div class="footer">
              <p>如果您不想收到此类邮件，请回复"退订"</p>
            </div>
          </div>
        </body>
        </html>
      `,
      variables: ['influencerName', 'influencerChannel', 'influencerCategory', 'campaignName', 'campaignDescription', 'budgetRange', 'senderName', 'senderEmail', 'companyName'],
    };
  }

  /**
   * 谈判邮件模板
   */
  getNegotiationTemplate(): EmailTemplate {
    return {
      name: 'negotiation',
      subject: `关于 {{campaignName}} 项目的合作报价`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>谈判回复</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
            .price-box { background: #fff; border: 2px solid #667eea; border-radius: 5px; padding: 20px; text-align: center; margin: 20px 0; }
            .price-box .price { font-size: 36px; color: #667eea; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>合作报价</h1>
            </div>
            
            <div class="content">
              <p>Hi <strong>{{influencerName}}</strong>,</p>
              
              <p>感谢您对我们 <strong>{{campaignName}}</strong> 项目的兴趣！经过内部讨论，我们很高兴地向您提出以下合作报价：</p>
              
              <div class="price-box">
                <div class="price">${{ourOffer}}</div>
                <p>USD - 合作费用</p>
              </div>
              
              {{#if previousPrice}}
              <p>我们注意到您之前的报价为 ${{previousPrice}}，我们非常理解您的价值期望。这个报价基于我们的预算范围，但我们相信您的专业能力能够为项目带来超出预期的效果。</p>
              {{/if}}
              
              <p><strong>合作内容：</strong></p>
              <ul>
                <li>1 条原创视频内容创作</li>
                <li>视频时长 8-10 分钟</li>
                <li>包含产品介绍和使用展示</li>
                <li>视频发布后保持 30 天</li>
              </ul>
              
              <p><strong>我们的支持：</strong></p>
              <ul>
                <li>提供产品样品和详细资料</li>
                <li>专业的脚本和拍摄指导</li>
                <li>灵活的创作空间和时间安排</li>
              </ul>
              
              <p><strong>付款条件：</strong></p>
              <ul>
                <li>视频发布确认后 7 天内支付</li>
                <li>支持 PayPal 或银行转账</li>
              </ul>
              
              <p>如果您对这个报价满意，请回复确认。我们非常期待与您的合作！</p>
              
              <p>如果您有任何问题或需要进一步讨论，请随时联系我们。</p>
              
              <p>Best regards,<br>
              <strong>{{senderName}}</strong></p>
            </div>
            
            <div class="footer">
              <p>这是第 {{negotiationRound}} 轮谈判</p>
            </div>
          </div>
        </body>
        </html>
      `,
      variables: ['influencerName', 'campaignName', 'ourOffer', 'previousPrice', 'negotiationRound', 'senderName'],
    };
  }

  /**
   * 跟进邮件模板
   */
  getFollowupTemplate(): EmailTemplate {
    return {
      name: 'followup',
      subject: `跟进 - {{campaignName}} 项目合作`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>跟进邮件</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
            .reminder { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>跟进</h1>
            </div>
            
            <div class="content">
              <p>Hi <strong>{{influencerName}}</strong>,</p>
              
              <p>我注意到您还没有回复我们关于 <strong>{{campaignName}}</strong> 项目的合作邀请。我想确认一下您是否对我们的合作机会感兴趣？</p>
              
              <div class="reminder">
                <p>如果您正在考虑，请让我们知道您可能有的任何问题或顾虑。我们非常愿意进一步讨论合作细节。</p>
              </div>
              
              <p>如果您已经决定不参与这次合作，请回复告诉我们，这样我们可以寻找其他合适的合作伙伴。</p>
              
              <p>无论如何，我们都感谢您的时间考虑。</p>
              
              <p>Best regards,<br>
              <strong>{{senderName}}</strong><br>
              {{senderEmail}}</p>
            </div>
            
            <div class="footer">
              <p>如果您不想收到此类邮件，请回复"退订"</p>
            </div>
          </div>
        </body>
        </html>
      `,
      variables: ['influencerName', 'campaignName', 'senderName', 'senderEmail'],
    };
  }

  /**
   * 渲染邀请邮件
   */
  renderInvitation(context: InvitationTemplateContext): {
    subject: string;
    html: string;
    text: string;
  } {
    const template = this.getInvitationTemplate();
    
    let html = template.html;
    let subject = template.subject;
    
    // 简单的变量替换
    Object.keys(context).forEach(key => {
      const value = (context as any)[key] || '';
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value);
      subject = subject.replace(regex, value);
    });
    
    // 移除未替换的变量
    html = html.replace(/{{[^}]+}}/g, '');
    subject = subject.replace(/{{[^}]+}}/g, '');
    
    return {
      subject,
      html,
      text: this.htmlToText(html),
    };
  }

  /**
   * 渲染谈判邮件
   */
  renderNegotiation(context: NegotiationTemplateContext): {
    subject: string;
    html: string;
    text: string;
  } {
    const template = this.getNegotiationTemplate();
    
    let html = template.html;
    let subject = template.subject;
    
    // 简单的变量替换
    Object.keys(context).forEach(key => {
      const value = (context as any)[key] || '';
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value);
      subject = subject.replace(regex, value);
    });
    
    // 处理条件块
    html = html.replace(/{{#if [^}]+}}/g, '').replace(/{{\/if}}/g, '');
    
    // 移除未替换的变量
    html = html.replace(/{{[^}]+}}/g, '');
    subject = subject.replace(/{{[^}]+}}/g, '');
    
    return {
      subject,
      html,
      text: this.htmlToText(html),
    };
  }

  /**
   * 渲染跟进邮件
   */
  renderFollowup(context: Partial<InvitationTemplateContext>): {
    subject: string;
    html: string;
    text: string;
  } {
    const template = this.getFollowupTemplate();
    
    let html = template.html;
    let subject = template.subject;
    
    // 简单的变量替换
    Object.keys(context).forEach(key => {
      const value = (context as any)[key] || '';
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value);
      subject = subject.replace(regex, value);
    });
    
    // 移除未替换的变量
    html = html.replace(/{{[^}]+}}/g, '');
    subject = subject.replace(/{{[^}]+}}/g, '');
    
    return {
      subject,
      html,
      text: this.htmlToText(html),
    };
  }

  /**
   * HTML 转 Text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/g, '')
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

// 导出单例
export const emailTemplateService = EmailTemplateService.getInstance();
