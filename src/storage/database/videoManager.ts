import { eq, and, desc, gte, sql, SQL } from "drizzle-orm";
import { dbInstance } from "@/lib/db";
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

export class VideoManager {
  private getDb() {
    if (!dbInstance) {
      throw new Error('Database not available. Please check PGDATABASE_URL environment variable.');
    }
    return dbInstance;
  }

  /**
   * 创建视频记录
   */
  async createVideo(data: InsertVideo): Promise<Video> {
    const validated = insertVideoSchema.parse(data);
    const db = this.getDb();
    const [video] = await db.insert(videos).values(validated).returning();
    return video;
  }

  /**
   * 根据 YouTube videoId 获取视频
   */
  async getVideoByVideoId(videoId: string): Promise<Video | null> {
    const db = this.getDb();
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
}

export const videoManager = new VideoManager();
