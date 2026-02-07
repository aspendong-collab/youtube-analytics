-- 创建 campaign_email_queue 表
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

-- 创建索引
CREATE INDEX IF NOT EXISTS campaign_email_queue_campaign_id_idx ON campaign_email_queue(campaign_id);
CREATE INDEX IF NOT EXISTS campaign_email_queue_influencer_id_idx ON campaign_email_queue(influencer_id);
CREATE INDEX IF NOT EXISTS campaign_email_queue_auto_match_id_idx ON campaign_email_queue(auto_match_id);
CREATE INDEX IF NOT EXISTS campaign_email_queue_status_idx ON campaign_email_queue(status);
CREATE INDEX IF NOT EXISTS campaign_email_queue_scheduled_at_idx ON campaign_email_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS campaign_email_queue_recipient_email_idx ON campaign_email_queue(recipient_email);
CREATE INDEX IF NOT EXISTS campaign_email_queue_campaign_status_idx ON campaign_email_queue(campaign_id, status);

-- 添加注释
COMMENT ON TABLE campaign_email_queue IS '邮件队列表';
COMMENT ON COLUMN campaign_email_queue.email_type IS '邮件类型：invitation(邀请), negotiation(谈判), followup(跟进), confirmation(确认), rejection(拒绝)';
COMMENT ON COLUMN campaign_email_queue.status IS '状态：queued(队列中), sending(发送中), sent(已发送), failed(失败), bounced(退信)';
COMMENT ON COLUMN campaign_email_queue.provider IS '邮件服务商：elastic, ses, resend, mailjet';
COMMENT ON COLUMN campaign_email_queue.tracking_enabled IS '是否启用追踪';
