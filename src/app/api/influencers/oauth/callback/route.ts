import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { db } from '@/storage/database';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/influencers/oauth/callback`
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return NextResponse.json(
      { error: '缺少授权码或状态参数' },
      { status: 400 }
    );
  }

  try {
    // 解析 state 参数
    const { influencerId, channelId } = JSON.parse(state);

    // 交换 code 获取 tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.json(
        { error: '获取 tokens 失败' },
        { status: 500 }
      );
    }

    // 计算过期时间
    const expiresAt = new Date();
    if (tokens.expiry_date) {
      expiresAt.setTime(tokens.expiry_date);
    } else {
      expiresAt.setSeconds(expiresAt.getSeconds() + 3600); // 默认1小时
    }

    // 获取频道信息
    oauth2Client.setCredentials(tokens);
    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    });

    const channelResponse = await youtube.channels.list({
      part: 'snippet',
      mine: true,
    });

    const channelTitle = channelResponse.data.items?.[0]?.snippet?.title || '';

    // 保存 tokens 到数据库
    await db.execute(sql`
      INSERT INTO youtube_oauth_tokens (channel_id, channel_title, access_token, refresh_token, token_type, expires_at, scope)
      VALUES (${channelId}, ${channelTitle}, ${tokens.access_token}, ${tokens.refresh_token}, ${tokens.token_type}, ${expiresAt.toISOString()}, ${tokens.scope?.join(' ')})
      ON CONFLICT (channel_id) DO UPDATE
      SET access_token = ${tokens.access_token},
          refresh_token = ${tokens.refresh_token},
          expires_at = ${expiresAt.toISOString()},
          updated_at = NOW()
    `);

    // 更新达人授权状态
    await db.execute(sql`
      INSERT INTO influencer_authorization (influencer_id, channel_id, is_authorized, authorized_at, expires_at)
      VALUES (${influencerId}, ${channelId}, true, NOW(), ${expiresAt.toISOString()})
      ON CONFLICT (influencer_id, channel_id) DO UPDATE
      SET is_authorized = true,
          authorized_at = NOW(),
          expires_at = ${expiresAt.toISOString()}
    `);

    // 重定向到达人详情页面
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/influencers/${influencerId}?authorized=true`);

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json(
      { error: '授权失败: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
