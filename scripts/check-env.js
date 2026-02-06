#!/usr/bin/env node

/**
 * 检查环境变量配置
 */

console.log('========================================');
console.log('环境变量检查');
console.log('========================================\n');

// 检查 DeepSeek API Key
if (process.env.DEEPSEEK_API_KEY) {
  console.log('✅ DEEPSEEK_API_KEY: 已配置');
  console.log('   长度:', process.env.DEEPSEEK_API_KEY.length, '字符');
  console.log('   前缀:', process.env.DEEPSEEK_API_KEY.substring(0, 10) + '...');
} else {
  console.log('❌ DEEPSEEK_API_KEY: 未配置');
  console.log('   需要在 .env.local 或 Vercel 环境变量中添加');
}

console.log();

// 检查 YouTube API Key
if (process.env.YOUTUBE_API_KEY) {
  console.log('✅ YOUTUBE_API_KEY: 已配置');
  console.log('   长度:', process.env.YOUTUBE_API_KEY.length, '字符');
  console.log('   前缀:', process.env.YOUTUBE_API_KEY.substring(0, 10) + '...');
} else {
  console.log('❌ YOUTUBE_API_KEY: 未配置');
}

// 检查多个 YouTube API Key
for (let i = 1; i <= 10; i++) {
  const key = process.env[`YOUTUBE_API_KEY_${i}`];
  if (key) {
    console.log(`✅ YOUTUBE_API_KEY_${i}: 已配置`);
  }
}

console.log();

// 检查数据库连接
if (process.env.PGDATABASE_URL) {
  console.log('✅ PGDATABASE_URL: 已配置');
  const url = new URL(process.env.PGDATABASE_URL);
  console.log('   主机:', url.hostname);
  console.log('   数据库:', url.pathname.substring(1));
} else {
  console.log('❌ PGDATABASE_URL: 未配置');
}

console.log();

// 检查 NextAuth 配置
if (process.env.NEXTAUTH_URL) {
  console.log('✅ NEXTAUTH_URL: 已配置');
  console.log('   URL:', process.env.NEXTAUTH_URL);
} else {
  console.log('❌ NEXTAUTH_URL: 未配置');
}

if (process.env.NEXTAUTH_SECRET) {
  console.log('✅ NEXTAUTH_SECRET: 已配置');
  console.log('   长度:', process.env.NEXTAUTH_SECRET.length, '字符');
} else {
  console.log('❌ NEXTAUTH_SECRET: 未配置');
}

console.log();
console.log('========================================');
console.log('检查完成');
console.log('========================================');
