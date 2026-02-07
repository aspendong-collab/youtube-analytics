-- 创建 campaigns 表
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

-- 创建索引
CREATE INDEX IF NOT EXISTS campaigns_status_idx ON campaigns(status);
CREATE INDEX IF NOT EXISTS campaigns_created_at_idx ON campaigns(created_at);

-- 添加注释
COMMENT ON TABLE campaigns IS '营销活动表';
COMMENT ON COLUMN campaigns.status IS '状态：planned(计划中), active(进行中), paused(暂停), completed(已完成), cancelled(已取消)';
COMMENT ON COLUMN campaigns.goals IS '活动目标（JSON数组）';
