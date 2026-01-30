import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/storage/database/shared/schema';

// 硬编码的 Neon 数据库连接（确保始终使用正确的连接）
const NEON_DATABASE_URL = 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// 从环境变量获取数据库连接字符串，如果未设置则使用硬编码值
const connectionString = process.env.PGDATABASE_URL || NEON_DATABASE_URL;

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
  // 脱敏输出连接字符串，方便调试
  const maskedUrl = connectionString.replace(/\/\/[^@]+@/, '//***@');
  console.log('[DB] Connecting to database:', maskedUrl);
  console.log('[DB] Using environment variable:', !!process.env.PGDATABASE_URL);

  try {
    client = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    db = drizzle(client, { schema });
    console.log('[DB] Database connection established successfully');
  } catch (error) {
    console.error('[DB] Database connection failed:', error);
    if (isDev) {
      console.warn('[DB] Using mock database due to connection failure');
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
