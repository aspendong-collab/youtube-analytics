#!/usr/bin/env node

/**
 * 测试 DeepSeek API 英文关键词生成
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
console.log('DeepSeek API 英文关键词生成测试');
console.log('========================================\n');

// 测试 API 调用
async function testDeepSeekAPI() {
  try {
    const keyword = 'pdf';

    const prompt = `Please generate the following types of words for the keyword "${keyword}" (do NOT include the original word "${keyword}"):

1. Synonyms (5-8 words): words with similar meanings
2. Antonyms (3-5 words): words with opposite meanings
3. Related words (8-10 words): highly relevant words users might also search for

Requirements:
- Return ONLY English words, do NOT include the original word
- Each word should be 1-4 words long
- Ensure words have actual search value
- Exclude brand names, proper names, place names

Please return in the following JSON format (do NOT include any other text):
{
  "synonyms": ["word1", "word2", "word3", ...],
  "ants": ["word1", "word2", "word3", ...],
  "related": ["word1", "word2", "word3", ...]
}`;

    console.log('正在测试英文关键词生成...\n');
    console.log('关键词:', keyword);
    console.log('提示词:', prompt.substring(0, 100) + '...\n');

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
            content: 'You are a professional keyword analysis expert specializing in generating semantically related keywords.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
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

    const content = data.choices?.[0]?.message?.content;
    if (content) {
      console.log('生成的内容:');
      console.log(content);

      // 尝试解析 JSON
      try {
        const parsed = JSON.parse(content);
        console.log('\n解析结果:');
        console.log(JSON.stringify(parsed, null, 2));

        // 检查是否为英文
        const allWords = [...(parsed.synonyms || []), ...(parsed.ants || []), ...(parsed.related || [])];
        const hasChinese = allWords.some(word => /[\u4e00-\u9fa5]/.test(word));

        if (hasChinese) {
          console.log('\n⚠️ 警告：生成的词语包含中文');
        } else {
          console.log('\n✅ 所有词语都是英文');
        }
      } catch (e) {
        console.log('\n⚠️ 无法解析为 JSON');
        console.log('错误:', e.message);
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
