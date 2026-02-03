-- YouTube OAuth 授权信息表
CREATE TABLE IF NOT EXISTS youtube_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id VARCHAR(50) NOT NULL UNIQUE, -- YouTube 频道ID
  channel_title VARCHAR(200),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type VARCHAR(50) DEFAULT 'Bearer',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 达人授权状态表
CREATE TABLE IF NOT EXISTS influencer_authorization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id VARCHAR(36) REFERENCES influencers(id) ON DELETE CASCADE,
  channel_id VARCHAR(50) NOT NULL,
  is_authorized BOOLEAN DEFAULT FALSE,
  authorized_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(influencer_id, channel_id)
);

-- 达人每日统计数据
CREATE TABLE IF NOT EXISTS influencer_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id VARCHAR(36) REFERENCES influencers(id) ON DELETE CASCADE,
  channel_id VARCHAR(50) NOT NULL,
  stat_date TIMESTAMP WITH TIME ZONE NOT NULL,
  subscriber_count INTEGER DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  daily_views INTEGER DEFAULT 0,
  daily_subscribers INTEGER DEFAULT 0,
  average_view_duration INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  video_count INTEGER DEFAULT 0,
  published_videos INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(influencer_id, stat_date)
);

-- 流量来源数据表
CREATE TABLE IF NOT EXISTS influencer_traffic_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id VARCHAR(36) REFERENCES influencers(id) ON DELETE CASCADE,
  channel_id VARCHAR(50) NOT NULL,
  stat_date TIMESTAMP WITH TIME ZONE NOT NULL,
  source_type VARCHAR(50) NOT NULL, -- search/browse/suggested/external/playlist/other
  views BIGINT DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0,
  estimated_revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(influencer_id, stat_date, source_type)
);

-- 观众活跃度数据表
CREATE TABLE IF NOT EXISTS influencer_audience_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id VARCHAR(36) REFERENCES influencers(id) ON DELETE CASCADE,
  channel_id VARCHAR(50) NOT NULL,
  stat_date TIMESTAMP WITH TIME ZONE NOT NULL,
  hour INTEGER NOT NULL, -- 0-23
  active_viewers INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(influencer_id, stat_date, hour)
);

-- 观众画像数据表
CREATE TABLE IF NOT EXISTS influencer_audience_demographics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id VARCHAR(36) REFERENCES influencers(id) ON DELETE CASCADE,
  channel_id VARCHAR(50) NOT NULL,
  stat_date TIMESTAMP WITH TIME ZONE NOT NULL,
  dimension VARCHAR(50) NOT NULL, -- ageGroup/gender/country
  value VARCHAR(100) NOT NULL, -- 18-24/male/US
  viewers INTEGER DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(influencer_id, stat_date, dimension, value)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS youtube_oauth_tokens_channel_idx ON youtube_oauth_tokens(channel_id);
CREATE INDEX IF NOT EXISTS influencer_authorization_influencer_idx ON influencer_authorization(influencer_id);
CREATE INDEX IF NOT EXISTS influencer_daily_stats_influencer_date_idx ON influencer_daily_stats(influencer_id, stat_date);
CREATE INDEX IF NOT EXISTS influencer_traffic_sources_influencer_date_idx ON influencer_traffic_sources(influencer_id, stat_date);
CREATE INDEX IF NOT EXISTS influencer_audience_activity_influencer_date_idx ON influencer_audience_activity(influencer_id, stat_date);
CREATE INDEX IF NOT EXISTS influencer_audience_demographics_influencer_date_idx ON influencer_audience_demographics(influencer_id, stat_date);

COMMENT ON TABLE youtube_oauth_tokens IS 'YouTube OAuth 2.0 授权令牌存储';
COMMENT ON TABLE influencer_authorization IS '达人授权状态记录';
COMMENT ON TABLE influencer_daily_stats IS '达人每日统计数据';
COMMENT ON TABLE influencer_traffic_sources IS '达人流量来源分析';
COMMENT ON TABLE influencer_audience_activity IS '达人观众活跃度分析';
COMMENT ON TABLE influencer_audience_demographics IS '达人人众画像数据';
