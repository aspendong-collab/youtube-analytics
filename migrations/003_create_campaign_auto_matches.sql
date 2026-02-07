-- 创建 campaign_auto_matches 表
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

-- 创建索引
CREATE INDEX IF NOT EXISTS campaign_auto_matches_campaign_id_idx ON campaign_auto_matches(campaign_id);
CREATE INDEX IF NOT EXISTS campaign_auto_matches_influencer_id_idx ON campaign_auto_matches(influencer_id);
CREATE INDEX IF NOT EXISTS campaign_auto_matches_status_idx ON campaign_auto_matches(status);
CREATE INDEX IF NOT EXISTS campaign_auto_matches_campaign_status_idx ON campaign_auto_matches(campaign_id, status);

-- 添加注释
COMMENT ON TABLE campaign_auto_matches IS '自动化达人匹配结果表';
COMMENT ON COLUMN campaign_auto_matches.estimated_price IS '预估价格';
COMMENT ON COLUMN campaign_auto_matches.match_score IS '匹配度评分（0-100）';
COMMENT ON COLUMN campaign_auto_matches.match_reason IS '匹配原因（JSON字符串）';
COMMENT ON COLUMN campaign_auto_matches.status IS '状态：pending(待处理), accepted(已接受), rejected(已拒绝), completed(已完成)';
COMMENT ON COLUMN campaign_auto_matches.email_sent IS '是否已发送邮件';
