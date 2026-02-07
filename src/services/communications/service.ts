/**
 * 沟通服务
 */

import { db } from '@/core/database';
import { communicationThreads, communicationMessages, communicationTemplates } from '@/core/database/schema';
import { logger } from '@/core/logger';
import { generateId } from '@/shared/utils/string';
import { 
  CommunicationMessage, 
  CommunicationThread,
  CommunicationTemplate
} from './types';
import { desc, asc, and, eq, sql } from 'drizzle-orm';

export class CommunicationsService {
  private static instance: CommunicationsService;

  private constructor() {}

  static getInstance(): CommunicationsService {
    if (!CommunicationsService.instance) {
      CommunicationsService.instance = new CommunicationsService();
    }
    return CommunicationsService.instance;
  }

  /**
   * 创建沟通线程
   */
  async createThread(data: Omit<CommunicationThread, 'id' | 'unreadCount' | 'createdAt'>): Promise<CommunicationThread> {
    const now = new Date();
    const [thread] = await db
      .insert(communicationThreads)
      .values({
        id: generateId(),
        ...data,
        unreadCount: 0,
        createdAt: now,
      })
      .returning();

    logger.info('Communication thread created', { id: thread.id, userId: data.userId, influencerId: data.influencerId });

    return thread as CommunicationThread;
  }

  /**
   * 获取沟通线程列表
   */
  async getThreads(
    userId: string,
    filters: {
      status?: 'active' | 'archived' | 'closed';
      influencerId?: string;
      campaignId?: string;
      priority?: string;
      tags?: string[];
    } = {},
    pagination: { page: number; pageSize: number } = { page: 1, pageSize: 20 }
  ): Promise<{
    data: CommunicationThread[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page, pageSize } = pagination;
    const offset = (page - 1) * pageSize;

    // 构建查询条件
    const conditions = [sql`${communicationThreads.userId} = ${userId}`];

    if (filters.status) {
      conditions.push(sql`${communicationThreads.status} = ${filters.status}`);
    }

    if (filters.influencerId) {
      conditions.push(sql`${communicationThreads.influencerId} = ${filters.influencerId}`);
    }

    if (filters.campaignId) {
      conditions.push(sql`${communicationThreads.campaignId} = ${filters.campaignId}`);
    }

    if (filters.priority) {
      conditions.push(sql`${communicationThreads.priority} = ${filters.priority}`);
    }

    if (filters.tags && filters.tags.length > 0) {
      conditions.push(
        sql`${communicationThreads.tags} && ${filters.tags}`
      );
    }

    // 查询总数
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(communicationThreads)
      .where(and(...conditions));

    const total = Number(count);

    // 查询数据
    const results = await db
      .select()
      .from(communicationThreads)
      .where(and(...conditions))
      .orderBy(desc(communicationThreads.lastMessageAt), desc(communicationThreads.createdAt))
      .limit(pageSize)
      .offset(offset);

    const totalPages = Math.ceil(total / pageSize);

    return {
      data: results as CommunicationThread[],
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  /**
   * 获取沟通线程详情
   */
  async getThreadById(id: string): Promise<CommunicationThread | null> {
    const [result] = await db
      .select()
      .from(communicationThreads)
      .where(sql`${communicationThreads.id} = ${id}`);

    return result as CommunicationThread || null;
  }

  /**
   * 发送消息
   */
  async sendMessage(data: Omit<CommunicationMessage, 'id' | 'isRead' | 'createdAt'>): Promise<CommunicationMessage> {
    const now = new Date();
    
    // 创建消息
    const [message] = await db
      .insert(communicationMessages)
      .values({
        id: generateId(),
        ...data,
        isRead: false,
        createdAt: now,
      })
      .returning();

    // 更新线程
    await db
      .update(communicationThreads)
      .set({
        lastMessageAt: now,
        lastMessagePreview: data.content.substring(0, 100),
        unreadCount: sql`${communicationThreads.unreadCount} + 1`,
        updatedAt: now,
      })
      .where(eq(communicationThreads.id, data.threadId));

    logger.info('Message sent', { threadId: data.threadId, senderType: data.senderType });

    return message as CommunicationMessage;
  }

  /**
   * 获取线程消息列表
   */
  async getMessages(
    threadId: string,
    pagination: { page: number; pageSize: number } = { page: 1, pageSize: 50 }
  ): Promise<{
    data: CommunicationMessage[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page, pageSize } = pagination;
    const offset = (page - 1) * pageSize;

    // 查询总数
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(communicationMessages)
      .where(eq(communicationMessages.threadId, threadId));

    const total = Number(count);

    // 查询数据
    const results = await db
      .select()
      .from(communicationMessages)
      .where(eq(communicationMessages.threadId, threadId))
      .orderBy(asc(communicationMessages.createdAt))
      .limit(pageSize)
      .offset(offset);

    const totalPages = Math.ceil(total / pageSize);

    return {
      data: results as CommunicationMessage[],
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  /**
   * 标记消息为已读
   */
  async markAsRead(threadId: string, userId: string): Promise<void> {
    const now = new Date();

    // 更新消息
    await db
      .update(communicationMessages)
      .set({ isRead: true, readAt: now })
      .where(
        and(
          eq(communicationMessages.threadId, threadId),
          eq(communicationMessages.recipientId, userId)
        )
      );

    // 更新线程未读数
    await db
      .update(communicationThreads)
      .set({
        unreadCount: 0,
        updatedAt: now,
      })
      .where(eq(communicationThreads.id, threadId));

    logger.info('Messages marked as read', { threadId, userId });
  }

  /**
   * 关闭沟通线程
   */
  async closeThread(threadId: string): Promise<CommunicationThread | null> {
    const now = new Date();
    const [updated] = await db
      .update(communicationThreads)
      .set({
        status: 'closed',
        closedAt: now,
        updatedAt: now,
      })
      .where(eq(communicationThreads.id, threadId))
      .returning();

    if (updated) {
      logger.info('Thread closed', { threadId });
      return updated as CommunicationThread;
    }

    return null;
  }

  /**
   * 创建沟通模板
   */
  async createTemplate(data: Omit<CommunicationTemplate, 'id' | 'usageCount' | 'createdAt'>): Promise<CommunicationTemplate> {
    const now = new Date();
    const [template] = await db
      .insert(communicationTemplates)
      .values({
        id: generateId(),
        ...data,
        usageCount: 0,
        createdAt: now,
      })
      .returning();

    logger.info('Communication template created', { id: template.id, name: data.name });

    return template as CommunicationTemplate;
  }

  /**
   * 获取沟通模板列表
   */
  async getTemplates(
    userId: string,
    filters: { type?: CommunicationTemplate['type']; isPublic?: boolean } = {}
  ): Promise<CommunicationTemplate[]> {
    const conditions = [
      sql`${communicationTemplates.userId} = ${userId} OR ${communicationTemplates.isPublic} = true`
    ];

    if (filters.type) {
      conditions.push(sql`${communicationTemplates.type} = ${filters.type}`);
    }

    if (filters.isPublic !== undefined) {
      conditions.push(sql`${communicationTemplates.isPublic} = ${filters.isPublic}`);
    }

    const results = await db
      .select()
      .from(communicationTemplates)
      .where(and(...conditions))
      .orderBy(desc(communicationTemplates.createdAt));

    return results as CommunicationTemplate[];
  }

  /**
   * 使用模板发送消息
   */
  async sendWithTemplate(
    threadId: string,
    templateId: string,
    variables: Record<string, any>,
    senderId: string,
    recipientId: string
  ): Promise<CommunicationMessage> {
    // 获取模板
    const template = await db
      .select()
      .from(communicationTemplates)
      .where(eq(communicationTemplates.id, templateId))
      .then(rows => rows[0] as CommunicationTemplate);

    if (!template) {
      throw new Error('Template not found');
    }

    // 替换变量
    let content = template.content;
    Object.entries(variables).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    });

    // 获取线程信息
    const thread = await this.getThreadById(threadId);
    if (!thread) {
      throw new Error('Thread not found');
    }

    // 发送消息
    const message = await this.sendMessage({
      threadId,
      userId: thread.userId,
      senderId,
      senderType: 'user',
      recipientId,
      recipientType: 'influencer',
      content,
    });

    // 更新模板使用计数
    await db
      .update(communicationTemplates)
      .set({
        usageCount: sql`${communicationTemplates.usageCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(communicationTemplates.id, templateId));

    return message;
  }

  /**
   * 获取未读消息统计
   */
  async getUnreadStats(userId: string): Promise<{
    totalThreads: number;
    totalMessages: number;
    byPriority: Record<string, number>;
  }> {
    const threads = await this.getThreads(userId, {});

    let totalMessages = 0;
    const byPriority: Record<string, number> = {};

    for (const thread of threads.data) {
      totalMessages += thread.unreadCount;
      const priority = thread.priority || 'normal';
      byPriority[priority] = (byPriority[priority] || 0) + thread.unreadCount;
    }

    return {
      totalThreads: threads.data.filter(t => t.unreadCount > 0).length,
      totalMessages,
      byPriority,
    };
  }
}

// 导出单例实例
export const communicationsService = CommunicationsService.getInstance();
