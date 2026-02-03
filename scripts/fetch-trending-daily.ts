import postgres from 'postgres';

const NEON_DATABASE_URL = process.env.PGDATABASE_URL || 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyBgo5bEiG0dMJ2RKp7I13eL-yk15gFcsjY';

interface TrendingVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  trendScore: number;
  trendRank: number;
}

async function fetchTrendingVideos(
  period: 'today' | 'week' | 'month',
  keywords: string[],
  maxResults: number = 50
): Promise<TrendingVideo[]> {
  const apiKey = YOUTUBE_API_KEY;
  const videos: TrendingVideo[] = [];

  try {
    // 计算时间范围
    const now = new Date();
    let publishedAfter: Date;

    if (period === 'today') {
      publishedAfter = new Date(now);
      publishedAfter.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      const dayOfWeek = now.getDay();
      const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      publishedAfter = new Date(now);
      publishedAfter.setDate(now.getDate() - daysSinceMonday);
      publishedAfter.setHours(0, 0, 0);
    } else {
      publishedAfter = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    }

    console.log(`[${period.toUpperCase()}] 时间范围:`, publishedAfter.toISOString(), '至', now.toISOString());

    // 如果没有关键词，搜索热门视频
    if (keywords.length === 0) {
      const trendingUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=US&maxResults=${maxResults}&key=${apiKey}`;
      console.log(`[${period.toUpperCase()}] 搜索热门视频...`);

      const response = await fetch(trendingUrl);
      const data = await response.json();

      if (data.items) {
        data.items.forEach((item: any, index: number) => {
          videos.push({
            id: item.id,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
            publishedAt: item.snippet.publishedAt,
            channelId: item.snippet.channelId,
            channelTitle: item.snippet.channelTitle,
            viewCount: parseInt(item.statistics.viewCount || '0'),
            likeCount: parseInt(item.statistics.likeCount || '0'),
            commentCount: parseInt(item.statistics.commentCount || '0'),
            trendScore: 100 - index, // 简化的趋势分数
            trendRank: index + 1,
          });
        });
      }
    } else {
      // 按关键词搜索
      for (const keyword of keywords) {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(keyword)}&order=viewCount&publishedAfter=${publishedAfter.toISOString()}&maxResults=${Math.ceil(maxResults / keywords.length)}&key=${apiKey}`;
        console.log(`[${period.toUpperCase()}] 搜索关键词:`, keyword);

        const response = await fetch(searchUrl);
        const data = await response.json();

        if (data.items) {
          data.items.forEach((item: any) => {
            videos.push({
              id: item.id.videoId || item.id,
              title: item.snippet.title,
              thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
              publishedAt: item.snippet.publishedAt,
              channelId: item.snippet.channelId,
              channelTitle: item.snippet.channelTitle,
              viewCount: 0, // 需要额外查询
              likeCount: 0,
              commentCount: 0,
              trendScore: 50,
              trendRank: videos.length + 1,
            });
          });
        }
      }
    }

    // 按 viewCount 排序
    videos.sort((a, b) => b.viewCount - a.viewCount);

    // 重新设置排名
    videos.forEach((video, index) => {
      video.trendRank = index + 1;
    });

    return videos;
  } catch (error) {
    console.error(`[${period.toUpperCase()}] 获取失败:`, error);
    return [];
  }
}

async function saveTrendingToDatabase(
  period: 'today' | 'week' | 'month',
  videos: TrendingVideo[]
) {
  const client = postgres(NEON_DATABASE_URL);

  try {
    console.log(`[${period.toUpperCase()}] 保存 ${videos.length} 个视频到数据库...`);

    // 检查表是否存在
    const tableExists = await client.unsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'trending_videos'
      )
    `);

    if (!tableExists[0]?.exists) {
      console.log(`[${period.toUpperCase()}] 表不存在，创建表...`);
      await client.unsafe(`
        CREATE TABLE trending_videos (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          video_id VARCHAR(20) NOT NULL,
          title VARCHAR(500) NOT NULL,
          thumbnail TEXT,
          published_at TIMESTAMP WITH TIME ZONE NOT NULL,
          channel_id VARCHAR(50),
          channel_title VARCHAR(200),
          view_count INTEGER DEFAULT 0,
          like_count INTEGER DEFAULT 0,
          comment_count INTEGER DEFAULT 0,
          trend_score INTEGER DEFAULT 0,
          trend_rank INTEGER,
          period VARCHAR(10) NOT NULL,
          fetched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        )
      `);
      await client.unsafe('CREATE INDEX trending_videos_period_idx ON trending_videos(period)');
      await client.unsafe('CREATE INDEX trending_videos_fetched_at_idx ON trending_videos(fetched_at)');
    }

    // 删除该时间段的旧数据
    await client.unsafe(
      `DELETE FROM trending_videos WHERE period = $1 AND fetched_at >= CURRENT_DATE`,
      [period]
    );

    // 插入新数据
    for (const video of videos) {
      await client.unsafe(
        `INSERT INTO trending_videos (video_id, title, thumbnail, published_at, channel_id, channel_title, view_count, like_count, comment_count, trend_score, trend_rank, period)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          video.id,
          video.title,
          video.thumbnail,
          video.publishedAt,
          video.channelId,
          video.channelTitle,
          video.viewCount,
          video.likeCount,
          video.commentCount,
          video.trendScore,
          video.trendRank,
          period,
        ]
      );
    }

    console.log(`[${period.toUpperCase()}] 保存完成！`);
  } catch (error) {
    console.error(`[${period.toUpperCase()}] 保存失败:`, error);
    throw error;
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('========================================');
  console.log('自动抓取热门内容排行榜');
  console.log('========================================');
  console.log('');

  const periods: Array<'today' | 'week' | 'month'> = ['today', 'week', 'month'];

  // 可配置的关键词列表
  const keywords: string[] = []; // 留空表示搜索热门视频

  for (const period of periods) {
    console.log(`========================================`);
    console.log(`获取 ${period.toUpperCase()} 热门内容`);
    console.log(`========================================`);

    try {
      // 获取热门视频
      const videos = await fetchTrendingVideos(period, keywords, 50);

      if (videos.length === 0) {
        console.log(`[${period.toUpperCase()}] 未找到视频，跳过保存`);
        console.log('');
        continue;
      }

      // 保存到数据库
      await saveTrendingToDatabase(period, videos);

      console.log(`[${period.toUpperCase()}] 完成！找到 ${videos.length} 个热门视频`);
    } catch (error) {
      console.error(`[${period.toUpperCase()}] 失败:`, error);
    }

    console.log('');
  }

  console.log('========================================');
  console.log('✅ 所有时间段的热门内容抓取完成！');
  console.log('========================================');
}

// 执行
main()
  .then(() => {
    console.log('✅ 脚本执行成功');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
