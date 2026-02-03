import postgres from 'postgres';

const NEON_DATABASE_URL = process.env.PGDATABASE_URL || 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function cleanupDemoData() {
  console.log('========================================');
  console.log('开始清理演示数据');
  console.log('========================================');
  console.log('');

  const client = postgres(NEON_DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    // 1. 检查 influencers 表是否存在
    console.log('1. 检查数据库表...');
    const tables = await client.unsafe(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('数据库中的表:');
    tables.forEach((table: any) => {
      console.log(`  - ${table.table_name}`);
    });
    console.log('');

    // 2. 检查各表的数据量
    console.log('2. 检查各表的数据量...');

    const [videosCount] = await client.unsafe('SELECT COUNT(*) as count FROM videos');
    console.log(`  videos: ${videosCount.count} 条记录`);

    const [videoStatsCount] = await client.unsafe('SELECT COUNT(*) as count FROM video_stats');
    console.log(`  video_stats: ${videoStatsCount.count} 条记录`);

    const [ownersCount] = await client.unsafe('SELECT COUNT(*) as count FROM owners');
    console.log(`  owners: ${ownersCount.count} 条记录`);

    const [usersCount] = await client.unsafe('SELECT COUNT(*) as count FROM users');
    console.log(`  users: ${usersCount.count} 条记录`);

    // 检查 comments 表
    const hasCommentsTable = tables.some((table: any) => table.table_name === 'comments');
    let commentsCount = 0;
    if (hasCommentsTable) {
      const [count] = await client.unsafe('SELECT COUNT(*) as count FROM comments');
      commentsCount = count.count;
      console.log(`  comments: ${commentsCount} 条记录`);
    }

    // 检查 influencers 表
    const hasInfluencersTable = tables.some((table: any) => table.table_name === 'influencers');
    let influencersCount = 0;
    if (hasInfluencersTable) {
      const [count] = await client.unsafe('SELECT COUNT(*) as count FROM influencers');
      influencersCount = count.count;
      console.log(`  influencers: ${influencersCount} 条记录`);
    }

    console.log('');

    // 3. 确认删除
    console.log('3. 准备删除演示数据...');
    console.log('将要删除的数据:');
    console.log(`  - videos: ${videosCount.count} 条`);
    console.log(`  - video_stats: ${videoStatsCount.count} 条`);
    console.log(`  - comments: ${commentsCount.count} 条`);
    if (hasInfluencersTable) {
      console.log(`  - influencers: ${influencersCount} 条`);
    }
    console.log('');

    // 删除数据
    console.log('4. 开始删除数据...');

    // 删除视频统计数据
    const deletedVideoStats = await client.unsafe('DELETE FROM video_stats RETURNING *');
    console.log(`  ✓ 已删除 video_stats 表中的 ${deletedVideoStats.length} 条记录`);

    // 删除视频
    const deletedVideos = await client.unsafe('DELETE FROM videos RETURNING *');
    console.log(`  ✓ 已删除 videos 表中的 ${deletedVideos.length} 条记录`);

    // 删除评论
    let deletedComments = 0;
    if (hasCommentsTable) {
      const result = await client.unsafe('DELETE FROM comments RETURNING *');
      deletedComments = result.length;
      console.log(`  ✓ 已删除 comments 表中的 ${deletedComments} 条记录`);
    } else {
      console.log(`  ℹ comments 表不存在，跳过`);
    }

    // 删除 influencers（如果存在）
    let deletedInfluencers = 0;
    if (hasInfluencersTable) {
      const result = await client.unsafe('DELETE FROM influencers RETURNING *');
      deletedInfluencers = result.length;
      console.log(`  ✓ 已删除 influencers 表中的 ${deletedInfluencers} 条记录`);
    }

    console.log('');

    // 5. 验证清理结果
    console.log('5. 验证清理结果...');

    const [videosCountAfter] = await client.unsafe('SELECT COUNT(*) as count FROM videos');
    const [videoStatsCountAfter] = await client.unsafe('SELECT COUNT(*) as count FROM video_stats');

    console.log(`  videos: ${videosCountAfter.count} 条记录（应为 0）`);
    console.log(`  video_stats: ${videoStatsCountAfter.count} 条记录（应为 0）`);

    if (hasCommentsTable) {
      const [commentsCountAfter] = await client.unsafe('SELECT COUNT(*) as count FROM comments');
      console.log(`  comments: ${commentsCountAfter.count} 条记录（应为 0）`);
    }

    if (hasInfluencersTable) {
      const [influencersCountAfter] = await client.unsafe('SELECT COUNT(*) as count FROM influencers');
      console.log(`  influencers: ${influencersCountAfter.count} 条记录（应为 0）`);
    }

    console.log('');

    // 显示剩余的系统数据
    console.log('6. 保留的系统数据:');

    const [ownersCountAfter] = await client.unsafe('SELECT COUNT(*) as count FROM owners');
    console.log(`  owners: ${ownersCountAfter.count} 条记录（保留）`);

    const [usersCountAfter] = await client.unsafe('SELECT COUNT(*) as count FROM users');
    console.log(`  users: ${usersCountAfter.count} 条记录（保留）`);

    console.log('');
    console.log('========================================');
    console.log('✅ 演示数据清理完成！');
    console.log('========================================');
    console.log('');
    console.log('已删除的数据:');
    console.log(`  - videos: ${deletedVideos.length} 条`);
    console.log(`  - video_stats: ${deletedVideoStats.length} 条`);
    console.log(`  - comments: ${deletedComments.length} 条`);
    if (hasInfluencersTable) {
      console.log(`  - influencers: ${deletedInfluencers} 条`);
    }
    console.log('');
    console.log('保留的数据:');
    console.log(`  - owners: ${ownersCountAfter.count} 条`);
    console.log(`  - users: ${usersCountAfter.count} 条`);
    console.log('');

  } catch (error) {
    console.error('❌ 清理失败:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// 执行清理
cleanupDemoData()
  .then(() => {
    console.log('✅ 脚本执行成功');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
