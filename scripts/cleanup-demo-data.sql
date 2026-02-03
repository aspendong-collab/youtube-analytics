-- 清理所有演示数据脚本
-- 执行此脚本将删除所有演示数据

-- 1. 删除所有视频统计数据
DELETE FROM video_stats;

-- 2. 删除所有视频
DELETE FROM videos;

-- 3. 删除所有评论
DELETE FROM comments;

-- 4. 检查 influencers 表（如果存在）
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'influencers') THEN
        DELETE FROM influencers;
        RAISE NOTICE '已删除 influencers 表中的所有数据';
    END IF;
END $$;

-- 5. 重置序列（如果有）
-- 注意：PostgreSQL 使用 UUID，不需要重置序列

-- 6. 显示清理结果
DO $$
DECLARE
    videos_count INT;
    video_stats_count INT;
    comments_count INT;
    influencers_count INT;
BEGIN
    SELECT COUNT(*) INTO videos_count FROM videos;
    SELECT COUNT(*) INTO video_stats_count FROM video_stats;
    SELECT COUNT(*) INTO comments_count FROM comments;

    RAISE NOTICE '========================================';
    RAISE NOTICE '数据清理完成';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'videos 表剩余记录: %', videos_count;
    RAISE NOTICE 'video_stats 表剩余记录: %', video_stats_count;
    RAISE NOTICE 'comments 表剩余记录: %', comments_count;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'influencers') THEN
        SELECT COUNT(*) INTO influencers_count FROM influencers;
        RAISE NOTICE 'influencers 表剩余记录: %', influencers_count;
    END IF;

    RAISE NOTICE '========================================';
END $$;
