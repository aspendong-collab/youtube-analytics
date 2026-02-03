import { google } from 'googleapis';
import { db } from '@/storage/database';
import { sql } from 'drizzle-orm';

// 创建 OAuth2 客户端
function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/influencers/oauth/callback`
  );
}

// 刷新 Access Token
async function refreshAccessToken(channelId: string) {
  const oauth2Client = createOAuth2Client();

  // 从数据库获取 refresh_token
  const result = await db.execute(sql`
    SELECT refresh_token FROM youtube_oauth_tokens
    WHERE channel_id = ${channelId}
  `);

  const rows = result as any[];
  if (!rows || rows.length === 0) {
    throw new Error('未找到该频道的授权信息');
  }

  const refreshToken = rows[0].refresh_token;

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  // 刷新 token
  const { credentials } = await oauth2Client.refreshAccessToken();

  if (!credentials.access_token) {
    throw new Error('刷新 token 失败');
  }

  // 更新数据库
  await db.execute(sql`
    UPDATE youtube_oauth_tokens
    SET access_token = ${credentials.access_token},
        expires_at = NOW() + INTERVAL '1 hour',
        updated_at = NOW()
    WHERE channel_id = ${channelId}
  `);

  return credentials.access_token;
}

// 获取有效的 Access Token
export async function getValidAccessToken(channelId: string) {
  // 从数据库检查 token 是否过期
  const result = await db.execute(sql`
    SELECT access_token, expires_at FROM youtube_oauth_tokens
    WHERE channel_id = ${channelId}
  `);

  const rows = result as any[];
  if (!rows || rows.length === 0) {
    throw new Error('该频道未授权');
  }

  const tokenData = rows[0];
  const expiresAt = new Date(tokenData.expires_at);
  const now = new Date();

  // 如果 token 快过期了（提前5分钟刷新），刷新它
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    return await refreshAccessToken(channelId);
  }

  return tokenData.access_token;
}

// 获取流量来源分析
export async function getTrafficSources(
  channelId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const accessToken = await getValidAccessToken(channelId);
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const analytics = google.youtubeAnalytics({
      version: 'v2',
      auth: oauth2Client,
    });

    const response = await analytics.reports.query({
      ids: `channel==MINE`,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      metrics: 'views,estimatedRevenue',
      dimensions: 'insightTrafficSourceType',
      sort: '-views',
    });

    return response.data;

  } catch (error) {
    console.error('获取流量来源失败:', error);
    throw error;
  }
}

// 获取观众活跃度
export async function getAudienceActivity(
  channelId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const accessToken = await getValidAccessToken(channelId);
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const analytics = google.youtubeAnalytics({
      version: 'v2',
      auth: oauth2Client,
    });

    const response = await analytics.reports.query({
      ids: `channel==MINE`,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      metrics: 'views,estimatedRevenue',
      dimensions: 'hour',
      sort: 'hour',
    });

    return response.data;

  } catch (error) {
    console.error('获取观众活跃度失败:', error);
    throw error;
  }
}

// 获取观众画像（年龄分布）
export async function getAudienceAge(
  channelId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const accessToken = await getValidAccessToken(channelId);
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const analytics = google.youtubeAnalytics({
      version: 'v2',
      auth: oauth2Client,
    });

    const response = await analytics.reports.query({
      ids: `channel==MINE`,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      metrics: 'views,estimatedRevenue',
      dimensions: 'ageGroup',
      sort: '-views',
    });

    return response.data;

  } catch (error) {
    console.error('获取年龄分布失败:', error);
    throw error;
  }
}

// 获取观众画像（性别分布）
export async function getAudienceGender(
  channelId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const accessToken = await getValidAccessToken(channelId);
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const analytics = google.youtubeAnalytics({
      version: 'v2',
      auth: oauth2Client,
    });

    const response = await analytics.reports.query({
      ids: `channel==MINE`,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      metrics: 'views,estimatedRevenue',
      dimensions: 'gender',
      sort: '-views',
    });

    return response.data;

  } catch (error) {
    console.error('获取性别分布失败:', error);
    throw error;
  }
}

// 获取每日统计数据
export async function getDailyStats(
  channelId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const accessToken = await getValidAccessToken(channelId);
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const analytics = google.youtubeAnalytics({
      version: 'v2',
      auth: oauth2Client,
    });

    const response = await analytics.reports.query({
      ids: `channel==MINE`,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      metrics: 'views,subscribersGained,subscribersLost,estimatedRevenue,averageViewDuration',
      dimensions: 'day',
      sort: 'day',
    });

    return response.data;

  } catch (error) {
    console.error('获取每日统计失败:', error);
    throw error;
  }
}

// 获取视频留存率
export async function getVideoRetention(
  channelId: string,
  videoId: string
) {
  try {
    const accessToken = await getValidAccessToken(channelId);
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const analytics = google.youtubeAnalytics({
      version: 'v2',
      auth: oauth2Client,
    });

    const response = await analytics.reports.query({
      ids: `channel==MINE`,
      dimensions: 'elapsedVideoTimeRatio',
      metrics: 'audienceWatchRatio,views',
      filters: `video==${videoId}`,
      sort: 'elapsedVideoTimeRatio',
    });

    return response.data;

  } catch (error) {
    console.error('获取视频留存率失败:', error);
    throw error;
  }
}
