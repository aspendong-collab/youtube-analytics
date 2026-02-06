/**
 * Affiliate 拓展功能测试
 * 用于验证 Affiliate 博主查找功能
 */

/**
 * 测试查找 Affiliate 博主
 */
export async function testFindAffiliateInfluencers(keyword: string = 'wireless earbuds') {
  console.log('\n=== 测试查找 Affiliate 博主 ===');
  console.log('关键词:', keyword);

  try {
    const response = await fetch('http://localhost:5000/api/influencers/affiliate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-host': 'localhost:5000',
      },
      body: JSON.stringify({
        keyword,
        language: 'en',
        maxVideos: 5,
        maxResults: 3,
        minAffiliateScore: 0,
        includeComments: false
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✓ 成功找到 ${result.data.length} 个 affiliate 博主`);

      result.data.forEach((influencer: any, index: number) => {
        console.log(`\n博主 ${index + 1}:`);
        console.log(`  频道 ID: ${influencer.channelId}`);
        console.log(`  频道名: ${influencer.channelName}`);
        console.log(`  Affiliate 评分: ${influencer.affiliateScore.toFixed(2)}`);
        console.log(`  检测到的视频数: ${influencer.videos?.length || 0}`);
        console.log(`  检测到的链接数: ${influencer.links?.length || 0}`);
      });

      return result;
    } else {
      console.error('✗ 查找失败:', result.error);
      return null;
    }
  } catch (error) {
    console.error('✗ 请求失败:', error);
    return null;
  }
}

/**
 * 运行测试
 */
export async function runAffiliateTest() {
  console.log('========================================');
  console.log('Affiliate 拓展功能测试');
  console.log('========================================');

  await testFindAffiliateInfluencers('wireless earbuds');

  console.log('\n========================================');
  console.log('测试完成');
  console.log('========================================');
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  runAffiliateTest().catch(console.error);
}
