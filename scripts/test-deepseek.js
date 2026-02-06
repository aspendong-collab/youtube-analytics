#!/usr/bin/env node

/**
 * 测试 DeepSeek API 连接
 */

// 读取 .env.local 文件
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

// 解析环境变量
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && !key.startsWith('#')) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

// 设置环境变量
process.env.DEEPSEEK_API_KEY = envVars.DEEPSEEK_API_KEY;

console.log('========================================');
console.log('DeepSeek API 连接测试');
console.log('========================================\n');

// 检查 API Key
if (!process.env.DEEPSEEK_API_KEY) {
  console.log('❌ DEEPSEEK_API_KEY 未配置');
  process.exit(1);
}

console.log('✅ DEEPSEEK_API_KEY 已配置');
console.log('   长度:', process.env.DEEPSEEK_API_KEY.length, '字符');
console.log('   前缀:', process.env.DEEPSEEK_API_KEY.substring(0, 10) + '...\n');

// 测试 API 调用
async function testDeepSeekAPI() {
  try {
    console.log('正在测试 DeepSeek API 调用...\n');

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个关键词分析专家。'
          },
          {
            role: 'user',
            content: '请为关键词"pdf"生成3个近义词，只返回JSON格式：{"synonyms": ["词1", "词2", "词3"]}'
          }
        ],
        temperature: 0.7,
        max_tokens: 100
      })
    });

    console.log('响应状态:', response.status, response.statusText, '\n');

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ API 调用失败');
      console.log('错误详情:', errorText);
      process.exit(1);
    }

    const data = await response.json();
    console.log('✅ API 调用成功\n');

    console.log('返回数据:');
    console.log(JSON.stringify(data, null, 2));

    const content = data.choices?.[0]?.message?.content;
    if (content) {
      console.log('\n生成的内容:');
      console.log(content);

      // 尝试解析 JSON
      try {
        const parsed = JSON.parse(content);
        console.log('\n解析结果:');
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('\n⚠️ 无法解析为 JSON');
      }
    }

  } catch (error) {
    console.log('❌ 请求异常');
    console.log('错误信息:', error.message);
    process.exit(1);
  }
}

console.log('========================================\n');

testDeepSeekAPI().then(() => {
  console.log('\n========================================');
  console.log('测试完成');
  console.log('========================================\n');
  process.exit(0);
}).catch((error) => {
  console.log('\n========================================');
  console.log('测试失败');
  console.log('========================================\n');
  console.error(error);
  process.exit(1);
});
