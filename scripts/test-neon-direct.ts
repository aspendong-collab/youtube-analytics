import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

async function testNeonDatabase() {
  // 直接使用 Neon 数据库连接
  const connectionString = 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

  const maskedUrl = connectionString.replace(/\/\/[^@]+@/, '//***@');
  console.log('🔗 Connecting to Neon database:');
  console.log('   ', maskedUrl);

  const client = postgres(connectionString);

  try {
    // 测试连接
    await client`SELECT 1`;
    console.log('✅ Connection successful\n');

    // 检查表是否存在
    const tables = await client`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('📋 Tables in Neon database:');
    if (tables.length === 0) {
      console.log('   ⚠️  No tables found!');
    } else {
      tables.forEach((table: any) => {
        console.log(`   - ${table.table_name}`);
      });
    }

    // 检查 users 表
    const usersTableExists = tables.some((t: any) => t.table_name === 'users');
    if (!usersTableExists) {
      console.log('\n❌ Users table does not exist');
    } else {
      // 查询用户
      const users = await client`
        SELECT email, name, role, status, created_at
        FROM users
        ORDER BY created_at DESC
      `;

      console.log('\n👥 Users in database:');
      if (users.length === 0) {
        console.log('   ⚠️  No users found!');
        console.log('   💡 Need to create admin account');
      } else {
        users.forEach((user: any) => {
          console.log(`   - ${user.email} (${user.name})`);
          console.log(`     Role: ${user.role}, Status: ${user.status}`);
        });
      }
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.code === '3D000') {
      console.log('💡 Database does not exist. Need to create it first.');
    }
  } finally {
    await client.end();
  }
}

testNeonDatabase();
