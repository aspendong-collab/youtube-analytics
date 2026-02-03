import { eq, and, desc, gte, sql, SQL } from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import {
  videos,
  videoStats,
  insertVideoSchema,
  updateVideoSchema,
  insertVideoStatsSchema,
} from "./shared/schema";
import type {
  Video,
  InsertVideo,
  UpdateVideo,
  VideoStats,
  InsertVideoStats,
} from "./shared/schema";
import * as schema from "./shared/schema";

// 从环境变量获取数据库连接字符串
const NEON_DATABASE_URL = 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const DATABASE_URL = process.env.PGDATABASE_URL || NEON_DATABASE_URL;

// 开发环境内存存储
const mockVideos = new Map<string, Video>();
const mockVideoStats = new Map<string, VideoStats[]>();

export class VideoManager {
  private getDb() {
    // 每次调用时都直接创建连接，避免缓存问题
    const maskedUrl = DATABASE_URL.replace(/\/\/[^@]+@/, '//***@');
    console.log('[VideoManager] Creating fresh database connection:', maskedUrl);

    try {
      const client = postgres(DATABASE_URL, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
      });

      const db = drizzle(client, { schema });
      console.log('[VideoManager] Database connection created successfully');
      return db;
    } catch (error) {
      console.error('[VideoManager] Failed to connect to database:', error);
      return null;
    }
  }

  /**
   * 创建视频记录
   */
  async createVideo(data: InsertVideo): Promise<Video> {
    const validated = insertVideoSchema.parse(data);
    const db = this.getDb();
    if (!db) {
      // Mock: 返回一个模拟的视频对象，并保存到内存中
      const video: Video = {
        id: crypto.randomUUID(),
        videoId: validated.videoId,
        title: validated.title,
        description: validated.description || '',
        thumbnailUrl: validated.thumbnailUrl || '',
        channelId: validated.channelId || '',
        channelTitle: validated.channelTitle || '',
        publishedAt: validated.publishedAt || new Date(),
        duration: validated.duration || 0,
        tags: validated.tags || [],
        categoryId: validated.categoryId || 0,
        isActive: validated.isActive ?? true,
        isMonitored: validated.isMonitored ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockVideos.set(video.id, video);
      return video;
    }
    const [video] = await db.insert(videos).values(validated).returning();
    return video;
  }

  /**
   * 根据 YouTube videoId 获取视频
   */
  async getVideoByVideoId(videoId: string): Promise<Video | null> {
    const db = this.getDb();
    if (!db) {
      // Mock: 从内存中查找
      for (const video of mockVideos.values()) {
        if (video.videoId === videoId) {
          return video;
        }
      }
      return null;
    }
    const [video] = await db
      .select()
      .from(videos)
      .where(eq(videos.videoId, videoId));
    return video || null;
  }

  /**
   * 根据内部 ID 获取视频
   */
  async getVideoById(id: string): Promise<Video | null> {
    const db = this.getDb();
    if (!db) {
      // Mock: 从内存中查找
      return mockVideos.get(id) || null;
    }
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video || null;
  }

  /**
   * 获取视频列表
   */
  async getVideos(options: {
    skip?: number;
    limit?: number;
    isActive?: boolean;
  } = {}): Promise<Video[]> {
    const db = this.getDb();
    if (!db) {
      // Mock: 使用内存存储
      const { skip = 0, limit = 100, isActive } = options;
      let videos = Array.from(mockVideos.values());

      // 过滤活跃状态
      if (isActive !== undefined) {
        videos = videos.filter(v => v.isActive === isActive);
      }

      // 按创建时间降序排序
      videos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // 分页
      return videos.slice(skip, skip + limit);
    }
    const { skip = 0, limit = 100, isActive } = options;

    const conditions: SQL[] = [];
    if (isActive !== undefined) {
      conditions.push(eq(videos.isActive, isActive));
    }

    if (conditions.length > 0) {
      return db
        .select()
        .from(videos)
        .where(and(...conditions))
        .orderBy(desc(videos.createdAt))
        .limit(limit)
        .offset(skip);
    }

    return db
      .select()
      .from(videos)
      .orderBy(desc(videos.createdAt))
      .limit(limit)
      .offset(skip);
  }

  /**
   * 更新视频信息
   */
  async updateVideo(id: string, data: UpdateVideo): Promise<Video | null> {
    const db = this.getDb();
    const validated = updateVideoSchema.parse(data);
    const [video] = await db
      .update(videos)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(videos.id, id))
      .returning();
    return video || null;
  }

  /**
   * 根据 YouTube videoId 更新视频
   */
  async updateVideoByVideoId(
    videoId: string,
    data: UpdateVideo
  ): Promise<Video | null> {
    const db = this.getDb();
    const validated = updateVideoSchema.parse(data);
    const [video] = await db
      .update(videos)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(videos.videoId, videoId))
      .returning();
    return video || null;
  }

  /**
   * 删除视频（软删除）
   */
  async deleteVideo(id: string): Promise<boolean> {
    const db = this.getDb();
    const result = await db
      .update(videos)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(videos.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 创建视频统计数据
   */
  async createVideoStats(data: InsertVideoStats): Promise<VideoStats> {
    const db = this.getDb();
    const validated = insertVideoStatsSchema.parse(data);
    const [stats] = await db.insert(videoStats).values(validated).returning();
    return stats;
  }

  /**
   * 获取视频的统计数据
   */
  async getVideoStats(
    videoId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<VideoStats[]> {
    const db = this.getDb();
    const { startDate, endDate } = options;

    const conditions: SQL[] = [eq(videoStats.videoId, videoId)];
    if (startDate) {
      conditions.push(gte(videoStats.statDate, startDate));
    }
    if (endDate) {
      conditions.push(gte(videoStats.statDate, endDate));
    }

    return db
      .select()
      .from(videoStats)
      .where(and(...conditions))
      .orderBy(desc(videoStats.statDate));
  }

  /**
   * 获取视频的最新统计数据
   */
  async getLatestVideoStats(videoId: string): Promise<VideoStats | null> {
    const db = this.getDb();
    const [stats] = await db
      .select()
      .from(videoStats)
      .where(eq(videoStats.videoId, videoId))
      .orderBy(desc(videoStats.statDate))
      .limit(1);
    return stats || null;
  }

  /**
   * 获取所有活跃视频及其最新统计
   */
  async getActiveVideosWithLatestStats(): Promise<
    Array<Video & { latestStats?: VideoStats }>
  > {
    const activeVideos = await this.getVideos({ isActive: true });

    const videosWithStats = await Promise.all(
      activeVideos.map(async (video) => {
        const latestStats = await this.getLatestVideoStats(video.videoId);
        return { ...video, latestStats: latestStats || undefined };
      })
    );

    return videosWithStats;
  }

  /**
   * 批量获取多个视频的最新统计数据
   */
  async getLatestStatsForVideos(videoIds: string[]): Promise<Record<string, VideoStats | null>> {
    if (videoIds.length === 0) {
      return {};
    }

    const db = this.getDb();

    // 获取所有视频的统计数据
    const allStats = await db
      .select()
      .from(videoStats)
      .where(
        sql`${videoStats.videoId} = ANY(${sql`ARRAY[${sql.join(videoIds.map(id => sql`${id}`), sql`, `)}]`})`
      )
      .orderBy(desc(videoStats.statDate))
      .limit(videoIds.length * 10); // 限制数量，避免返回过多数据

    // 按 videoId 分组，只保留最新的统计
    const result: Record<string, VideoStats | null> = {};
    for (const videoId of videoIds) {
      result[videoId] = null;
    }

    for (const stat of allStats) {
      if (result[stat.videoId] === null || stat.statDate > (result[stat.videoId]?.statDate || '')) {
        result[stat.videoId] = stat;
      }
    }

    return result;
  }

  /**
   * 获取所有活跃视频（用于定时任务）
   */
  async getActiveVideosForUpdate(): Promise<Video[]> {
    return this.getVideos({ isActive: true, limit: 1000 });
  }

  /**
   * 删除视频的所有统计数据
   */
  async deleteVideoStatsByVideoId(videoId: string): Promise<number> {
    const db = this.getDb();

    // 先查询有多少条记录
    const stats = await db
      .select()
      .from(videoStats)
      .where(eq(videoStats.videoId, videoId));

    const count = stats.length;

    // 删除记录
    await db
      .delete(videoStats)
      .where(eq(videoStats.videoId, videoId));

    return count;
  }

  /**
   * 完全删除视频（包括视频记录和所有统计数据）
   */
  async deleteVideoWithStats(id: string): Promise<{ success: boolean; deletedStats: number }> {
    const db = this.getDb();

    try {
      // 获取视频信息
      const video = await this.getVideoById(id);
      if (!video) {
        return { success: false, deletedStats: 0 };
      }

      // 删除所有视频统计数据
      const deletedStats = await this.deleteVideoStatsByVideoId(video.videoId);

      // 硬删除视频记录（完全从数据库删除）
      await db
        .delete(videos)
        .where(eq(videos.id, id));

      console.log('[VideoManager] 硬删除视频:', video.title, 'video_id:', video.videoId, '删除了', deletedStats, '条统计数据');

      return { success: true, deletedStats };
    } catch (error) {
      console.error('[VideoManager] 删除视频失败:', error);
      return { success: false, deletedStats: 0 };
    }
  }
}

export const videoManager = new VideoManager();
