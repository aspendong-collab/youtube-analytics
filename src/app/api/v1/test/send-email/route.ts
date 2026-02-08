// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createElasticEmailProvider } from '@/services/email/elastic-provider';
import { createResendProvider } from '@/services/email/resend-provider';
import { createMockEmailProvider } from '@/services/email/mock-provider';

/**
 * 测试邮件发送 API
 * POST /api/v1/test/send-email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, toName, subject, html, provider } = body;

    if (!to || !subject) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: to, subject',
      }, { status: 400 });
    }

    // 根据参数或环境变量选择邮件提供商
    const providerName = provider || process.env.EMAIL_PROVIDER || 'resend';
    
    let emailProvider;
    switch (providerName) {
      case 'resend':
        emailProvider = createResendProvider();
        break;
      case 'elastic':
        emailProvider = createElasticEmailProvider();
        break;
      case 'mock':
        emailProvider = createMockEmailProvider();
        break;
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown email provider: ${providerName}`,
        }, { status: 400 });
    }

    const result = await emailProvider.sendEmail({
      to,
      toName: toName || 'Test User',
      subject,
      html: html || '<h1>Test Email</h1><p>This is a test email from your marketing system.</p>',
      text: 'This is a test email from your marketing system.',
      campaignId: 'test',
      influencerId: 'test',
      emailType: 'invitation',
      trackingEnabled: true,
    });

    return NextResponse.json({
      success: result.success,
      data: result,
      provider: providerName,
    });

  } catch (error: any) {
    console.error('[TestSendEmail] POST error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to send test email',
    }, { status: 500 });
  }
}
