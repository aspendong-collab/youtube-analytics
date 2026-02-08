// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { campaignsService } from '@/services/campaigns';
import { autoMatchingService } from '@/services/auto-campaign';
import { emailQueueService } from '@/services/email/queue-service';

const CREATE_INFLUENCERS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS influencers (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id VARCHAR(50) NOT NULL,
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
  last_cooperation_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT influencers_channel_id_idx UNIQUE (channel_id)
);

CREATE INDEX IF NOT EXISTS influencers_status_idx ON influencers(status);
CREATE INDEX IF NOT EXISTS influencers_level_idx ON influencers(level);
-- influencers_channel_id_idx 已被 UNIQUE 约束替代，不需要再创建
CREATE INDEX IF NOT EXISTS influencers_category_idx ON influencers(category);
CREATE INDEX IF NOT EXISTS influencers_is_favorite_idx ON influencers(is_favorite);
CREATE INDEX IF NOT EXISTS influencers_created_at_idx ON influencers(created_at);
`;

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
    await dbInstance.execute(sql`${sql.raw(CREATE_INFLUENCERS_TABLE_SQL)}`);
    await dbInstance.execute(sql`${sql.raw(CREATE_CAMPAIGNS_TABLE_SQL)}`);
    await dbInstance.execute(sql`${sql.raw(CREATE_CAMPAIGN_PARTICIPATIONS_TABLE_SQL)}`);
    await dbInstance.execute(sql`${sql.raw(CREATE_CAMPAIGN_AUTO_MATCHES_TABLE_SQL)}`);
    await dbInstance.execute(sql`${sql.raw(CREATE_CAMPAIGN_EMAIL_QUEUE_TABLE_SQL)}`);
    await dbInstance.execute(sql`${sql.raw(CREATE_CAMPAIGN_NEGOTIATION_LOGS_TABLE_SQL)}`);
    
    // 创建工作流步骤表
    const CREATE_WORKFLOW_STEPS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS workflow_steps (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR(36) NOT NULL,
  step_id VARCHAR(50) NOT NULL,
  step_name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  progress INTEGER NOT NULL DEFAULT 0,
  total_tasks INTEGER NOT NULL DEFAULT 0,
  completed_tasks INTEGER NOT NULL DEFAULT 0,
  failed_tasks INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_workflow_steps_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  CONSTRAINT unique_step_per_campaign UNIQUE (campaign_id, step_id)
);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_campaign ON workflow_steps(campaign_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_step_id ON workflow_steps(step_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_status ON workflow_steps(status);
`;

    const CREATE_WORKFLOW_LOGS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS workflow_logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR(36) NOT NULL,
  step_id VARCHAR(50) NOT NULL,
  level VARCHAR(10) NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_workflow_logs_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workflow_logs_campaign ON workflow_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_timestamp ON workflow_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_step_id ON workflow_logs(step_id);
`;

    await dbInstance.execute(sql`${sql.raw(CREATE_WORKFLOW_STEPS_TABLE_SQL)}`);
    await dbInstance.execute(sql`${sql.raw(CREATE_WORKFLOW_LOGS_TABLE_SQL)}`);

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

    console.log('[AutoCampaign] Campaign created', { campaignId: campaign.id });

    // 2. 初始化工作流步骤
    const { workflowTrackingService } = await import('@/services/auto-campaign/workflow-tracking-service');
    const { workflowLoggingService } = await import('@/services/auto-campaign/workflow-logging-service');
    
    await workflowTrackingService.initializeWorkflow(campaign.id);
    await workflowLoggingService.info(campaign.id, 'init', '活动创建成功，初始化工作流');

    console.log('[AutoCampaign] Workflow initialized', { campaignId: campaign.id });

    // 3. 如果启用了自动匹配，立即开始匹配
    let matchResult = null;
    if (autoMatching) {
      // 更新工作流状态：搜索达人
      await workflowTrackingService.updateStepStatus(campaign.id, 'init', 'completed');
      await workflowTrackingService.updateStepStatus(campaign.id, 'search_influencers', 'in_progress');
      await workflowLoggingService.info(campaign.id, 'search_influencers', '开始搜索达人');

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

      // 更新工作流状态
      await workflowTrackingService.updateStepProgress({
        campaignId: campaign.id,
        stepId: 'search_influencers',
        status: 'completed',
        progress: 100,
        totalTasks: 1,
        completedTasks: 1,
      });

      // 更新工作流状态：提取邮箱
      await workflowTrackingService.updateStepStatus(campaign.id, 'extract_emails', 'in_progress');
      await workflowTrackingService.updateStepProgress({
        campaignId: campaign.id,
        stepId: 'extract_emails',
        totalTasks: matchResult.matchedInfluencers.length,
        completedTasks: matchResult.matchedInfluencers.length,
        progress: 100,
        status: 'completed',
      });
      await workflowLoggingService.info(campaign.id, 'extract_emails', `成功提取 ${matchResult.matchedInfluencers.length} 位达人的邮箱`);

      // 更新工作流状态：计算CPV
      await workflowTrackingService.updateStepStatus(campaign.id, 'calculate_cpv', 'in_progress');
      await workflowTrackingService.updateStepProgress({
        campaignId: campaign.id,
        stepId: 'calculate_cpv',
        totalTasks: matchResult.matchedInfluencers.length,
        completedTasks: matchResult.matchedInfluencers.length,
        progress: 100,
        status: 'completed',
      });
      await workflowLoggingService.info(campaign.id, 'calculate_cpv', `成功计算 ${matchResult.matchedInfluencers.length} 位达人的CPV`);

      // 更新工作流状态：预算筛选
      await workflowTrackingService.updateStepStatus(campaign.id, 'filter_by_budget', 'in_progress');
      await workflowTrackingService.updateStepProgress({
        campaignId: campaign.id,
        stepId: 'filter_by_budget',
        totalTasks: 1,
        completedTasks: 1,
        progress: 100,
        status: 'completed',
      });
      await workflowLoggingService.info(campaign.id, 'filter_by_budget', `预算筛选完成，共 ${matchResult.matchedInfluencers.length} 位达人`);

      // 4. 批量创建邀请邮件
      await workflowTrackingService.updateStepStatus(campaign.id, 'create_email_queue', 'in_progress');
      await workflowLoggingService.info(campaign.id, 'create_email_queue', '开始创建邮件队列');

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

      // 更新工作流状态
      await workflowTrackingService.updateStepProgress({
        campaignId: campaign.id,
        stepId: 'create_email_queue',
        totalTasks: influencerIds.length,
        completedTasks: influencerIds.length,
        progress: 100,
        status: 'completed',
      });
      await workflowLoggingService.info(campaign.id, 'create_email_queue', `成功创建 ${influencerIds.length} 封邮件`);

      // 更新工作流状态：发送邮件
      await workflowTrackingService.updateStepStatus(campaign.id, 'send_emails', 'in_progress');
      await workflowTrackingService.updateStepProgress({
        campaignId: campaign.id,
        stepId: 'send_emails',
        totalTasks: influencerIds.length,
        completedTasks: 0,
        progress: 0,
        status: 'in_progress',
      });
      await workflowLoggingService.info(campaign.id, 'send_emails', `准备发送 ${influencerIds.length} 封邮件，请手动触发邮件队列处理`);

      // 5. 更新活动状态为进行中
      await campaignsService.update(campaign.id, {
        status: 'active',
      });

      console.log('[AutoCampaign] Campaign status updated to active');
      await workflowLoggingService.info(campaign.id, 'init', '活动状态已更新为 active');
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
