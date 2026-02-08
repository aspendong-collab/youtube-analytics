// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { dbInstance as db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { generateId } from '@/shared/utils/string';

// POST /api/v1/test/init-data - 初始化测试数据
export async function POST(request: NextRequest) {
  try {
    console.log('[InitTestData] Starting test data initialization...');

    // 创建 influencers 表（如果不存在）
    const CREATE_INFLUENCERS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS influencers (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id VARCHAR(50) NOT NULL UNIQUE,
  channel_title VARCHAR(200) NOT NULL,
  thumbnail TEXT,
  subscriber_count INTEGER DEFAULT 0,
  total_videos INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  email VARCHAR(255),
  phone VARCHAR(20),
  wechat VARCHAR(50),
  description TEXT,
  tags JSONB,
  category VARCHAR(50),
  niche VARCHAR(100),
  level VARCHAR(20) DEFAULT 'C',
  price_range VARCHAR(50),
  average_price DECIMAL(10, 2) DEFAULT 0,
  quality_score DECIMAL(5, 2) DEFAULT 0,
  cooperation_score DECIMAL(5, 2) DEFAULT 0,
  engagement_rate DECIMAL(5, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'available',
  is_favorite BOOLEAN DEFAULT FALSE,
  cooperation_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  last_cooperation_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS influencers_status_idx ON influencers(status);
CREATE INDEX IF NOT EXISTS influencers_category_idx ON influencers(category);
`;

    await db.execute(sql`${sql.raw(CREATE_INFLUENCERS_TABLE_SQL)}`);

    // 检查是否已有测试数据
    const [existingCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(sql`influencers`);

    if (existingCount && existingCount.count > 10) {
      return NextResponse.json({
        success: true,
        message: '测试数据已存在',
        count: existingCount.count,
      });
    }

    // 插入测试达人数据
    const testInfluencers = [
      {
        id: generateId(),
        channelId: 'UC_test_001',
        channelTitle: '科技测评达人',
        thumbnail: 'https://via.placeholder.com/150',
        subscriberCount: 50000,
        totalVideos: 200,
        totalViews: 5000000,
        email: 'tech@influencer1.com',
        phone: '+86 13800138001',
        description: '专注于科技产品评测，拥有50万粉丝',
        tags: ['科技', '评测', '数码'],
        category: 'Science & Technology',
        niche: '科技评测',
        level: 'A',
        priceRange: '$500-$1000',
        averagePrice: 750,
        qualityScore: 85,
        cooperationScore: 90,
        engagementRate: 8.5,
        status: 'available',
      },
      {
        id: generateId(),
        channelId: 'UC_test_002',
        channelTitle: '美妆时尚博主',
        thumbnail: 'https://via.placeholder.com/150',
        subscriberCount: 100000,
        totalVideos: 300,
        totalViews: 10000000,
        email: 'beauty@influencer2.com',
        phone: '+86 13800138002',
        description: '美妆时尚博主，拥有100万粉丝',
        tags: ['美妆', '时尚', '生活'],
        category: 'Howto & Style',
        niche: '美妆时尚',
        level: 'A',
        priceRange: '$1000-$2000',
        averagePrice: 1500,
        qualityScore: 90,
        cooperationScore: 85,
        engagementRate: 12.0,
        status: 'available',
      },
      {
        id: generateId(),
        channelId: 'UC_test_003',
        channelTitle: '游戏解说频道',
        thumbnail: 'https://via.placeholder.com/150',
        subscriberCount: 200000,
        totalVideos: 500,
        totalViews: 20000000,
        email: 'gaming@influencer3.com',
        phone: '+86 13800138003',
        description: '热门游戏解说，拥有200万粉丝',
        tags: ['游戏', '娱乐', '电竞'],
        category: 'Gaming',
        niche: '游戏解说',
        level: 'S',
        priceRange: '$2000-$5000',
        averagePrice: 3500,
        qualityScore: 95,
        cooperationScore: 80,
        engagementRate: 15.0,
        status: 'available',
      },
      {
        id: generateId(),
        channelId: 'UC_test_004',
        channelTitle: '美食探店达人',
        thumbnail: 'https://via.placeholder.com/150',
        subscriberCount: 80000,
        totalVideos: 400,
        totalViews: 8000000,
        email: 'food@influencer4.com',
        phone: '+86 13800138004',
        description: '美食探店达人，拥有80万粉丝',
        tags: ['美食', '探店', '生活'],
        category: 'People & Blogs',
        niche: '美食探店',
        level: 'A',
        priceRange: '$800-$1500',
        averagePrice: 1150,
        qualityScore: 88,
        cooperationScore: 88,
        engagementRate: 10.0,
        status: 'available',
      },
      {
        id: generateId(),
        channelId: 'UC_test_005',
        channelTitle: '健身教练频道',
        thumbnail: 'https://via.placeholder.com/150',
        subscriberCount: 150000,
        totalVideos: 250,
        totalViews: 15000000,
        email: 'fitness@influencer5.com',
        phone: '+86 13800138005',
        description: '健身教练，拥有150万粉丝',
        tags: ['健身', '运动', '健康'],
        category: 'Sports',
        niche: '健身教程',
        level: 'A',
        priceRange: '$1200-$2500',
        averagePrice: 1850,
        qualityScore: 92,
        cooperationScore: 85,
        engagementRate: 9.5,
        status: 'available',
      },
    ];

    // 插入测试数据
    for (const influencer of testInfluencers) {
      await db.execute(sql`
        INSERT INTO influencers (
          id, channel_id, channel_title, thumbnail, subscriber_count, total_videos, total_views,
          email, phone, description, tags, category, niche, level, price_range, average_price,
          quality_score, cooperation_score, engagement_rate, status
        ) VALUES (
          ${influencer.id}, ${influencer.channelId}, ${influencer.channelTitle}, ${influencer.thumbnail},
          ${influencer.subscriberCount}, ${influencer.totalVideos}, ${influencer.totalViews},
          ${influencer.email}, ${influencer.phone}, ${influencer.description},
          ${JSON.stringify(influencer.tags)}, ${influencer.category}, ${influencer.niche}, ${influencer.level},
          ${influencer.priceRange}, ${influencer.averagePrice}, ${influencer.qualityScore},
          ${influencer.cooperationScore}, ${influencer.engagementRate}, ${influencer.status}
        )
        ON CONFLICT (channel_id) DO NOTHING
      `);
    }

    console.log('[InitTestData] Test data initialized successfully', { count: testInfluencers.length });

    return NextResponse.json({
      success: true,
      message: '测试数据初始化成功',
      count: testInfluencers.length,
    });

  } catch (error: any) {
    console.error('[InitTestData] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '初始化测试数据失败',
    }, { status: 500 });
  }
}

// GET /api/v1/test/init-data - 检查测试数据状态
export async function GET() {
  try {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(sql`influencers`);

    return NextResponse.json({
      success: true,
      count: result?.count || 0,
    });
  } catch (error: any) {
    console.error('[InitTestData] GET error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '检查测试数据失败',
    }, { status: 500 });
  }
}
