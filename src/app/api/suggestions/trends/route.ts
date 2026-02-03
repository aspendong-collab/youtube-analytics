import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { getCategoryName } from '@/lib/youtube-categories';

// 设置为动态路由
export const dynamic = 'force-dynamic';

// 数据库连接（使用环境变量）
const DATABASE_URL = process.env.PGDATABASE_URL || 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export async function GET(request: NextRequest) {
  console.log('[API /api/suggestions/trends] 收到趋势分析请求');

  const client = postgres(DATABASE_URL, {
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
        v.tags,
        v.publish_date,
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
          LIMIT 10
        ) as stats_history
      FROM videos v
      WHERE v.is_active = true
      ORDER BY
        (
          SELECT view_count 
          FROM video_stats vs 
          WHERE vs.video_id = v.video_id 
          ORDER BY stat_date DESC 
          LIMIT 1
        ) DESC
      LIMIT 100
    `);

    // 分析高增长视频
    const highGrowthVideos: any[] = [];
    const avgGrowthRate: number[] = [];
    const allTags = new Map<string, number>();
    const categoryStats = new Map<string, { count: number; totalViews: number; totalEngagement: number }>();

    videosWithStats.forEach((video: any) => {
      const latestStats = video.latest_stats;
      const statsHistory = video.stats_history || [];

      if (!latestStats || statsHistory.length < 2) return;

      // 计算增长率（对比上一条统计数据）
      const latestViews = latestStats.view_count || 0;
      const latestLikes = latestStats.like_count || 0;
      const latestComments = latestStats.comment_count || 0;
      const latestEngagement = latestViews > 0 ? ((latestLikes + latestComments) / latestViews) * 100 : 0;

      const previousStats = statsHistory[statsHistory.length - 2];
      const previousViews = previousStats?.view_count || 0;
      
      let growthRate = 0;
      if (previousViews > 0) {
        growthRate = ((latestViews - previousViews) / previousViews) * 100;
      }

      avgGrowthRate.push(growthRate);

      // 统计标签
      if (video.tags && Array.isArray(video.tags)) {
        video.tags.forEach((tag: string) => {
          allTags.set(tag, (allTags.get(tag) || 0) + latestViews);
        });
      }

      // 统计分类表现
      if (video.category_id) {
        const catStats = categoryStats.get(video.category_id) || { count: 0, totalViews: 0, totalEngagement: 0 };
        catStats.count++;
        catStats.totalViews += latestViews;
        catStats.totalEngagement += latestEngagement;
        categoryStats.set(video.category_id, catStats);
      }

      // 高增长视频判定（增长率高于平均值1.5倍且播放量>1000）
      const meanGrowthRate = avgGrowthRate.reduce((a, b) => a + b, 0) / avgGrowthRate.length;
      if (growthRate > meanGrowthRate * 1.5 && latestViews > 1000) {
        highGrowthVideos.push({
          videoId: video.video_id,
          title: video.title,
          category: video.category_id,
          tags: video.tags,
          views: latestViews,
          growthRate,
          engagement: latestEngagement,
          channelTitle: video.channel_title,
        });
      }
    });

    // 识别热门话题（基于标签的总播放量）
    const hotTopics = Array.from(allTags.entries())
      .map(([tag, totalViews]) => ({ tag, totalViews }))
      .sort((a, b) => b.totalViews - a.totalViews)
      .slice(0, 10);

    // 分析高增长视频的共同特征
    const highGrowthFeatures = {
      commonTags: analyzeCommonTags(highGrowthVideos),
      dominantCategories: analyzeCategories(highGrowthVideos),
      avgGrowthRate: highGrowthVideos.length > 0
        ? highGrowthVideos.reduce((sum, v) => sum + v.growthRate, 0) / highGrowthVideos.length
        : 0,
    };

    // 识别发布时间模式
    const publishTimePattern = analyzePublishTimePattern(videosWithStats);

    // 生成内容创作建议
    const suggestions = generateSuggestions(
      hotTopics,
      highGrowthFeatures,
      publishTimePattern
    );

    const response = {
      hotTopics: hotTopics.map(topic => ({
        topic: topic.tag,
        totalViews: topic.totalViews,
        popularity: topic.totalViews > 10000 ? '高' : topic.totalViews > 5000 ? '中' : '低',
      })),
      highGrowthVideos: highGrowthVideos.slice(0, 10).map(video => ({
        title: video.title,
        channelTitle: video.channelTitle || '未知博主',
        views: video.views,
        growthRate: video.growthRate.toFixed(1) + '%',
        engagement: video.engagement.toFixed(1) + '%',
        tags: video.tags?.slice(0, 5) || [],
      })),
      highGrowthFeatures: {
        commonTags: highGrowthFeatures.commonTags.slice(0, 5),
        dominantCategories: highGrowthFeatures.dominantCategories,
        avgGrowthRate: highGrowthFeatures.avgGrowthRate.toFixed(1) + '%',
      },
      publishTimePattern,
      suggestions,
      summary: {
        totalVideosAnalyzed: videosWithStats.length,
        highGrowthVideosCount: highGrowthVideos.length,
        avgGrowthRate: (avgGrowthRate.reduce((a, b) => a + b, 0) / avgGrowthRate.length).toFixed(1) + '%',
        topTrend: hotTopics[0]?.tag || '暂无',
      },
    };

    console.log('[API /api/suggestions/trends] 趋势分析完成');
    return NextResponse.json(response);

  } catch (error) {
    console.error('[API /api/suggestions/trends] 错误:', error);
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

// 分析共同标签
function analyzeCommonTags(videos: any[]): string[] {
  const tagFrequency = new Map<string, number>();
  
  videos.forEach(video => {
    if (video.tags && Array.isArray(video.tags)) {
      video.tags.forEach((tag: string) => {
        tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
      });
    }
  });

  return Array.from(tagFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag)
    .slice(0, 10);
}

// 分析分类分布
function analyzeCategories(videos: any[]): any[] {
  const categoryCount = new Map<string, number>();

  videos.forEach(video => {
    if (video.category) {
      categoryCount.set(video.category, (categoryCount.get(video.category) || 0) + 1);
    }
  });

  return Array.from(categoryCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([categoryId, count]) => ({
      categoryId,
      categoryName: getCategoryName(categoryId),
      count,
      percentage: (count / videos.length * 100).toFixed(1) + '%',
    }));
}

// 分析发布时间模式
function analyzePublishTimePattern(videos: any[]): any {
  const weekDayStats = new Array(7).fill(0);
  const hourStats = new Array(24).fill(0);
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  videos.forEach((video: any) => {
    if (video.publish_date) {
      const date = new Date(video.publish_date);
      const day = date.getDay();
      const hour = date.getHours();
      weekDayStats[day]++;
      hourStats[hour]++;
    }
  });

  // 找出最佳发布时间
  const bestDayIndex = weekDayStats.indexOf(Math.max(...weekDayStats));
  const bestHourIndex = hourStats.indexOf(Math.max(...hourStats));

  return {
    bestDay: weekDays[bestDayIndex],
    bestHour: bestHourIndex + ':00',
    bestDayCount: weekDayStats[bestDayIndex],
    bestHourCount: hourStats[bestHourIndex],
  };
}

// 生成内容创作建议
function generateSuggestions(
  hotTopics: any[],
  highGrowthFeatures: any,
  publishTimePattern: any
): string[] {
  const suggestions: string[] = [];

  // 基于热门话题的建议
  if (hotTopics.length > 0) {
    const topTopic = hotTopics[0].tag;
    suggestions.push(`热门话题 "${topTopic}" 正在获得高关注度，建议创作相关内容`);
  }

  // 基于高增长特征的建议
  if (highGrowthFeatures.commonTags.length > 0) {
    const commonTag = highGrowthFeatures.commonTags[0];
    suggestions.push(`高增长视频常包含标签 "${commonTag}"，考虑在内容中融入该主题`);
  }

  // 基于发布时间的建议
  if (publishTimePattern.bestDay) {
    suggestions.push(`最佳发布时间：${publishTimePattern.bestDay} ${publishTimePattern.bestHour}，此时观众活跃度最高`);
  }

  // 基于增长率的一般建议
  if (highGrowthFeatures.avgGrowthRate > 20) {
    suggestions.push('整体内容表现良好，保持当前的内容策略和发布频率');
  } else if (highGrowthFeatures.avgGrowthRate < 10) {
    suggestions.push('建议尝试新的内容主题和呈现方式，以提升视频增长率');
  }

  // 通用建议
  suggestions.push('关注竞争对手的最新高增长视频，学习其内容策略');
  suggestions.push('定期分析视频数据，及时调整内容方向');

  return suggestions.slice(0, 6);
}
