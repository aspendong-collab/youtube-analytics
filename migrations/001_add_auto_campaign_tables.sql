-- ========================================
-- 自动化达人营销系统 - 数据库迁移脚本
-- 版本: 001
-- 描述: 添加自动化推广相关的表和字段
-- ========================================

-- 1. 扩展 campaigns 表，添加自动化相关字段
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS budget_per_influencer decimal(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS target_influencer_count integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS auto_matching_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_negotiation_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_acceptable_price decimal(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS negotiation_strategy varchar(50) DEFAULT 'moderate',
  ADD COLUMN IF NOT EXISTS targeting_criteria jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS workflow_status varchar(50) DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS workflow_step varchar(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS workflow_started_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS workflow_completed_at timestamp with time zone DEFAULT NULL;

-- 2. 创建 campaign_auto_matches 表（自动匹配记录）
CREATE TABLE IF NOT EXISTS campaign_auto_matches (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id varchar(36) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  influencer_id varchar(36) NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  
  -- 匹配信息
  estimated_price decimal(10,2) NOT NULL,
  match_score decimal(5,2) NOT NULL DEFAULT 0,
  match_reason jsonb NOT NULL DEFAULT '[]'::jsonb,
  
  -- 状态
  status varchar(50) NOT NULL DEFAULT 'pending', -- pending, queued, sent, responded, negotiating, accepted, rejected, failed
  invited_at timestamp with time zone DEFAULT NULL,
  responded_at timestamp with time zone DEFAULT NULL,
  
  -- 元数据
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- 索引
  CONSTRAINT unique_campaign_influencer UNIQUE (campaign_id, influencer_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_auto_matches_campaign_id ON campaign_auto_matches(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_auto_matches_influencer_id ON campaign_auto_matches(influencer_id);
CREATE INDEX IF NOT EXISTS idx_campaign_auto_matches_status ON campaign_auto_matches(status);
CREATE INDEX IF NOT EXISTS idx_campaign_auto_matches_match_score ON campaign_auto_matches(match_score DESC);

-- 3. 创建 campaign_email_queue 表（邮件队列）
CREATE TABLE IF NOT EXISTS campaign_email_queue (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id varchar(36) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  influencer_id varchar(36) NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  auto_match_id varchar(36) REFERENCES campaign_auto_matches(id) ON DELETE SET NULL,
  
  -- 邮件内容
  email_type varchar(50) NOT NULL, -- invitation, negotiation, followup, confirmation
  recipient_email varchar(255) NOT NULL,
  recipient_name varchar(255) NOT NULL,
  subject varchar(500) NOT NULL,
  content text NOT NULL,
  html_content text,
  
  -- 邮件发送信息
  provider varchar(50) NOT NULL DEFAULT 'elastic', -- elastic, ses, resend
  provider_message_id varchar(255), -- 外部服务返回的邮件ID
  
  -- 状态
  status varchar(50) NOT NULL DEFAULT 'queued', -- queued, sending, sent, failed, bounced
  scheduled_at timestamp with time zone DEFAULT now(),
  sent_at timestamp with time zone DEFAULT NULL,
  failed_at timestamp with time zone DEFAULT NULL,
  error_message text,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  
  -- 追踪数据
  tracking_enabled boolean DEFAULT true,
  tracking_pixel_url text,
  opened_at timestamp with time zone DEFAULT NULL,
  open_count integer DEFAULT 0,
  clicked_at timestamp with time zone DEFAULT NULL,
  click_count integer DEFAULT 0,
  bounced_at timestamp with time zone DEFAULT NULL,
  bounce_type varchar(50), -- hard, soft
  bounce_reason text,
  spam_complained_at timestamp with time zone DEFAULT NULL,
  unsubscribed_at timestamp with time zone DEFAULT NULL,
  
  -- 元数据
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_email_queue_campaign_id ON campaign_email_queue(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_email_queue_influencer_id ON campaign_email_queue(influencer_id);
CREATE INDEX IF NOT EXISTS idx_campaign_email_queue_status ON campaign_email_queue(status);
CREATE INDEX IF NOT EXISTS idx_campaign_email_queue_scheduled_at ON campaign_email_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_campaign_email_queue_provider ON campaign_email_queue(provider);

-- 4. 创建 campaign_negotiation_logs 表（谈判记录）
CREATE TABLE IF NOT EXISTS campaign_negotiation_logs (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id varchar(36) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  influencer_id varchar(36) NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  auto_match_id varchar(36) REFERENCES campaign_auto_matches(id) ON DELETE SET NULL,
  
  -- 价格信息
  initial_price decimal(10,2) NOT NULL,
  our_offer decimal(10,2),
  counter_offer decimal(10,2),
  final_price decimal(10,2),
  
  -- 谈判过程
  negotiation_rounds integer DEFAULT 0,
  max_rounds integer DEFAULT 5,
  ai_strategy_used varchar(50), -- aggressive, moderate, conservative
  
  -- 状态
  status varchar(50) NOT NULL DEFAULT 'pending', -- pending, in_progress, accepted, rejected, failed, user_intervention
  started_at timestamp with time zone DEFAULT NULL,
  completed_at timestamp with time zone DEFAULT NULL,
  
  -- 消息历史
  messages jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{role, content, timestamp}]
  
  -- 元数据
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_negotiation_logs_campaign_id ON campaign_negotiation_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_negotiation_logs_influencer_id ON campaign_negotiation_logs(influencer_id);
CREATE INDEX IF NOT EXISTS idx_campaign_negotiation_logs_status ON campaign_negotiation_logs(status);

-- 5. 创建 email_events 表（邮件事件追踪）
CREATE TABLE IF NOT EXISTS email_events (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  email_queue_id varchar(36) NOT NULL REFERENCES campaign_email_queue(id) ON DELETE CASCADE,
  
  -- 事件信息
  event_type varchar(50) NOT NULL, -- opened, clicked, bounced, complained, unsubscribed, delivered
  event_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  -- 用户信息
  ip_address varchar(50),
  user_agent text,
  
  -- 元数据
  timestamp timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_events_email_queue_id ON email_events(email_queue_id);
CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_timestamp ON email_events(timestamp);

-- 6. 创建 email_statistics 表（邮件统计数据缓存）
CREATE TABLE IF NOT EXISTS email_statistics (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id varchar(36) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  stat_date date NOT NULL,
  
  -- 统计数据
  total_sent integer DEFAULT 0,
  total_opened integer DEFAULT 0,
  total_clicked integer DEFAULT 0,
  total_bounced integer DEFAULT 0,
  total_spammed integer DEFAULT 0,
  total_unsubscribed integer DEFAULT 0,
  
  -- 比率
  open_rate decimal(5,2) DEFAULT 0,
  click_rate decimal(5,2) DEFAULT 0,
  bounce_rate decimal(5,2) DEFAULT 0,
  spam_rate decimal(5,2) DEFAULT 0,
  unsubscribe_rate decimal(5,2) DEFAULT 0,
  
  -- 元数据
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT unique_campaign_date UNIQUE (campaign_id, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_email_statistics_campaign_date ON email_statistics(campaign_id, stat_date);

-- 7. 创建 job_queue 表（任务队列）
CREATE TABLE IF NOT EXISTS job_queue (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 任务信息
  job_type varchar(50) NOT NULL, -- email_send, negotiation_check, auto_match, etc.
  job_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  -- 优先级和调度
  priority integer DEFAULT 0,
  scheduled_at timestamp with time zone DEFAULT now(),
  started_at timestamp with time zone DEFAULT NULL,
  completed_at timestamp with time zone DEFAULT NULL,
  
  -- 状态
  status varchar(50) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  result jsonb,
  error_message text,
  
  -- 重试
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  next_retry_at timestamp with time zone DEFAULT NULL,
  
  -- 元数据
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status);
CREATE INDEX IF NOT EXISTS idx_job_queue_scheduled_at ON job_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_job_queue_priority ON job_queue(priority DESC, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_job_queue_type ON job_queue(job_type);

-- 8. 创建 workflow_logs 表（工作流日志）
CREATE TABLE IF NOT EXISTS workflow_logs (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id varchar(36) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  
  -- 工作流信息
  step varchar(50) NOT NULL,
  action varchar(50) NOT NULL,
  status varchar(50) NOT NULL, -- started, completed, failed, skipped
  
  -- 数据
  input_data jsonb DEFAULT '{}'::jsonb,
  output_data jsonb DEFAULT '{}'::jsonb,
  error_message text,
  
  -- 元数据
  timestamp timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_logs_campaign_id ON workflow_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_timestamp ON workflow_logs(timestamp);

-- 迁移完成标记
COMMENT ON COLUMN campaigns.budget_per_influencer IS '单个博主预算上限';
COMMENT ON COLUMN campaigns.target_influencer_count IS '目标博主数量';
COMMENT ON COLUMN campaigns.auto_matching_enabled IS '是否启用自动匹配';
COMMENT ON COLUMN campaigns.auto_negotiation_enabled IS '是否启用自动谈判';
COMMENT ON COLUMN campaigns.max_acceptable_price IS '最高可接受价格';
COMMENT ON COLUMN campaigns.negotiation_strategy IS '谈判策略：aggressive(进取), moderate(温和), conservative(保守)';
COMMENT ON COLUMN campaigns.targeting_criteria IS '筛选条件 JSON';
COMMENT ON COLUMN campaigns.workflow_status IS '工作流状态：idle(空闲), running(运行中), paused(暂停), completed(完成), failed(失败)';
COMMENT ON COLUMN campaigns.workflow_step IS '当前工作流步骤';
