-- 添加 YouTube 标准分类和语言字段到 influencers 表

-- 添加 categoryId 字段（YouTube 标准分类 ID）
ALTER TABLE influencers ADD COLUMN IF NOT EXISTS category_id varchar(10);

-- 添加 defaultLanguage 字段（视频默认语言）
ALTER TABLE influencers ADD COLUMN IF NOT EXISTS default_language varchar(10);

-- 添加索引以优化查询性能
CREATE INDEX IF NOT EXISTS influencers_category_id_idx ON influencers(category_id);
CREATE INDEX IF NOT EXISTS influencers_default_language_idx ON influencers(default_language);

-- 添加注释
COMMENT ON COLUMN influencers.category_id IS 'YouTube 标准分类 ID (1-29)';
COMMENT ON COLUMN influencers.default_language IS '视频默认语言代码 (如: en, zh-CN, zh-TW, fr, de, ja, it, es, pt)';
