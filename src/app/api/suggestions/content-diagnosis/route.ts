import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// 设置为动态路由
export const dynamic = 'force-dynamic';

// 数据库连接
const NEON_DATABASE_URL = 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export async function GET(request: NextRequest) {
  console.log('[API /api/suggestions/content-diagnosis] 收到内容诊断请求');

  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  const client = postgres(NEON_DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    // 获取目标视频信息
    const targetVideoResult = await client.unsafe(`
      SELECT 
        v.id,
        v.video_id,
        v.title,
        v.description,
        v.category_id,
        v.channel_id,
        v.tags,
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
      WHERE v.id = $1 OR v.video_id = $2
      LIMIT 1
    `, [videoId, videoId]);

    if (!targetVideoResult || targetVideoResult.length === 0) {
      return NextResponse.json(
        { error: '视频不存在' },
        { status: 404 }
      );
    }

    const targetVideo = targetVideoResult[0];

    // 获取同类视频用于对比
    const categoryVideosResult = await client.unsafe(`
      SELECT 
        v.video_id,
        v.title,
        v.description,
        v.tags,
        v.publish_date,
        (
          SELECT json_build_object(
            'view_count', vs.view_count,
            'like_count', vs.like_count,
            'comment_count', vs.comment_count
          )
          FROM video_stats vs
          WHERE vs.video_id = v.video_id
          ORDER BY vs.stat_date DESC
          LIMIT 1
        ) as latest_stats
      FROM videos v
      WHERE v.category_id = $1 AND v.is_active = true AND v.video_id != $2
      ORDER BY 
        (
          SELECT view_count 
          FROM video_stats vs 
          WHERE vs.video_id = v.video_id 
          ORDER BY stat_date DESC 
          LIMIT 1
        ) DESC
      LIMIT 30
    `, [targetVideo.category_id, targetVideo.video_id]);

    // 执行内容诊断
    const diagnosis = performContentDiagnosis(targetVideo, categoryVideosResult);

    console.log('[API /api/suggestions/content-diagnosis] 内容诊断完成');
    return NextResponse.json(diagnosis);

  } catch (error) {
    console.error('[API /api/suggestions/content-diagnosis] 错误:', error);
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

// 执行内容诊断
function performContentDiagnosis(targetVideo: any, categoryVideos: any[]): any {
  const diagnosis: any = {
    overallScore: 0,
    dimensions: {},
    issues: [],
    recommendations: [],
    strengths: [],
  };

  const latestStats = targetVideo.latest_stats || {};
  const views = latestStats.view_count || 0;
  const likes = latestStats.like_count || 0;
  const comments = latestStats.comment_count || 0;
  const engagement = views > 0 ? ((likes + comments) / views) * 100 : 0;

  // 1. 标题诊断
  const titleDiagnosis = diagnoseTitle(targetVideo.title, targetVideo.tags);
  diagnosis.dimensions.title = titleDiagnosis;

  // 2. 描述诊断
  const descriptionDiagnosis = diagnoseDescription(targetVideo.description);
  diagnosis.dimensions.description = descriptionDiagnosis;

  // 3. 标签诊断
  const tagsDiagnosis = diagnoseTags(targetVideo.tags, targetVideo.title);
  diagnosis.dimensions.tags = tagsDiagnosis;

  // 4. 时长诊断 - 由于videos表没有duration字段，跳过
  const durationDiagnosis = diagnoseDuration(undefined, categoryVideos);
  diagnosis.dimensions.duration = durationDiagnosis;

  // 5. 发布时间诊断
  const publishTimeDiagnosis = diagnosePublishTime(targetVideo.publish_date, categoryVideos);
  diagnosis.dimensions.publishTime = publishTimeDiagnosis;

  // 6. 互动数据诊断
  const engagementDiagnosis = diagnoseEngagement(engagement, categoryVideos);
  diagnosis.dimensions.engagement = engagementDiagnosis;

  // 7. 成本效益诊断
  const costDiagnosis = diagnoseCost(targetVideo.cooperation_cost, views, categoryVideos);
  diagnosis.dimensions.cost = costDiagnosis;

  // 8. 与博主历史对比 - 由于没有subscriber_count，跳过
  const channelPerformanceDiagnosis = diagnoseChannelPerformance(targetVideo, categoryVideos);
  diagnosis.dimensions.channelPerformance = channelPerformanceDiagnosis;

  // 计算综合得分
  const scores = [
    titleDiagnosis.score,
    descriptionDiagnosis.score,
    tagsDiagnosis.score,
    durationDiagnosis.score,
    publishTimeDiagnosis.score,
    engagementDiagnosis.score,
    costDiagnosis.score,
  ];
  diagnosis.overallScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);

  // 收集问题和建议
  [titleDiagnosis, descriptionDiagnosis, tagsDiagnosis, durationDiagnosis, 
   publishTimeDiagnosis, engagementDiagnosis, costDiagnosis].forEach(d => {
    if (d.issues) diagnosis.issues.push(...d.issues);
    if (d.recommendations) diagnosis.recommendations.push(...d.recommendations);
    if (d.strengths) diagnosis.strengths.push(...d.strengths);
  });

  return diagnosis;
}

// 标题诊断
function diagnoseTitle(title: string, tags: string[]): any {
  const diagnosis: any = {
    score: 70,
    analysis: [],
    issues: [],
    recommendations: [],
    strengths: [],
  };

  if (!title || title.length < 10) {
    diagnosis.issues.push('标题过短，建议至少20个字符');
    diagnosis.score -= 20;
  } else if (title.length > 100) {
    diagnosis.issues.push('标题过长，可能被截断，建议控制在60-80字符');
    diagnosis.score -= 10;
  } else {
    diagnosis.strengths.push('标题长度适中');
    diagnosis.score += 10;
  }

  // 检查是否包含数字
  if (/\d/.test(title)) {
    diagnosis.strengths.push('标题包含数字，能提高点击率');
    diagnosis.score += 5;
  }

  // 检查是否包含疑问句
  if (title.includes('？') || title.includes('?')) {
    diagnosis.strengths.push('使用疑问句式，能激发好奇心');
    diagnosis.score += 5;
  }

  // 检查是否包含情感词
  const emotionalWords = ['惊讶', '震惊', '必看', '推荐', '最佳', '终极', '秘密', '揭秘', '教程', '攻略'];
  const hasEmotionalWord = emotionalWords.some(word => title.includes(word));
  if (hasEmotionalWord) {
    diagnosis.strengths.push('标题包含情感词或强烈词，能提升吸引力');
    diagnosis.score += 5;
  }

  // 检查标签是否在标题中
  if (tags && Array.isArray(tags)) {
    const tagInTitle = tags.some((tag: string) => title.includes(tag));
    if (tagInTitle) {
      diagnosis.strengths.push('标题包含关键词标签，有利于SEO');
      diagnosis.score += 5;
    }
  }

  return diagnosis;
}

// 描述诊断
function diagnoseDescription(description: string): any {
  const diagnosis: any = {
    score: 70,
    analysis: [],
    issues: [],
    recommendations: [],
    strengths: [],
  };

  if (!description || description.length < 50) {
    diagnosis.issues.push('描述过短，建议至少100-200字符');
    diagnosis.score -= 20;
  } else if (description.length > 5000) {
    diagnosis.issues.push('描述过长，建议精简到500-1000字符');
    diagnosis.score -= 10;
  } else {
    diagnosis.strengths.push('描述长度适中');
    diagnosis.score += 10;
  }

  // 检查是否包含链接
  if (description && description.includes('http')) {
    diagnosis.strengths.push('描述包含链接，有助于引导用户');
    diagnosis.score += 5;
  }

  // 检查是否包含标签
  if (description && description.includes('#')) {
    diagnosis.strengths.push('描述包含标签，提高可发现性');
    diagnosis.score += 5;
  }

  // 检查是否包含时间戳
  if (description && /(\d+:\d+)/.test(description)) {
    diagnosis.strengths.push('描述包含时间戳，提升用户体验');
    diagnosis.score += 5;
  }

  return diagnosis;
}

// 标签诊断
function diagnoseTags(tags: string[], title: string): any {
  const diagnosis: any = {
    score: 70,
    analysis: [],
    issues: [],
    recommendations: [],
    strengths: [],
  };

  if (!tags || tags.length === 0) {
    diagnosis.issues.push('没有添加标签，建议添加3-5个相关标签');
    diagnosis.score -= 30;
  } else if (tags.length < 3) {
    diagnosis.issues.push('标签数量不足，建议至少添加3-5个标签');
    diagnosis.score -= 15;
  } else if (tags.length > 15) {
    diagnosis.issues.push('标签数量过多，建议控制在5-10个');
    diagnosis.score -= 10;
  } else {
    diagnosis.strengths.push('标签数量适中');
    diagnosis.score += 10;
  }

  // 检查标签长度
  if (tags) {
    const longTags = tags.filter((t: string) => t.length > 20);
    if (longTags.length > 0) {
      diagnosis.issues.push('部分标签过长，建议控制在15字符以内');
      diagnosis.score -= 10;
    }
  }

  // 检查标签是否在标题中
  if (tags) {
    const tagsInTitle = tags.filter((t: string) => title.includes(t));
    if (tagsInTitle.length > 0) {
      diagnosis.strengths.push(`${tagsInTitle.length}个标签出现在标题中，有利于SEO`);
      diagnosis.score += 5;
    }
  }

  return diagnosis;
}

// 时长诊断
function diagnoseDuration(duration: number, categoryVideos: any[]): any {
  const diagnosis: any = {
    score: 70,
    analysis: [],
    issues: [],
    recommendations: [],
    strengths: [],
  };

  if (!duration || duration < 30) {
    diagnosis.issues.push('视频过短，建议至少1-3分钟');
    diagnosis.score -= 20;
  } else if (duration > 1800) {
    diagnosis.recommendations.push('视频超过30分钟，考虑分成多个短视频');
    diagnosis.score -= 10;
  } else {
    diagnosis.strengths.push('视频时长适中');
    diagnosis.score += 10;
  }

  // 与同类视频对比
  if (categoryVideos.length > 0 && duration > 0) {
    // 由于videos表没有duration字段，跳过时长对比
    diagnosis.strengths.push('时长数据不可用，跳过对比');
  }

  return diagnosis;
}

// 发布时间诊断
function diagnosePublishTime(publishDate: string, categoryVideos: any[]): any {
  const diagnosis: any = {
    score: 70,
    analysis: [],
    issues: [],
    recommendations: [],
    strengths: [],
  };

  if (!publishDate) {
    diagnosis.issues.push('没有发布时间数据');
    return diagnosis;
  }

  const date = new Date(publishDate);
  const dayOfWeek = date.getDay();
  const hour = date.getHours();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  // 分析最佳发布时间
  if (categoryVideos.length > 0) {
    const dayStats = new Array(7).fill(0);
    const hourStats = new Array(24).fill(0);

    categoryVideos.forEach(v => {
      if (v.publish_date) {
        const d = new Date(v.publish_date);
        dayStats[d.getDay()] += v.latest_stats?.view_count || 0;
        hourStats[d.getHours()] += v.latest_stats?.view_count || 0;
      }
    });

    const bestDayIndex = dayStats.indexOf(Math.max(...dayStats));
    const bestHourIndex = hourStats.indexOf(Math.max(...hourStats));

    if (dayOfWeek === bestDayIndex && Math.abs(hour - bestHourIndex) <= 1) {
      diagnosis.strengths.push('发布时间选择在观众活跃高峰时段');
      diagnosis.score += 15;
    } else if (dayOfWeek !== bestDayIndex) {
      diagnosis.recommendations.push(`建议在${weekDays[bestDayIndex]}发布，此时观众更活跃`);
    } else if (Math.abs(hour - bestHourIndex) > 2) {
      diagnosis.recommendations.push(`建议在${bestHourIndex}:00左右发布`);
    }
  }

  return diagnosis;
}

// 互动数据诊断
function diagnoseEngagement(engagement: number, categoryVideos: any[]): any {
  const diagnosis: any = {
    score: 70,
    analysis: [],
    issues: [],
    recommendations: [],
    strengths: [],
  };

  if (engagement < 2) {
    diagnosis.issues.push('互动率低于2%，建议增加互动引导（提问、号召评论等）');
    diagnosis.score -= 20;
  } else if (engagement > 10) {
    diagnosis.strengths.push('互动率优秀，观众参与度高');
    diagnosis.score += 20;
  } else {
    diagnosis.recommendations.push('可以尝试增加互动引导以提升参与度');
  }

  // 与同类视频对比
  if (categoryVideos.length > 0) {
    const avgEngagement = categoryVideos.reduce((sum, v) => {
      const views = v.latest_stats?.view_count || 0;
      const likes = v.latest_stats?.like_count || 0;
      const comments = v.latest_stats?.comment_count || 0;
      const eng = views > 0 ? ((likes + comments) / views) * 100 : 0;
      return sum + eng;
    }, 0) / categoryVideos.length;

    if (engagement > avgEngagement * 1.3) {
      diagnosis.strengths.push('互动率显著高于同类视频平均水平');
      diagnosis.score += 10;
    } else if (engagement < avgEngagement * 0.7) {
      diagnosis.issues.push('互动率低于同类视频平均水平，需要改进内容质量');
      diagnosis.score -= 15;
    }
  }

  return diagnosis;
}

// 成本效益诊断
function diagnoseCost(cost: string, views: number, categoryVideos: any[]): any {
  const diagnosis: any = {
    score: 70,
    analysis: [],
    issues: [],
    recommendations: [],
    strengths: [],
  };

  const costNum = parseFloat(cost) || 0;
  const cpv = costNum > 0 && views > 0 ? costNum / views : 0;

  if (costNum === 0) {
    diagnosis.score = 80; // 没有成本，默认高分
    diagnosis.strengths.push('无合作成本，纯自然流量');
    return diagnosis;
  }

  // 与同类视频对比
  if (categoryVideos.length > 0) {
    const costVideos = categoryVideos.filter(v => v.cooperation_cost && v.cooperation_cost > 0);
    
    if (costVideos.length > 0) {
      const avgCPV = costVideos.reduce((sum, v) => {
        const c = parseFloat(v.cooperation_cost) || 0;
        const vw = v.latest_stats?.view_count || 0;
        return sum + (c > 0 && vw > 0 ? c / vw : 0);
      }, 0) / costVideos.length;

      if (cpv < avgCPV * 0.7) {
        diagnosis.strengths.push('CPV显著低于同类视频平均水平，投放效率优秀');
        diagnosis.score += 15;
      } else if (cpv > avgCPV * 1.3) {
        diagnosis.issues.push('CPV高于同类视频平均水平，建议优化内容或调整投放策略');
        diagnosis.score -= 15;
      } else {
        diagnosis.strengths.push('CPV处于正常范围');
        diagnosis.score += 5;
      }
    }
  }

  return diagnosis;
}

// 博主表现诊断
function diagnoseChannelPerformance(targetVideo: any, categoryVideos: any[]): any {
  const diagnosis: any = {
    score: 70,
    analysis: [],
    issues: [],
    recommendations: [],
    strengths: [],
  };

  const views = targetVideo.latest_stats?.view_count || 0;
  const subscribers = targetVideo.subscriber_count || 0;

  // 计算订阅转化率（假设每次播放有一定比例转化为订阅）
  if (subscribers > 0 && views > 0) {
    const viewToSubRatio = views / subscribers;
    if (viewToSubRatio > 0.5) {
      diagnosis.strengths.push('该视频表现超过粉丝基数，有破圈潜力');
      diagnosis.score += 15;
    }
  }

  return diagnosis;
}

// 格式化时长
function formatDuration(seconds: number): string {
  if (!seconds) return '0秒';
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
