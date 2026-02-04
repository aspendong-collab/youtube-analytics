-- 数据库迁移脚本：创建用户达人相关表
-- 执行日期：2025-02-04
-- 说明：创建 user_favorites 和 user_influencers 表，用于用户收藏和达人列表管理

-- ============================================
-- 1. 用户收藏达人表 (user_favorites)
-- ============================================
CREATE TABLE IF NOT EXISTS user_favorites (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(36) NOT NULL,
    influencer_id VARCHAR(36) NOT NULL,
    channel_id VARCHAR(50) NOT NULL,
    note TEXT,                      -- 用户备注
    tags JSONB,                     -- 用户自定义标签
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS user_favorites_user_id_idx ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS user_favorites_influencer_id_idx ON user_favorites(influencer_id);
CREATE INDEX IF NOT EXISTS user_favorites_user_influencer_idx ON user_favorites(user_id, influencer_id);
CREATE INDEX IF NOT EXISTS user_favorites_channel_id_idx ON user_favorites(channel_id);

-- 添加注释
COMMENT ON TABLE user_favorites IS '用户收藏达人表';
COMMENT ON COLUMN user_favorites.user_id IS '用户ID，关联 users 表';
COMMENT ON COLUMN user_favorites.influencer_id IS '达人ID，关联 ai_influencers 表';
COMMENT ON COLUMN user_favorites.channel_id IS 'YouTube 频道ID';
COMMENT ON COLUMN user_favorites.note IS '用户备注信息';
COMMENT ON COLUMN user_favorites.tags IS '用户自定义标签（JSON数组）';

-- ============================================
-- 2. 用户达人列表表 (user_influencers)
-- ============================================
CREATE TABLE IF NOT EXISTS user_influencers (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(36) NOT NULL,
    influencer_id VARCHAR(36) NOT NULL,
    channel_id VARCHAR(50) NOT NULL,
    list_name VARCHAR(100) DEFAULT 'default',  -- 列表名称，支持多个列表
    status VARCHAR(20) DEFAULT 'added',        -- added(已添加), contacted(已联系), collaborating(合作中)
    priority VARCHAR(10) DEFAULT 'medium',     -- high, medium, low
    note TEXT,                                -- 用户备注
    tags JSONB,                               -- 用户自定义标签
    last_contacted_at TIMESTAMP WITH TIME ZONE,
    cooperation_count INTEGER DEFAULT 0,      -- 合作次数
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS user_influencers_user_id_idx ON user_influencers(user_id);
CREATE INDEX IF NOT EXISTS user_influencers_influencer_id_idx ON user_influencers(influencer_id);
CREATE INDEX IF NOT EXISTS user_influencers_user_list_idx ON user_influencers(user_id, list_name);
CREATE INDEX IF NOT EXISTS user_influencers_user_influencer_idx ON user_influencers(user_id, influencer_id);
CREATE INDEX IF NOT EXISTS user_influencers_channel_id_idx ON user_influencers(channel_id);
CREATE INDEX IF NOT EXISTS user_influencers_status_idx ON user_influencers(status);

-- 添加注释
COMMENT ON TABLE user_influencers IS '用户达人列表表';
COMMENT ON COLUMN user_influencers.user_id IS '用户ID，关联 users 表';
COMMENT ON COLUMN user_influencers.influencer_id IS '达人ID，关联 ai_influencers 表';
COMMENT ON COLUMN user_influencers.channel_id IS 'YouTube 频道ID';
COMMENT ON COLUMN user_influencers.list_name IS '列表名称，支持创建多个自定义列表';
COMMENT ON COLUMN user_influencers.status IS '状态：added(已添加), contacted(已联系), collaborating(合作中)';
COMMENT ON COLUMN user_influencers.priority IS '优先级：high, medium, low';
COMMENT ON COLUMN user_influencers.note IS '用户备注信息';
COMMENT ON COLUMN user_influencers.tags IS '用户自定义标签（JSON数组）';
COMMENT ON COLUMN user_influencers.last_contacted_at IS '最后联系时间';
COMMENT ON COLUMN user_influencers.cooperation_count IS '合作次数';

-- ============================================
-- 3. 验证表创建
-- ============================================
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = t.table_name) as index_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('user_favorites', 'user_influencers')
ORDER BY table_name;
