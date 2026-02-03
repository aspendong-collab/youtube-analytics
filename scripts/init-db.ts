import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/storage/database/shared/schema';

async function initDatabase() {
  if (!process.env.PGDATABASE_URL) {
    console.error('❌ PGDATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('🔗 Connecting to database...');

  const client = postgres(process.env.PGDATABASE_URL);
  const db = drizzle(client);

  try {
    // 检查 users 表是否存在
    const result = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
    `;

    if (result.length === 0) {
      console.log('⚠️  Users table does not exist. Please run migrations first.');
      console.log('Run: pnpm drizzle-kit generate && pnpm drizzle-kit migrate');
    } else {
      console.log('✅ Users table exists');
    }

    // 列出所有表
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('\n📊 Existing tables:');
    tables.forEach((table: any) => {
      console.log(`  - ${table.table_name}`);
    });
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await client.end();
  }
}

initDatabase();
