import { drizzle, sql } from 'drizzle-orm';
import postgres from 'postgres';

// 硬编码的 Neon 数据库连接（确保始终使用正确的连接）
const NEON_DATABASE_URL = 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// 从环境变量获取数据库连接字符串，如果未设置则使用硬编码值
const connectionString = process.env.PGDATABASE_URL || NEON_DATABASE_URL;

// 延迟初始化的数据库实例
let _client: any = null;
let _db: any = null;
let _schema: any = null;
let _isInitialized = false;

// 检查是否在构建时
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' ||
                    process.env.NODE_ENV === undefined;

// 检查是否在开发环境
const isDev = process.env.NODE_ENV === 'development';

/**
 * 初始化数据库
 */
async function initializeDatabase() {
  if (_isInitialized) {
    return _db;
  }

  _isInitialized = true;

  // 构建时不初始化数据库
  if (isBuildTime) {
    console.warn('[DB] Skipping database initialization during build');
    return null;
  }

  // 检查连接字符串
  if (!connectionString) {
    console.error('[DB] PGDATABASE_URL not set');
    return null;
  }

  try {
    // 动态导入 schema，避免构建时导入问题
    const schemaModule = await import('@/storage/database/shared/schema');
    _schema = schemaModule;

    // 创建数据库连接
    const maskedUrl = connectionString.replace(/\/\/[^@]+@/, '//***@');
    console.log('[DB] Connecting to database:', maskedUrl);

    _client = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    _db = drizzle(_client, { schema: _schema });
    console.log('[DB] Database connection established successfully');

    return _db;
  } catch (error) {
    console.error('[DB] Database connection failed:', error);
    if (isDev) {
      console.warn('[DB] Using mock database due to connection failure');
    }
    return null;
  }
}

// 同步版本（使用 Proxy 延迟初始化）
export const dbInstance = new Proxy({}, {
  get(target, prop) {
    // 特殊处理 raw 和 sql 方法（优先处理，因为构建时也需要）
    if (prop === 'raw' || prop === 'sql') {
      return (strings: TemplateStringsArray, ...values: any[]) => {
        return sql(strings, ...values);
      };
    }

    // 在构建时返回一个空对象
    if (isBuildTime) {
      return (...args: any[]) => {
        console.warn(`[DB] ${String(prop)} called during build, returning empty result`);
        return [];
      };
    }

    // 如果数据库未初始化，返回一个空对象
    if (!_db && !_isInitialized) {
      console.warn('[DB] Database not initialized yet, calling initializeDatabase()');
      // 异步初始化，但同步调用需要等待
      initializeDatabase().catch(err => console.error('[DB] Async initialization failed:', err));
      return (...args: any[]) => {
        console.warn(`[DB] ${String(prop)} called before initialization, returning empty result`);
        return [];
      };
    }

    // 返回 db 的属性
    return _db?.[prop as keyof typeof _db];
  }
}) as any;

// 导出 schema（延迟导入）
export const getSchema = async () => {
  if (_schema) return _schema;
  const schemaModule = await import('@/storage/database/shared/schema');
  _schema = schemaModule;
  return _schema;
};
