#!/usr/bin/env node

/**
 * YouTube API Key 配置助手
 * 自动检测并帮助配置 YouTube API Key
 */

const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('YouTube API Key 配置助手');
console.log('========================================\n');

const envLocalPath = path.join(__dirname, '../.env.local');

// 检查 .env.local 文件是否存在
if (!fs.existsSync(envLocalPath)) {
  console.log('❌ .env.local 文件不存在');
  console.log('   正在创建 .env.local 文件...\n');

  // 创建 .env.local 文件
  fs.writeFileSync(envLocalPath, '', 'utf8');
  console.log('✅ 已创建 .env.local 文件\n');
}

// 读取现有内容
let envContent = fs.readFileSync(envLocalPath, 'utf8');

// 检查是否已配置 YouTube API Key
const hasYouTubeKey = envContent.includes('YOUTUBE_API_KEY_');

if (hasYouTubeKey) {
  console.log('✅ 检测到已配置 YouTube API Key');
  console.log('   当前配置：\n');

  // 提取并显示已配置的 Key
  const keyMatches = envContent.match(/^YOUTUBE_API_KEY_\d+=.*$/gm);
  if (keyMatches) {
    keyMatches.forEach((match, index) => {
      console.log(`   ${index + 1}. ${match}`);
    });
  }

  const keyCount = keyMatches ? keyMatches.length : 0;
  console.log(`\n   共 ${keyCount} 个 Key\n`);
} else {
  console.log('❌ 未检测到 YouTube API Key 配置');
  console.log('   需要从 Vercel 拉取或手动配置\n');
}

// 提供配置建议
console.log('========================================');
console.log('配置建议');
console.log('========================================\n');

console.log('方法 1：从 Vercel 拉取（推荐）');
console.log('   运行命令：vercel env pull .env.local');
console.log('   这将从 Vercel 拉取所有环境变量到本地\n');

console.log('方法 2：从 Vercel Dashboard 手动复制');
console.log('   1. 访问 https://vercel.com/dashboard');
console.log('   2. 进入您的项目 → Settings → Environment Variables');
console.log('   3. 复制 YOUTUBE_API_KEY_1 到 YOUTUBE_API_KEY_5 的值');
console.log('   4. 粘贴到 .env.local 文件中\n');

console.log('方法 3：使用示例配置');
console.log('   在 .env.local 中添加以下内容：\n');
console.log('   # YouTube API Key 配置');
console.log('   YOUTUBE_API_KEY_1=your_first_key_here');
console.log('   YOUTUBE_API_KEY_2=your_second_key_here');
console.log('   YOUTUBE_API_KEY_3=your_third_key_here');
console.log('   YOUTUBE_API_KEY_4=your_fourth_key_here');
console.log('   YOUTUBE_API_KEY_5=your_fifth_key_here\n');

// 验证命令
console.log('========================================');
console.log('验证配置');
console.log('========================================\n');

console.log('配置完成后，运行以下命令验证：');
console.log('  1. 重启开发服务器：pnpm dev');
console.log('  2. 访问：http://localhost:5000/api/check-env-youtube');
console.log('  3. 检查返回的配置状态\n');

console.log('========================================');
console.log('配置助手完成');
console.log('========================================\n');
