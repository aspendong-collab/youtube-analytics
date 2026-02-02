import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// 设置为动态路由
export const dynamic = 'force-dynamic';

// 数据库连接
const NEON_DATABASE_URL = 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export async function GET(request: NextRequest) {
  console.log('[API /api/suggestions/publish-time] 收到发布时间分析请求');

  const client = postgres(NEON_DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    // 获取所有视频的发布时间和播放量
    const videosResult = await client.unsafe(`
      SELECT 
        v.publish_date,
        v.channel_id,
        v.channel_title,
        COALESCE(vs.view_count, 0) as view_count
      FROM videos v
      LEFT JOIN (
        SELECT DISTINCT ON (video_id) video_id, view_count
        FROM video_stats
        ORDER BY video_id, stat_date DESC
      ) vs ON v.id = vs.video_id
      WHERE v.is_active = true AND v.publish_date IS NOT NULL
      ORDER BY v.publish_date DESC
      LIMIT 1000
    `);

    // 统计每个时段的平均播放量
    const timeSlots = new Map<string, { totalViews: number; count: number; videos: any[] }>();
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    videosResult.forEach((video: any) => {
      const publishDate = new Date(video.publish_date);
      const day = publishDate.getDay(); // 0-6
      const hour = publishDate.getHours(); // 0-23
      const key = `${day}-${hour}`;
      const views = Number(video.view_count);

      if (!timeSlots.has(key)) {
        timeSlots.set(key, { totalViews: 0, count: 0, videos: [] });
      }

      const slot = timeSlots.get(key)!;
      slot.totalViews += views;
      slot.count++;
      slot.videos.push(video);
    });

    // 计算平均播放量并排序
    const sortedSlots = Array.from(timeSlots.entries())
      .map(([key, data]) => ({
        key,
        day: parseInt(key.split('-')[0]),
        hour: parseInt(key.split('-')[1]),
        dayName: weekDays[parseInt(key.split('-')[0])],
        timeLabel: `${weekDays[parseInt(key.split('-')[0])]} ${hour}:00`,
        avgViews: data.totalViews / data.count,
        videoCount: data.count,
        totalViews: data.totalViews,
      }))
      .sort((a, b) => b.avgViews - a.avgViews);

    // 获取TOP 5黄金时段
    const topTimes = sortedSlots.slice(0, 5);

    // 获取平均基准（用于对比）
    const totalAvgViews = sortedSlots.reduce((sum, slot) => sum + slot.avgViews, 0) / sortedSlots.length;

    // 热力图数据
    const heatmapData = sortedSlots.map(slot => ({
      day: slot.day,
      hour: slot.hour,
      value: slot.avgViews,
    }));

    // 分析建议
    let recommendations = [];

    if (topTimes.length > 0) {
      const bestDay = topTimes[0].day;
      const bestHour = topTimes[0].hour;
      recommendations.push(`主要受众活跃时间：${weekDays[bestDay]} ${bestHour}:00 左右`);
    } else {
      recommendations.push('数据不足，无法确定最佳发布时间');
    }

    // 找出表现最差的时段
    const worstSlots = sortedSlots.slice(-5);
    if (worstSlots.length > 0) {
      const worstDay = worstSlots[0].day;
      const worstHour = worstSlots[0].hour;
      const worstAvg = worstSlots[0].avgViews;
      recommendations.push(
        `避开时段：${weekDays[worstDay]} ${worstHour}:00 左右（播放量低于均值 ${((totalAvgViews - worstAvg) / totalAvgViews * 100).toFixed(0)}%）`
      );
    }

    // 发布频率建议
    if (sortedSlots.length >= 20) {
      const activeDays = new Set(sortedSlots.map(s => s.day)).size;
      if (activeDays <= 3) {
        recommendations.push('建议增加发布频率，每周至少2-3次视频');
      } else if (activeDays >= 5) {
        recommendations.push('当前发布频率较高，建议集中在黄金时段');
      }
    }

    const response = {
      topTimes: topTimes.map(t => ({
        dayName: t.dayName,
        hour: t.hour,
        avgViews: t.avgViews,
        videoCount: t.videoCount,
        aboveAvg: ((t.avgViews - totalAvgViews) / totalAvgViews * 100).toFixed(1) + '%',
      })),
      heatmap: heatmapData,
      averageViews: totalAvgViews,
      recommendations,
      summary: {
        totalAnalyzed: videosResult.length,
        uniqueTimeSlots: sortedSlots.length,
        bestTimeSlot: topTimes[0]?.timeLabel || '数据不足',
        worstTimeSlot: worstSlots[0]?.timeLabel || '数据不足',
      },
    };

    console.log('[API /api/suggestions/publish-time] 发布时间分析完成');
    return NextResponse.json(response);

  } catch (error) {
    console.error('[API /api/suggestions/publish-time] 错误:', error);
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
