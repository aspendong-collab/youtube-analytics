// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { campaignsService } from '@/services/campaigns';
import { autoMatchingService } from '@/services/auto-campaign';
import { emailQueueService } from '@/services/email/queue-service';

// 自动创建表的 SQL
const CREATE_CAMPAIGNS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS campaigns (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  budget DECIMAL(15, 2),
  currency VARCHAR(10) DEFAULT 'USD',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'planned',
  category VARCHAR(100),
  target_audience TEXT,
  goals JSONB,
  requirements TEXT,
  invited_influencer_count INTEGER DEFAULT 0,
  accepted_influencer_count INTEGER DEFAULT 0,
  completed_influencer_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS campaigns_status_idx ON campaigns(status);
CREATE INDEX IF NOT EXISTS campaigns_created_at_idx ON campaigns(created_at);
`;

const CREATE_CAMPAIGN_PARTICIPATIONS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS campaign_participations (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR(36) NOT NULL,
  influencer_id VARCHAR(36) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  invited_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS campaign_participations_campaign_id_idx ON campaign_participations(campaign_id);
CREATE INDEX IF NOT EXISTS campaign_participations_influencer_id_idx ON campaign_participations(influencer_id);
CREATE INDEX IF NOT EXISTS campaign_participations_status_idx ON campaign_participations(status);
`;

const CREATE_CAMPAIGN_AUTO_MATCHES_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS campaign_auto_matches (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR(36) NOT NULL,
  influencer_id VARCHAR(36) NOT NULL,
  estimated_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  match_score INTEGER NOT NULL DEFAULT 0,
  match_reason TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  final_price DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS campaign_auto_matches_campaign_id_idx ON campaign_auto_matches(campaign_id);
CREATE INDEX IF NOT EXISTS campaign_auto_matches_influencer_id_idx ON campaign_auto_matches(influencer_id);
CREATE INDEX IF NOT EXISTS campaign_auto_matches_status_idx ON campaign_auto_matches(status);
CREATE INDEX IF NOT EXISTS campaign_auto_matches_campaign_status_idx ON campaign_auto_matches(campaign_id, status);
`;

const CREATE_CAMPAIGN_EMAIL_QUEUE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS campaign_email_queue (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR(36) NOT NULL,
  influencer_id VARCHAR(36) NOT NULL,
  auto_match_id VARCHAR(36),
  email_type VARCHAR(20) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(200) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  html_content TEXT,
  provider VARCHAR(20) NOT NULL DEFAULT 'elastic',
  provider_message_id VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  tracking_enabled BOOLEAN DEFAULT TRUE,
  tracking_pixel_url TEXT,
  opened_at TIMESTAMP WITH TIME ZONE,
  open_count INTEGER DEFAULT 0,
  clicked_at TIMESTAMP WITH TIME ZONE,
  click_count INTEGER DEFAULT 0,
  bounced_at TIMESTAMP WITH TIME ZONE,
  bounce_type VARCHAR(10),
  bounce_reason TEXT,
  spam_complained_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS campaign_email_queue_campaign_id_idx ON campaign_email_queue(campaign_id);
CREATE INDEX IF NOT EXISTS campaign_email_queue_influencer_id_idx ON campaign_email_queue(influencer_id);
CREATE INDEX IF NOT EXISTS campaign_email_queue_auto_match_id_idx ON campaign_email_queue(auto_match_id);
CREATE INDEX IF NOT EXISTS campaign_email_queue_status_idx ON campaign_email_queue(status);
CREATE INDEX IF NOT EXISTS campaign_email_queue_scheduled_at_idx ON campaign_email_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS campaign_email_queue_recipient_email_idx ON campaign_email_queue(recipient_email);
CREATE INDEX IF NOT EXISTS campaign_email_queue_campaign_status_idx ON campaign_email_queue(campaign_id, status);
`;

const CREATE_CAMPAIGN_NEGOTIATION_LOGS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS campaign_negotiation_logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR(36) NOT NULL,
  influencer_id VARCHAR(36) NOT NULL,
  auto_match_id VARCHAR(36),
  initial_price DECIMAL(10, 2) NOT NULL,
  our_offer DECIMAL(10, 2),
  counter_offer DECIMAL(10, 2),
  final_price DECIMAL(10, 2),
  negotiation_rounds INTEGER DEFAULT 0,
  max_rounds INTEGER DEFAULT 5,
  ai_strategy_used VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  messages TEXT,
  needs_user_approval BOOLEAN DEFAULT FALSE,
  user_approved BOOLEAN,
  user_approval_at TIMESTAMP WITH TIME ZONE,
  user_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS campaign_negotiation_logs_campaign_id_idx ON campaign_negotiation_logs(campaign_id);
CREATE INDEX IF NOT EXISTS campaign_negotiation_logs_influencer_id_idx ON campaign_negotiation_logs(influencer_id);
CREATE INDEX IF NOT EXISTS campaign_negotiation_logs_auto_match_id_idx ON campaign_negotiation_logs(auto_match_id);
CREATE INDEX IF NOT EXISTS campaign_negotiation_logs_status_idx ON campaign_negotiation_logs(status);
CREATE INDEX IF NOT EXISTS campaign_negotiation_logs_campaign_status_idx ON campaign_negotiation_logs(campaign_id, status);
CREATE INDEX IF NOT EXISTS campaign_negotiation_logs_needs_approval_idx ON campaign_negotiation_logs(needs_user_approval);
`;

// POST /api/v1/campaigns/auto-campaign - 创建自动化推广项目
export async function POST(request: NextRequest) {
  try {
    // 首先确保所有表都存在
    const { dbInstance } = await import('@/lib/db');
    const { sql } = await import('drizzle-orm');

    // 依次创建所有表
    await dbInstance.execute(sql`${sql.raw(CREATE_CAMPAIGNS_TABLE_SQL)}`);
    await dbInstance.execute(sql`${sql.raw(CREATE_CAMPAIGN_PARTICIPATIONS_TABLE_SQL)}`);
    await dbInstance.execute(sql`${sql.raw(CREATE_CAMPAIGN_AUTO_MATCHES_TABLE_SQL)}`);
    await dbInstance.execute(sql`${sql.raw(CREATE_CAMPAIGN_EMAIL_QUEUE_TABLE_SQL)}`);
    await dbInstance.execute(sql`${sql.raw(CREATE_CAMPAIGN_NEGOTIATION_LOGS_TABLE_SQL)}`);
    const body = await request.json();
    
    const {
      name,
      description,
      budget,
      maxPrice,
      startDate,
      endDate,
      criteria,
      negotiationStrategy,
      autoMatching,
      autoNegotiation,
      senderName,
      senderEmail,
      companyName,
      websiteUrl,
    } = body;

    if (!name || !budget) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, budget',
      }, { status: 400 });
    }

    if (!senderName || !senderEmail || !companyName) {
      return NextResponse.json({
        success: false,
        error: 'Missing email configuration: senderName, senderEmail, companyName',
      }, { status: 400 });
    }

    // 1. 创建活动
    const campaign = await campaignsService.create({
      name,
      description: description || null,
      budget: parseFloat(budget),
      currency: 'USD',
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      status: 'planned',
      category: criteria?.categories?.[0] || null,
      targetAudience: JSON.stringify(criteria),
      goals: [],
      requirements: null,
      userId: 'system', // TODO: 从 session 获取
    });

    // 2. 扩展 campaigns 表的新字段（如果字段已存在，这里会更新）
    // 注意：这里需要先执行数据库迁移添加这些字段

    // 3. 如果启用了自动匹配，立即开始匹配
    let matchResult = null;
    if (autoMatching) {
      const budgetLimit = parseFloat(budget);
      const priceLimit = maxPrice ? parseFloat(maxPrice) : null;

      console.log('[AutoCampaign] Starting auto matching...', { campaignId: campaign.id, budgetLimit, priceLimit });

      // 补充缺失的必需字段
      const fullCriteria = {
        ...criteria,
        minSubscriberCount: criteria.minSubscribers || criteria.minSubscriberCount || 0,
        maxSubscriberCount: criteria.maxSubscribers || criteria.maxSubscriberCount || 1000000, // 设置更合理的上限（100万）
        minEngagementRate: criteria.minEngagementRate || 0,
      };

      matchResult = await autoMatchingService.match({
        campaignId: campaign.id,
        criteria: fullCriteria,
        budgetLimit, // 总预算限制
        priceLimit, // 单个达人最高限价
      });

      console.log('[AutoCampaign] Auto matching completed', { matchedCount: matchResult.matchedInfluencers.length });

      // 4. 批量创建邀请邮件
      const influencerIds = matchResult.matchedInfluencers.map(m => m.influencerId);
      console.log('[AutoCampaign] Creating email invitations...', { influencerIds });
      
      await emailQueueService.batchCreateInvitations(
        campaign.id,
        influencerIds,
        {
          name,
          description,
          minPrice: priceLimit ? priceLimit * 0.7 : 70,
          maxPrice: priceLimit || 100,
          senderName: senderName || 'Marketing Team',
          senderEmail: senderEmail || 'noreply@yourdomain.com',
          companyName: companyName || '',
          websiteUrl: websiteUrl || '',
        }
      );

      console.log('[AutoCampaign] Email invitations created');

      // 5. 更新活动状态为进行中
      await campaignsService.update(campaign.id, {
        status: 'active',
      });

      console.log('[AutoCampaign] Campaign status updated to active');
    }

    return NextResponse.json({
      success: true,
      data: {
        campaign,
        matchResult,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('[AutoCampaign] POST error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create auto campaign',
    }, { status: 500 });
  }
}
