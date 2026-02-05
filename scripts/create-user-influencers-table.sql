-- 创建用户达人关系表
-- 用于管理用户收藏和跟进的AI达人

CREATE TABLE IF NOT EXISTS user_influencers (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(36) NOT NULL,
  influencer_id VARCHAR(36) NOT NULL,
  channel_id VARCHAR(50) NOT NULL,

  -- 跟进状态
  status VARCHAR(30) NOT NULL DEFAULT 'interested',
  priority VARCHAR(10) NOT NULL DEFAULT 'medium',

  -- 跟进记录
  notes TEXT,
  last_contact_date TIMESTAMP WITH TIME ZONE,
  next_follow_up_date TIMESTAMP WITH TIME ZONE,
  contact_count INTEGER DEFAULT 0,

  -- 预算和合同信息
  estimated_budget DECIMAL(10, 2) DEFAULT 0,
  actual_budget DECIMAL(10, 2) DEFAULT 0,
  contract_status VARCHAR(20) DEFAULT 'none',

  -- 合作信息
  cooperation_start_date TIMESTAMP WITH TIME ZONE,
  cooperation_end_date TIMESTAMP WITH TIME ZONE,
  cooperation_count INTEGER DEFAULT 0,

  -- 标签和分类
  tags JSONB,
  category VARCHAR(50),

  -- 收藏
  is_favorite BOOLEAN DEFAULT FALSE,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- 唯一约束
  CONSTRAINT user_influencers_user_id_influencer_id_unique UNIQUE (user_id, influencer_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS user_influencers_user_id_idx ON user_influencers(user_id);
CREATE INDEX IF NOT EXISTS user_influencers_influencer_id_idx ON user_influencers(influencer_id);
CREATE INDEX IF NOT EXISTS user_influencers_channel_id_idx ON user_influencers(channel_id);
CREATE INDEX IF NOT EXISTS user_influencers_status_idx ON user_influencers(status);
CREATE INDEX IF NOT EXISTS user_influencers_is_favorite_idx ON user_influencers(is_favorite);

-- 添加注释
COMMENT ON TABLE user_influencers IS '用户达人关系表 - 用户收藏和跟进的AI达人';
COMMENT ON COLUMN user_influencers.status IS '跟进状态: interested(感兴趣), contacted(已联系), negotiating(洽谈中), collaborating(合作中), completed(已完成), rejected(已拒绝)';
COMMENT ON COLUMN user_influencers.priority IS '优先级: low(低), medium(中), high(高)';
COMMENT ON COLUMN user_influencers.contract_status IS '合同状态: none(无), pending(待签), signed(已签)';
