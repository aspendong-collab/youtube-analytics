import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { db } from '@/storage/database';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/influencers/oauth/callback`
);

const SCOPES = [
  'https://www.googleapis.com/auth/yt-analytics.readonly',
  'https://www.googleapis.com/auth/yt-analytics-monetary.readonly',
  'https://www.googleapis.com/auth/youtube.readonly'
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const influencerId = searchParams.get('influencer_id');
  const channelId = searchParams.get('channel_id');

  if (!influencerId || !channelId) {
    return NextResponse.json(
      { error: '缺少必需参数: influencer_id 和 channel_id' },
      { status: 400 }
    );
  }

  // 生成授权 URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // 获取 refresh_token
    scope: SCOPES,
    state: JSON.stringify({ influencerId, channelId }),
    prompt: 'consent', // 强制显示同意屏幕
  });

  // 重定向到 Google 授权页面
  return NextResponse.redirect(authUrl);
}
