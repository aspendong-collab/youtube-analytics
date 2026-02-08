// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createElasticEmailProvider } from '@/services/email/elastic-provider';

/**
 * 测试邮件发送 API
 * POST /api/v1/test/send-email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, toName, subject, html } = body;

    if (!to || !subject) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: to, subject',
      }, { status: 400 });
    }

    const provider = createElasticEmailProvider();

    const result = await provider.sendEmail({
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
    });

  } catch (error: any) {
    console.error('[TestSendEmail] POST error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to send test email',
    }, { status: 500 });
  }
}
