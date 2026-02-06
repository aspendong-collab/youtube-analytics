/**
 * YouTube API Key 池测试工具
 * 用于验证 Key 池管理功能
 */

import { youtubeApiKeyPool } from '@/lib/services/youtube-api-key-pool';
import { google } from 'googleapis';

/**
 * 测试 Key 池初始化
 */
export async function testKeyPoolInitialization() {
  console.log('\n=== 测试 Key 池初始化 ===');
  const status = youtubeApiKeyPool.getPoolStatus();

  console.log(`总 Key 数量: ${status.length}`);
  console.log(`可用 Key 数量: ${youtubeApiKeyPool.getAvailableKeyCount()}`);
  console.log(`总配额: ${status.length * 10000}`);
  console.log(`已用配额: ${status.reduce((sum, k) => sum + k.quotaUsed, 0)}`);
  console.log(`可用配额: ${status.reduce((sum, k) => sum + (k.quotaLimit - k.quotaUsed), 0)}`);

  console.log('\nKey 详情:');
  status.forEach((key, index) => {
    console.log(`\nKey ${index + 1}:`);
    console.log(`  ID: ${key.id}`);
    console.log(`  已用: ${key.quotaUsed}/${key.quotaLimit} (${((key.quotaUsed / key.quotaLimit) * 100).toFixed(2)}%)`);
    console.log(`  可用: ${key.isAvailable ? '是' : '否'}`);
    console.log(`  最后使用: ${key.lastUsed}`);
  });

  return status;
}

/**
 * 测试获取下一个 Key
 */
export async function testGetNextKey() {
  console.log('\n=== 测试获取下一个 Key ===');
  const key = youtubeApiKeyPool.getNextKey();

  if (key) {
    console.log(`成功获取 Key: ${key.substring(0, 10)}...`);
    console.log(`Key 长度: ${key.length}`);
  } else {
    console.log('没有可用的 Key');
  }

  return key;
}

/**
 * 测试创建 YouTube 客户端
 */
export async function testCreateYoutubeClient() {
  console.log('\n=== 测试创建 YouTube 客户端 ===');
  try {
    const youtube = youtubeApiKeyPool.createClient();
    console.log('成功创建 YouTube 客户端');
    console.log('客户端类型:', youtube.constructor.name);
    return youtube;
  } catch (error) {
    console.error('创建客户端失败:', error);
    return null;
  }
}

/**
 * 测试 YouTube API 调用
 */
export async function testYoutubeApiCall() {
  console.log('\n=== 测试 YouTube API 调用 ===');
  try {
    const youtube = youtubeApiKeyPool.createClient();

    // 测试获取频道信息
    const response = await youtube.channels.list({
      part: ['snippet', 'statistics'],
      id: ['UC_x5XG1OV2P6uZZ5FSM9Ttw'], // Google Developers 频道
      maxResults: 1
    });

    const channel = response.data.items?.[0];
    if (channel) {
      console.log('API 调用成功！');
      console.log('频道标题:', channel.snippet?.title);
      console.log('订阅者数:', channel.statistics?.subscriberCount);
      console.log('视频数:', channel.statistics?.videoCount);
    }

    // 检查 Key 池状态
    const status = youtubeApiKeyPool.getPoolStatus();
    console.log('\nAPI 调用后 Key 状态:');
    status.forEach((key, index) => {
      console.log(`Key ${index + 1}: ${key.quotaUsed}/${key.quotaLimit}`);
    });

    return response;
  } catch (error) {
    console.error('API 调用失败:', error);
    return null;
  }
}

/**
 * 运行所有测试
 */
export async function runAllTests() {
  console.log('========================================');
  console.log('YouTube API Key 池测试工具');
  console.log('========================================');

  await testKeyPoolInitialization();
  await testGetNextKey();
  await testCreateYoutubeClient();
  await testYoutubeApiCall();

  console.log('\n========================================');
  console.log('测试完成');
  console.log('========================================');
}

// 如果直接运行此文件，执行所有测试
if (require.main === module) {
  runAllTests().catch(console.error);
}
