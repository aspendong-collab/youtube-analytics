-- 创建 campaign_participations 表
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

-- 创建索引
CREATE INDEX IF NOT EXISTS campaign_participations_campaign_id_idx ON campaign_participations(campaign_id);
CREATE INDEX IF NOT EXISTS campaign_participations_influencer_id_idx ON campaign_participations(influencer_id);
CREATE INDEX IF NOT EXISTS campaign_participations_status_idx ON campaign_participations(status);

-- 添加注释
COMMENT ON TABLE campaign_participations IS '活动参与记录表';
COMMENT ON COLUMN campaign_participations.status IS '状态：pending(待处理), accepted(已接受), rejected(已拒绝), completed(已完成), cancelled(已取消)';
