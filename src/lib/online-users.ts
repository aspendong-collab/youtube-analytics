/**
 * 在线用户管理模块
 * 使用内存存储在线用户集合，定期清理过期用户
 */

interface OnlineUser {
  userId: string;
  lastActiveAt: Date;
  userAgent?: string;
}

class OnlineUsersManager {
  private onlineUsers: Map<string, OnlineUser> = new Map();
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5分钟清理一次
  private readonly ONLINE_TIMEOUT = 5 * 60 * 1000; // 5分钟无活动视为离线

  constructor() {
    // 定时清理过期用户
    setInterval(() => this.cleanupExpiredUsers(), this.CLEANUP_INTERVAL);
    console.log('[OnlineUsers] 在线用户管理器已启动');
  }

  /**
   * 更新用户在线状态（心跳）
   */
  updateHeartbeat(userId: string, userAgent?: string): void {
    const now = new Date();
    this.onlineUsers.set(userId, {
      userId,
      lastActiveAt: now,
      userAgent,
    });

    console.log(`[OnlineUsers] 用户 ${userId} 更新心跳，当前在线人数: ${this.getOnlineCount()}`);
  }

  /**
   * 用户登出，移除在线状态
   */
  removeUser(userId: string): void {
    this.onlineUsers.delete(userId);
    console.log(`[OnlineUsers] 用户 ${userId} 已登出，当前在线人数: ${this.getOnlineCount()}`);
  }

  /**
   * 获取在线用户数量
   */
  getOnlineCount(): number {
    this.cleanupExpiredUsers();
    return this.onlineUsers.size;
  }

  /**
   * 获取所有在线用户
   */
  getOnlineUsers(): OnlineUser[] {
    this.cleanupExpiredUsers();
    return Array.from(this.onlineUsers.values());
  }

  /**
   * 清理过期用户（超过5分钟未活跃）
   */
  private cleanupExpiredUsers(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [userId, user] of this.onlineUsers.entries()) {
      if (now - user.lastActiveAt.getTime() > this.ONLINE_TIMEOUT) {
        this.onlineUsers.delete(userId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[OnlineUsers] 清理了 ${cleaned} 个过期用户，当前在线人数: ${this.getOnlineCount()}`);
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      onlineCount: this.getOnlineCount(),
      users: this.getOnlineUsers(),
    };
  }
}

// 导出单例
export const onlineUsersManager = new OnlineUsersManager();
