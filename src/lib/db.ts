import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/storage/database/shared/schema';

// 从环境变量获取数据库连接字符串
const connectionString = process.env.PGDATABASE_URL;

// 检查是否在构建时
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' ||
                    process.env.NODE_ENV === undefined;

// 创建 PostgreSQL 连接
let client;
let db;

if (!connectionString) {
  if (isBuildTime) {
    // 构建时返回模拟数据库，避免构建失败
    console.warn('[DB] PGDATABASE_URL not set during build, using mock database');
    client = null;
    db = null;
  } else {
    throw new Error('PGDATABASE_URL environment variable is not set');
  }
} else {
  client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  db = drizzle(client, { schema });
}

// 创建 Drizzle ORM 实例
export const dbInstance = db;

// 导出 schema
export * from '@/storage/database/shared/schema';
