import { NextRequest, NextResponse } from 'next/server';
import {
  getTrafficSources,
  getAudienceActivity,
  getAudienceAge,
  getAudienceGender,
  getDailyStats,
} from '@/lib/youtube-analytics';
import { db } from '@/storage/database';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { influencerId, channelId, days = 30 } = body;

    if (!influencerId || !channelId) {
      return NextResponse.json(
        { error: '缺少必需参数' },
        { status: 400 }
      );
    }

    // 计算日期范围
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 1. 获取每日统计数据
    console.log(`[${channelId}] 开始获取每日统计数据...`);
    const dailyStats = await getDailyStats(channelId, startDate, endDate);

    // 保存每日统计数据
    if (dailyStats.rows) {
      for (const row of dailyStats.rows) {
        const date = row[0] as string;
        const views = parseInt(row[1] as string);
        const subscribersGained = parseInt(row[2] as string);
        const subscribersLost = parseInt(row[3] as string);
        const revenue = parseFloat(row[4] as string);
        const avgDuration = parseFloat(row[5] as string);

        await db.execute(sql`
          INSERT INTO influencer_daily_stats (influencer_id, channel_id, stat_date, daily_views, daily_subscribers, estimated_revenue, average_view_duration)
          VALUES (
            ${influencerId},
            ${channelId},
            ${date},
            ${views},
            ${subscribersGained - subscribersLost},
            ${revenue},
            ${avgDuration}
          )
          ON CONFLICT (influencer_id, stat_date) DO UPDATE
          SET daily_views = ${views},
              daily_subscribers = ${subscribersGained - subscribersLost},
              estimated_revenue = ${revenue},
              average_view_duration = ${avgDuration},
              updated_at = NOW()
        `);
      }
    }
    console.log(`[${channelId}] 每日统计数据保存完成`);

    // 2. 获取流量来源
    console.log(`[${channelId}] 开始获取流量来源...`);
    const trafficSources = await getTrafficSources(channelId, startDate, endDate);

    // 保存流量来源数据
    if (trafficSources.rows) {
      let totalViews = 0;

      // 计算总观看量
      for (const row of trafficSources.rows) {
        totalViews += parseInt(row[1] as string);
      }

      // 保存每个来源
      for (const row of trafficSources.rows) {
        const sourceType = row[0] as string;
        const views = parseInt(row[1] as string);
        const revenue = parseFloat(row[2] as string);
        const percentage = totalViews > 0 ? (views / totalViews) * 100 : 0;

        await db.execute(sql`
          INSERT INTO influencer_traffic_sources (influencer_id, channel_id, stat_date, source_type, views, percentage, estimated_revenue)
          VALUES (${influencerId}, ${channelId}, ${startDate.toISOString()}, ${sourceType}, ${views}, ${percentage.toFixed(2)}, ${revenue})
          ON CONFLICT (influencer_id, stat_date, source_type) DO UPDATE
          SET views = ${views},
              percentage = ${percentage.toFixed(2)},
              estimated_revenue = ${revenue},
              updated_at = NOW()
        `);
      }
    }
    console.log(`[${channelId}] 流量来源数据保存完成`);

    // 3. 获取观众活跃度
    console.log(`[${channelId}] 开始获取观众活跃度...`);
    const audienceActivity = await getAudienceActivity(channelId, startDate, endDate);

    // 保存观众活跃度数据
    if (audienceActivity.rows) {
      for (const row of audienceActivity.rows) {
        const hour = parseInt(row[0] as string);
        const views = parseInt(row[1] as string);
        const revenue = parseFloat(row[2] as string);
        const engagementRate = revenue > 0 ? (revenue / views) * 100 : 0;

        await db.execute(sql`
          INSERT INTO influencer_audience_activity (influencer_id, channel_id, stat_date, hour, active_viewers, engagement_rate)
          VALUES (${influencerId}, ${channelId}, ${startDate.toISOString()}, ${hour}, ${views}, ${engagementRate.toFixed(2)})
          ON CONFLICT (influencer_id, stat_date, hour) DO UPDATE
          SET active_viewers = ${views},
              engagement_rate = ${engagementRate.toFixed(2)},
              updated_at = NOW()
        `);
      }
    }
    console.log(`[${channelId}] 观众活跃度数据保存完成`);

    // 4. 获取年龄分布
    console.log(`[${channelId}] 开始获取年龄分布...`);
    const audienceAge = await getAudienceAge(channelId, startDate, endDate);

    // 保存年龄分布数据
    if (audienceAge.rows) {
      let totalViews = 0;

      for (const row of audienceAge.rows) {
        totalViews += parseInt(row[1] as string);
      }

      for (const row of audienceAge.rows) {
        const ageGroup = row[0] as string;
        const views = parseInt(row[1] as string);
        const revenue = parseFloat(row[2] as string);
        const percentage = totalViews > 0 ? (views / totalViews) * 100 : 0;

        await db.execute(sql`
          INSERT INTO influencer_audience_demographics (influencer_id, channel_id, stat_date, dimension, value, viewers, percentage)
          VALUES (${influencerId}, ${channelId}, ${startDate.toISOString()}, 'ageGroup', ${ageGroup}, ${views}, ${percentage.toFixed(2)})
          ON CONFLICT (influencer_id, stat_date, dimension, value) DO UPDATE
          SET viewers = ${views},
              percentage = ${percentage.toFixed(2)},
              updated_at = NOW()
        `);
      }
    }
    console.log(`[${channelId}] 年龄分布数据保存完成`);

    // 5. 获取性别分布
    console.log(`[${channelId}] 开始获取性别分布...`);
    const audienceGender = await getAudienceGender(channelId, startDate, endDate);

    // 保存性别分布数据
    if (audienceGender.rows) {
      let totalViews = 0;

      for (const row of audienceGender.rows) {
        totalViews += parseInt(row[1] as string);
      }

      for (const row of audienceGender.rows) {
        const gender = row[0] as string;
        const views = parseInt(row[1] as string);
        const revenue = parseFloat(row[2] as string);
        const percentage = totalViews > 0 ? (views / totalViews) * 100 : 0;

        await db.execute(sql`
          INSERT INTO influencer_audience_demographics (influencer_id, channel_id, stat_date, dimension, value, viewers, percentage)
          VALUES (${influencerId}, ${channelId}, ${startDate.toISOString()}, 'gender', ${gender}, ${views}, ${percentage.toFixed(2)})
          ON CONFLICT (influencer_id, stat_date, dimension, value) DO UPDATE
          SET viewers = ${views},
              percentage = ${percentage.toFixed(2)},
              updated_at = NOW()
        `);
      }
    }
    console.log(`[${channelId}] 性别分布数据保存完成`);

    return NextResponse.json({
      success: true,
      message: '数据采集完成',
      data: {
        influencerId,
        channelId,
        dateRange: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
        dailyStats: dailyStats.rowCount,
        trafficSources: trafficSources.rowCount,
        audienceActivity: audienceActivity.rowCount,
        audienceAge: audienceAge.rowCount,
        audienceGender: audienceGender.rowCount,
      },
    });

  } catch (error) {
    console.error('数据采集失败:', error);
    return NextResponse.json(
      {
        error: '数据采集失败',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
