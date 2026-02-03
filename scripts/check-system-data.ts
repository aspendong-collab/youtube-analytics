import postgres from 'postgres';

const NEON_DATABASE_URL = process.env.PGDATABASE_URL || 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function checkSystemData() {
  console.log('========================================');
  console.log('检查系统数据（owners 和 users）');
  console.log('========================================');
  console.log('');

  const client = postgres(NEON_DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    // 检查 owners 表
    console.log('1. owners 表数据:');
    const owners = await client.unsafe('SELECT * FROM owners');
    console.log(`  总记录数: ${owners.length}`);
    owners.forEach((owner: any, index: number) => {
      console.log(`  记录 ${index + 1}:`);
      console.log(`    ID: ${owner.id}`);
      console.log(`    姓名: ${owner.name}`);
      console.log(`    邮箱: ${owner.email || '无'}`);
      console.log(`    是否活跃: ${owner.is_active}`);
      console.log(`    创建时间: ${owner.created_at}`);
    });
    console.log('');

    // 检查 users 表
    console.log('2. users 表数据:');
    const users = await client.unsafe('SELECT id, email, name, role, status, is_active, created_at FROM users');
    console.log(`  总记录数: ${users.length}`);
    users.forEach((user: any, index: number) => {
      console.log(`  记录 ${index + 1}:`);
      console.log(`    ID: ${user.id}`);
      console.log(`    姓名: ${user.name}`);
      console.log(`    邮箱: ${user.email}`);
      console.log(`    角色: ${user.role}`);
      console.log(`    状态: ${user.status}`);
      console.log(`    是否活跃: ${user.is_active}`);
      console.log(`    创建时间: ${user.created_at}`);
      console.log(`    最后登录: ${user.last_login_at || '从未登录'}`);
    });
    console.log('');

    console.log('========================================');
    console.log('✅ 系统数据检查完成');
    console.log('========================================');
    console.log('');
    console.log('判断是否为演示数据的标准:');
    console.log('  - owners: 通常保留真实的负责人数据');
    console.log('  - users: 检查是否为测试账号（如 admin@test.com）');
    console.log('  - 如果发现演示数据，建议手动清理');
    console.log('');

  } catch (error) {
    console.error('❌ 检查失败:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// 执行检查
checkSystemData()
  .then(() => {
    console.log('✅ 脚本执行成功');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
