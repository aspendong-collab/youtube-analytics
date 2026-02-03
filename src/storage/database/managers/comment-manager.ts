import { dbInstance as db } from '@/lib/db';
import { comments, type InsertComment, type Comment } from '@/storage/database/shared/schema';
import { eq, desc, and, or } from 'drizzle-orm';

/**
 * 评论管理器
 */
export class CommentManager {
  /**
   * 创建评论记录
   */
  async createComment(data: InsertComment) {
    if (!db) {
      throw new Error('数据库连接失败');
    }

    const result = await db.insert(comments).values(data).returning();
    return result[0];
  }

  /**
   * 批量创建评论记录
   */
  async bulkCreateComments(dataArray: InsertComment[]) {
    if (!db) {
      throw new Error('数据库连接失败');
    }

    if (dataArray.length === 0) {
      return [];
    }

    const result = await db.insert(comments).values(dataArray).returning();
    return result;
  }

  /**
   * 获取视频的所有评论
   */
  async getCommentsByVideoId(videoId: string) {
    if (!db) {
      throw new Error('数据库连接失败');
    }

    return await db
      .select()
      .from(comments)
      .where(eq(comments.videoId, videoId))
      .orderBy(desc(comments.likeCount), desc(comments.publishedAt));
  }

  /**
   * 获取高质量评论
   */
  async getHighQualityComments(videoId: string, limit = 10) {
    if (!db) {
      throw new Error('数据库连接失败');
    }

    return await db
      .select()
      .from(comments)
      .where(
        and(
          eq(comments.videoId, videoId),
          eq(comments.isHighQuality, true)
        )
      )
      .orderBy(desc(comments.qualityScore))
      .limit(limit);
  }

  /**
   * 获取情感分析统计
   */
  async getSentimentStats(videoId: string) {
    if (!db) {
      throw new Error('数据库连接失败');
    }

    const allComments = await db
      .select()
      .from(comments)
      .where(eq(comments.videoId, videoId));

    const stats = {
      total: allComments.length,
      positive: 0,
      neutral: 0,
      negative: 0,
      positiveComments: [] as Comment[],
      negativeComments: [] as Comment[],
    };

    allComments.forEach(comment => {
      if (comment.sentiment === 'positive') {
        stats.positive++;
        if (stats.positiveComments.length < 5) {
          stats.positiveComments.push(comment);
        }
      } else if (comment.sentiment === 'negative') {
        stats.negative++;
        if (stats.negativeComments.length < 5) {
          stats.negativeComments.push(comment);
        }
      } else {
        stats.neutral++;
      }
    });

    return stats;
  }

  /**
   * 检查评论是否已存在
   */
  async commentExists(commentId: string) {
    if (!db) {
      throw new Error('数据库连接失败');
    }

    const result = await db
      .select()
      .from(comments)
      .where(eq(comments.commentId, commentId))
      .limit(1);

    return result.length > 0;
  }

  /**
   * 更新评论的情感和质量评分
   */
  async updateCommentQuality(commentId: string, sentiment: string, qualityScore: number, isHighQuality: boolean) {
    if (!db) {
      throw new Error('数据库连接失败');
    }

    const result = await db
      .update(comments)
      .set({
        sentiment,
        qualityScore: String(qualityScore),
        isHighQuality,
      })
      .where(eq(comments.commentId, commentId))
      .returning();

    return result[0];
  }
}

export const commentManager = new CommentManager();
