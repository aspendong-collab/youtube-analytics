import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/storage/database/shared/schema';

// 从环境变量获取数据库连接字符串
const connectionString = process.env.PGDATABASE_URL;

if (!connectionString) {
  throw new Error('PGDATABASE_URL environment variable is not set');
}

// 创建 PostgreSQL 连接
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// 创建 Drizzle ORM 实例
export const db = drizzle(client, { schema });

// 导出 schema
export * from '@/storage/database/shared/schema';
