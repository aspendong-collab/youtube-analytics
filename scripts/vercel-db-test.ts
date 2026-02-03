import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/storage/database/shared/schema';

async function testDatabase() {
  // 从环境变量获取数据库连接
  const connectionString = process.env.PGDATABASE_URL || 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

  const maskedUrl = connectionString.replace(/\/\/[^@]+@/, '//***@');
  console.log('🔗 Connecting to database:', maskedUrl);
  console.log('🔗 Using environment variable:', !!process.env.PGDATABASE_URL);

  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  try {
    // 检查连接
    await client`SELECT 1`;
    console.log('✅ Database connection successful');

    // 检查 users 表
    const usersExist = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
    `;

    if (usersExist.length > 0) {
      console.log('✅ Users table exists');

      // 查询用户数量
      const userCount = await client`SELECT COUNT(*) as count FROM users`;
      console.log('👥 Total users:', userCount[0]?.count || 0);

      // 列出所有用户（仅 email 和 status）
      const userList = await client`
        SELECT id, email, name, role, status, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 10
      `;

      console.log('\n📋 Recent users:');
      userList.forEach((user: any) => {
        console.log(`  - ${user.email} (${user.name}) - Role: ${user.role}, Status: ${user.status}`);
      });
    } else {
      console.log('❌ Users table does not exist');
    }

    // 列出所有表
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('\n📊 All tables in database:');
    tables.forEach((table: any) => {
      console.log(`  - ${table.table_name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

testDatabase();
