import postgres from 'postgres';

const NEON_DATABASE_URL = process.env.PGDATABASE_URL || 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function cleanupAllDemoData() {
  console.log('========================================');
  console.log('清理所有演示数据');
  console.log('========================================');
  console.log('');

  const client = postgres(NEON_DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    // 1. 检查各表的数据量
    console.log('1. 检查各表的数据量...');

    const [videosCount] = await client.unsafe('SELECT COUNT(*) as count FROM videos');
    console.log(`  videos: ${videosCount.count} 条记录`);

    const [videoStatsCount] = await client.unsafe('SELECT COUNT(*) as count FROM video_stats');
    console.log(`  video_stats: ${videoStatsCount.count} 条记录`);

    const [ownersCount] = await client.unsafe('SELECT COUNT(*) as count FROM owners');
    console.log(`  owners: ${ownersCount.count} 条记录`);

    const [usersCount] = await client.unsafe('SELECT COUNT(*) as count FROM users');
    console.log(`  users: ${usersCount.count} 条记录`);

    // 检查 comments 表
    const tables = await client.unsafe(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

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
    console.log('⚠️  警告：此操作将删除以下所有数据');
    console.log(`  - videos: ${videosCount.count} 条`);
    console.log(`  - video_stats: ${videoStatsCount.count} 条`);
    console.log(`  - owners: ${ownersCount.count} 条`);
    console.log(`  - users: ${usersCount.count} 条`);
    if (hasCommentsTable) {
      console.log(`  - comments: ${commentsCount} 条`);
    }
    if (hasInfluencersTable) {
      console.log(`  - influencers: ${influencersCount} 条`);
    }
    console.log('');

    // 删除数据（按照依赖关系顺序）
    console.log('2. 开始删除演示数据...');

    // 删除视频统计数据
    const deletedVideoStats = await client.unsafe('DELETE FROM video_stats RETURNING *');
    console.log(`  ✓ 已删除 video_stats 表中的 ${deletedVideoStats.length} 条记录`);

    // 删除视频
    const deletedVideos = await client.unsafe('DELETE FROM videos RETURNING *');
    console.log(`  ✓ 已删除 videos 表中的 ${deletedVideos.length} 条记录`);

    // 删除评论
    if (hasCommentsTable) {
      const deletedComments = await client.unsafe('DELETE FROM comments RETURNING *');
      console.log(`  ✓ 已删除 comments 表中的 ${deletedComments.length} 条记录`);
    } else {
      console.log(`  ℹ comments 表不存在，跳过`);
    }

    // 删除 influencers（如果存在）
    if (hasInfluencersTable) {
      const deletedInfluencers = await client.unsafe('DELETE FROM influencers RETURNING *');
      console.log(`  ✓ 已删除 influencers 表中的 ${deletedInfluencers.length} 条记录`);
    } else {
      console.log(`  ℹ influencers 表不存在，跳过`);
    }

    // 删除 owners
    const deletedOwners = await client.unsafe('DELETE FROM owners RETURNING *');
    console.log(`  ✓ 已删除 owners 表中的 ${deletedOwners.length} 条记录`);

    // 删除 users
    const deletedUsers = await client.unsafe('DELETE FROM users RETURNING *');
    console.log(`  ✓ 已删除 users 表中的 ${deletedUsers.length} 条记录`);

    console.log('');

    // 3. 验证清理结果
    console.log('3. 验证清理结果...');

    const [videosCountAfter] = await client.unsafe('SELECT COUNT(*) as count FROM videos');
    const [videoStatsCountAfter] = await client.unsafe('SELECT COUNT(*) as count FROM video_stats');
    const [ownersCountAfter] = await client.unsafe('SELECT COUNT(*) as count FROM owners');
    const [usersCountAfter] = await client.unsafe('SELECT COUNT(*) as count FROM users');

    console.log(`  videos: ${videosCountAfter.count} 条记录（应为 0）`);
    console.log(`  video_stats: ${videoStatsCountAfter.count} 条记录（应为 0）`);
    console.log(`  owners: ${ownersCountAfter.count} 条记录（应为 0）`);
    console.log(`  users: ${usersCountAfter.count} 条记录（应为 0）`);

    if (hasCommentsTable) {
      const [commentsCountAfter] = await client.unsafe('SELECT COUNT(*) as count FROM comments');
      console.log(`  comments: ${commentsCountAfter.count} 条记录（应为 0）`);
    }

    if (hasInfluencersTable) {
      const [influencersCountAfter] = await client.unsafe('SELECT COUNT(*) as count FROM influencers');
      console.log(`  influencers: ${influencersCountAfter.count} 条记录（应为 0）`);
    }

    console.log('');
    console.log('========================================');
    console.log('✅ 所有演示数据清理完成！');
    console.log('========================================');
    console.log('');
    console.log('已删除的数据:');
    console.log(`  - videos: ${deletedVideos.length} 条`);
    console.log(`  - video_stats: ${deletedVideoStats.length} 条`);
    console.log(`  - owners: ${deletedOwners.length} 条`);
    console.log(`  - users: ${deletedUsers.length} 条`);
    if (hasCommentsTable) {
      console.log(`  - comments: ${deletedComments?.length || 0} 条`);
    }
    if (hasInfluencersTable) {
      console.log(`  - influencers: ${deletedInfluencers?.length || 0} 条`);
    }
    console.log('');
    console.log('⚠️  重要提示:');
    console.log('  - 所有用户账号已被删除');
    console.log('  - 所有负责人信息已被删除');
    console.log('  - 需要重新注册用户账号');
    console.log('  - 首个注册的用户将自动成为管理员');
    console.log('');

  } catch (error) {
    console.error('❌ 清理失败:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// 执行清理
cleanupAllDemoData()
  .then(() => {
    console.log('✅ 脚本执行成功');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
