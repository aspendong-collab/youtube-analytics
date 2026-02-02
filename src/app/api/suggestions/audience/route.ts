import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { getCategoryName } from '@/lib/youtube-categories';

// 设置为动态路由
export const dynamic = 'force-dynamic';

// 数据库连接
const NEON_DATABASE_URL = 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export async function GET(request: NextRequest) {
  console.log('[API /api/suggestions/audience] 收到受众分析请求');

  const client = postgres(NEON_DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    // 获取所有视频及其统计数据
    const videosWithStats = await client.unsafe(`
      SELECT 
        v.id,
        v.video_id,
        v.title,
        v.category_id,
        v.publish_date,
        v.cooperation_cost,
        v.channel_title,
        (
          SELECT json_build_object(
            'view_count', vs.view_count,
            'like_count', vs.like_count,
            'comment_count', vs.comment_count,
            'stat_date', vs.stat_date
          )
          FROM video_stats vs
          WHERE vs.video_id = v.video_id
          ORDER BY vs.stat_date DESC
          LIMIT 1
        ) as latest_stats,
        (
          SELECT json_agg(
            json_build_object(
              'view_count', vs2.view_count,
              'like_count', vs2.like_count,
              'comment_count', vs2.comment_count,
              'stat_date', vs2.stat_date
            ) ORDER BY vs2.stat_date DESC
          )
          FROM video_stats vs2
          WHERE vs2.video_id = v.video_id
          LIMIT 30
        ) as stats_history
      FROM videos v
      WHERE v.is_active = true
    `);

    // 受众数据分析
    const audienceData = analyzeAudienceData(videosWithStats);

    // 生成受众建议
    const recommendations = generateAudienceRecommendations(audienceData);

    const response = {
      summary: {
        totalVideos: videosWithStats.length,
        totalViews: audienceData.totalViews,
        avgEngagementRate: audienceData.avgEngagementRate.toFixed(1) + '%',
        topCategory: audienceData.topCategory,
      },
      audiencePreferences: {
        preferredContentTypes: audienceData.preferredContentTypes,
        preferredCategories: audienceData.preferredCategories,
        preferredDuration: audienceData.preferredDuration,
        avgWatchTime: audienceData.avgWatchTime,
      },
      engagementPatterns: {
        engagementByCategory: audienceData.engagementByCategory,
        engagementByDuration: audienceData.engagementByDuration,
        topEngagingVideos: audienceData.topEngagingVideos,
      },
      optimalPostingTimes: audienceData.optimalPostingTimes,
      recommendations,
    };

    console.log('[API /api/suggestions/audience] 受众分析完成');
    return NextResponse.json(response);

  } catch (error) {
    console.error('[API /api/suggestions/audience] 错误:', error);
    return NextResponse.json(
      {
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}

// 分析受众数据
function analyzeAudienceData(videos: any[]): any {
  let totalViews = 0;
  let totalEngagement = 0;
  let totalDuration = 0;
  const categoryViews = new Map<string, number>();
  const categoryEngagement = new Map<string, number>();
  const durationEngagement = new Map<string, { views: number; engagement: number }>();
  const publishTimeStats = new Map<string, number>();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  // 根据时长分类
  const getDurationCategory = (duration: number | undefined): string => {
    if (!duration || duration < 60) return '短视频 (<1分钟)';
    if (duration < 300) return '短视频 (1-5分钟)';
    if (duration < 600) return '中视频 (5-10分钟)';
    if (duration < 1800) return '长视频 (10-30分钟)';
    return '超长视频 (>30分钟)';
  };

  videos.forEach((video: any) => {
    const latestStats = video.latest_stats;
    if (!latestStats) return;

    const views = latestStats.view_count || 0;
    const likes = latestStats.like_count || 0;
    const comments = latestStats.comment_count || 0;
    const engagement = views > 0 ? ((likes + comments) / views) * 100 : 0;
    const duration = undefined; // videos表没有duration字段，暂时设为undefined

    totalViews += views;
    totalEngagement += engagement;
    // duration可能为undefined，不累加
    if (duration) totalDuration += duration;

    // 分类统计
    const category = video.category_id || '未分类';
    categoryViews.set(category, (categoryViews.get(category) || 0) + views);
    categoryEngagement.set(category, (categoryEngagement.get(category) || 0) + engagement);

    // 时长统计 - 由于没有duration字段，跳过
    const durationCat = getDurationCategory(duration || 0);
    const durationData = durationEngagement.get(durationCat) || { views: 0, engagement: 0 };
    durationData.views += views;
    durationData.engagement += engagement;
    durationEngagement.set(durationCat, durationData);

    // 发布时间统计
    if (video.publish_date) {
      const date = new Date(video.publish_date);
      const day = weekDays[date.getDay()];
      publishTimeStats.set(day, (publishTimeStats.get(day) || 0) + views);
    }
  });

  // 计算平均值
  const avgEngagementRate = videos.length > 0 ? totalEngagement / videos.length : 0;
  const avgDuration = videos.length > 0 ? totalDuration / videos.length : 0;

  // 找出最受欢迎的分类
  const topCategoryId = Array.from(categoryViews.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || '无数据';
  const topCategory = getCategoryName(topCategoryId);

  // 按偏好排序的分类
  const preferredCategories = Array.from(categoryViews.entries())
    .map(([category, views]) => ({
      categoryId: category,
      category: getCategoryName(category),
      views,
      share: (views / totalViews * 100).toFixed(1) + '%',
      avgEngagement: (categoryEngagement.get(category)! /
        (videos.filter(v => v.category_id === category).length || 1)).toFixed(1) + '%',
    }))
    .sort((a, b) => parseFloat(b.share) - parseFloat(a.share))
    .slice(0, 5);

  // 按互动率排序的时长
  const engagementByDuration = Array.from(durationEngagement.entries())
    .map(([duration, data]) => ({
      duration,
      avgEngagement: (data.engagement / (videos.filter(v => getDurationCategory(v.duration || 0) === duration).length || 1)).toFixed(1) + '%',
      totalViews: data.views,
    }))
    .sort((a, b) => parseFloat(b.avgEngagement) - parseFloat(a.avgEngagement));

  // 找出最佳发布时间
  const optimalPostingTimes = Array.from(publishTimeStats.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([day, views]) => ({
      day,
      views,
      share: (views / totalViews * 100).toFixed(1) + '%',
    }))
    .slice(0, 3);

  // 高互动视频
  const topEngagingVideos = videos
    .map((video: any) => {
      const stats = video.latest_stats;
      const views = stats?.view_count || 0;
      const likes = stats?.like_count || 0;
      const comments = stats?.comment_count || 0;
      const engagement = views > 0 ? ((likes + comments) / views) * 100 : 0;
      
      return {
        title: video.title,
        channelTitle: video.channel_title || '未知博主',
        views,
        engagement: engagement.toFixed(1) + '%',
        category: getCategoryName(video.category_id),
        duration: '未知', // videos表没有duration字段
      };
    })
    .sort((a, b) => parseFloat(b.engagement) - parseFloat(a.engagement))
    .slice(0, 10);

  return {
    totalViews,
    avgEngagementRate,
    topCategory,
    preferredContentTypes: engagementByDuration.map(d => d.duration),
    preferredCategories,
    preferredDuration: formatDuration(avgDuration),
    avgWatchTime: formatDuration(avgDuration),
    engagementByCategory: preferredCategories.map(c => ({
      categoryId: c.categoryId,
      category: c.category,
      avgEngagement: c.avgEngagement,
      share: c.share,
    })),
    engagementByDuration,
    optimalPostingTimes,
    topEngagingVideos,
  };
}

// 格式化时长
function formatDuration(seconds: number): string {
  if (!seconds) return '未知';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (minutes < 60) {
    return `${minutes}分${remainingSeconds}秒`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}小时${remainingMinutes}分`;
  }
}

// 生成受众建议
function generateAudienceRecommendations(data: any): string[] {
  const recommendations: string[] = [];

  // 基于内容类型偏好
  if (data.preferredContentTypes.length > 0) {
    const topType = data.preferredContentTypes[0];
    recommendations.push(`受众偏好${topType}，建议调整视频时长以匹配观众习惯`);
  }

  // 基于分类偏好
  if (data.preferredCategories.length > 0) {
    const topCategory = data.preferredCategories[0];
    recommendations.push(`${topCategory.category}类内容最受欢迎，占总播放量的${topCategory.share}`);
  }

  // 基于互动率
  if (parseFloat(data.avgEngagementRate) < 5) {
    recommendations.push('整体互动率偏低，建议增加互动引导（如提问、号召评论）');
  } else if (parseFloat(data.avgEngagementRate) > 10) {
    recommendations.push('受众互动率较高，保持当前的内容策略和互动方式');
  }

  // 基于发布时间
  if (data.optimalPostingTimes.length > 0) {
    const bestDay = data.optimalPostingTimes[0].day;
    recommendations.push(`最佳发布日为${bestDay}，此时受众活跃度最高`);
  }

  // 基于观看时长
  if (data.avgWatchTime) {
    recommendations.push(`平均观看时长为${data.avgWatchTime}，建议在视频前30秒内吸引观众注意力`);
  }

  // 通用建议
  recommendations.push('定期分析受众数据，及时调整内容策略');
  recommendations.push('关注高互动视频的共同特征，复制成功经验');

  return recommendations.slice(0, 6);
}
