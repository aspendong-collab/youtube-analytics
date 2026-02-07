import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';

// 硬编码的 Neon 数据库连接（确保始终使用正确的连接）
const NEON_DATABASE_URL = 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// 从环境变量获取数据库连接字符串，如果未设置则使用硬编码值
const connectionString = process.env.PGDATABASE_URL || NEON_DATABASE_URL;

// 数据库实例
let _client: postgres.Sql | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

// 检查是否在构建时（只在明确的构建阶段跳过数据库初始化）
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

/**
 * 获取数据库实例
 */
export function getDb() {
  if (isBuildTime) {
    console.warn('[DB] Build time detected, skipping database initialization');
    return null;
  }

  if (!_db) {
    try {
      // 创建 postgres 客户端
      if (!_client) {
        const maskedUrl = connectionString.replace(/\/\/[^@]+@/, '//***@');
        console.log('[DB] Connecting to database:', maskedUrl);

        _client = postgres(connectionString, {
          max: 10,
          idle_timeout: 20,
          connect_timeout: 10,
        });
      }

      // 创建 drizzle 实例（不使用 schema，直接使用导入的表）
      _db = drizzle(_client);
      console.log('[DB] Database connection established');
    } catch (error) {
      console.error('[DB] Database connection failed:', error);
      throw error;
    }
  }

  return _db;
}

// 导出 dbInstance（向后兼容）
export const dbInstance = new Proxy({}, {
  get(target, prop) {
    const db = getDb();
    
    if (!db) {
      throw new Error('Database not available');
    }

    const propStr = String(prop);
    const value = (db as any)[propStr];
    
    // 如果属性不存在，返回 undefined（而不是抛出错误）
    // 这样可以兼容 drizzle 内部属性
    return value;
  }
}) as any;

// 导出 raw 方法
export const raw = (strings: TemplateStringsArray, ...values: any[]) => {
  return sql(strings, ...values);
};

// 导出 sql
export { sql };
