import postgres from 'postgres';

// 数据库连接
const NEON_DATABASE_URL = 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function cleanupDeletedVideos() {
  const client = postgres(NEON_DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    console.log('开始清理已软删除的视频...');

    // 1. 获取所有已软删除的视频
    const deletedVideos = await client.unsafe(`
      SELECT id, video_id, title FROM videos WHERE is_active = false
    `);

    console.log(`找到 ${deletedVideos.length} 个已软删除的视频`);

    if (deletedVideos.length === 0) {
      console.log('没有需要清理的视频');
      return;
    }

    // 2. 删除这些视频的统计数据
    const videoIds = deletedVideos.map((v: any) => v.video_id);
    const deletedStatsResult = await client.unsafe(`
      DELETE FROM video_stats WHERE video_id = ANY($1)
    `, [videoIds]);

    console.log(`删除了 ${deletedStatsResult.count} 条统计数据`);

    // 3. 删除视频记录
    const deletedVideosResult = await client.unsafe(`
      DELETE FROM videos WHERE is_active = false
    `);

    console.log(`删除了 ${deletedVideosResult.count} 个视频记录`);

    console.log('清理完成！');

    // 显示被删除的视频列表
    console.log('\n被删除的视频列表：');
    deletedVideos.forEach((v: any) => {
      console.log(`- ${v.title} (ID: ${v.id}, video_id: ${v.video_id})`);
    });

  } catch (error) {
    console.error('清理失败:', error);
  } finally {
    await client.end();
  }
}

cleanupDeletedVideos();
