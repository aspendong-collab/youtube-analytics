import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.PGDATABASE_URL;

console.log('正在连接数据库...');

const sql = postgres(connectionString);

console.log('读取迁移文件...');
const migrationFile = fs.readFileSync(
  path.join(__dirname, '../drizzle/0000_square_unicorn.sql'),
  'utf-8'
);

// 分割 SQL 语句
const statements = migrationFile
  .split('--> statement-breakpoint')
  .map(s => s.trim())
  .filter(s => s.length > 0);

console.log(`找到 ${statements.length} 条 SQL 语句`);

for (const statement of statements) {
  try {
    await sql.unsafe(statement);
    console.log('✓ 执行成功');
  } catch (error) {
    // 忽略表已存在的错误
    if (error.message.includes('already exists')) {
      console.log('⚠️ 表已存在，跳过');
    } else {
      console.error('✗ 执行失败:', error.message);
      throw error;
    }
  }
}

console.log('数据库设置完成！');

await sql.end();
