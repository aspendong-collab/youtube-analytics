import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/storage/database/shared/schema';

// 从环境变量获取数据库连接字符串
const connectionString = process.env.PGDATABASE_URL;

// 检查是否在构建时
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' ||
                    process.env.NODE_ENV === undefined;

// 检查是否在开发环境
const isDev = process.env.NODE_ENV === 'development';

// 创建 PostgreSQL 连接
let client;
let db;

if (!connectionString) {
  if (isBuildTime || isDev) {
    // 构建时或开发环境返回模拟数据库，避免构建失败
    console.warn('[DB] PGDATABASE_URL not set, using mock database');
    client = null;
    db = null;
  } else {
    throw new Error('PGDATABASE_URL environment variable is not set');
  }
} else {
  try {
    client = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    db = drizzle(client, { schema });
  } catch (error) {
    if (isDev) {
      console.warn('[DB] Database connection failed, using mock database:', error);
      db = null;
    } else {
      throw error;
    }
  }
}

// 创建 Drizzle ORM 实例
export const dbInstance = db;

// 导出 schema
export * from '@/storage/database/shared/schema';
