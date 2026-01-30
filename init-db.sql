-- 创建 videos 表
CREATE TABLE IF NOT EXISTS videos (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id VARCHAR(20) NOT NULL UNIQUE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  thumbnail TEXT,
  channel_id VARCHAR(50),
  channel_title VARCHAR(200),
  tags JSONB,
  category_id VARCHAR(10),
  owner VARCHAR(100),
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 创建 video_stats 表
CREATE TABLE IF NOT EXISTS video_stats (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id VARCHAR(20) NOT NULL,
  stat_date TIMESTAMP WITH TIME ZONE NOT NULL,
  view_count INTEGER DEFAULT 0 NOT NULL,
  like_count INTEGER DEFAULT 0 NOT NULL,
  comment_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS videos_video_id_idx ON videos(video_id);
CREATE INDEX IF NOT EXISTS videos_created_at_idx ON videos(created_at);
CREATE INDEX IF NOT EXISTS video_stats_video_id_date_idx ON video_stats(video_id, stat_date);
