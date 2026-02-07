-- 创建 campaign_negotiation_logs 表
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

-- 创建索引
CREATE INDEX IF NOT EXISTS campaign_negotiation_logs_campaign_id_idx ON campaign_negotiation_logs(campaign_id);
CREATE INDEX IF NOT EXISTS campaign_negotiation_logs_influencer_id_idx ON campaign_negotiation_logs(influencer_id);
CREATE INDEX IF NOT EXISTS campaign_negotiation_logs_auto_match_id_idx ON campaign_negotiation_logs(auto_match_id);
CREATE INDEX IF NOT EXISTS campaign_negotiation_logs_status_idx ON campaign_negotiation_logs(status);
CREATE INDEX IF NOT EXISTS campaign_negotiation_logs_campaign_status_idx ON campaign_negotiation_logs(campaign_id, status);
CREATE INDEX IF NOT EXISTS campaign_negotiation_logs_needs_approval_idx ON campaign_negotiation_logs(needs_user_approval);

-- 添加注释
COMMENT ON TABLE campaign_negotiation_logs IS '自动化谈判记录表';
COMMENT ON COLUMN campaign_negotiation_logs.initial_price IS '初始价格';
COMMENT ON COLUMN campaign_negotiation_logs.our_offer IS '我方出价';
COMMENT ON COLUMN campaign_negotiation_logs.counter_offer IS '对方出价';
COMMENT ON COLUMN campaign_negotiation_logs.final_price IS '最终价格';
COMMENT ON COLUMN campaign_negotiation_logs.negotiation_rounds IS '谈判轮数';
COMMENT ON COLUMN campaign_negotiation_logs.ai_strategy_used IS 'AI策略：aggressive(进取), moderate(温和), conservative(保守)';
COMMENT ON COLUMN campaign_negotiation_logs.status IS '状态：pending(待处理), in_progress(进行中), accepted(已接受), rejected(已拒绝), failed(失败), user_intervention(需人工介入)';
COMMENT ON COLUMN campaign_negotiation_logs.messages IS '谈判消息历史（JSON字符串）';
COMMENT ON COLUMN campaign_negotiation_logs.needs_user_approval IS '是否需要用户审批';
