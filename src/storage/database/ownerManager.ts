import { eq, and, desc, SQL } from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import {
  owners,
  videos,
  insertOwnerSchema,
  updateOwnerSchema,
} from "./shared/schema";
import type {
  Owner,
  InsertOwner,
  UpdateOwner,
} from "./shared/schema";
import * as schema from "./shared/schema";

// 硬编码的 Neon 数据库连接
const NEON_DATABASE_URL = 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

let dbClient: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

export class OwnerManager {
  private getDb() {
    if (!dbInstance) {
      try {
        const maskedUrl = NEON_DATABASE_URL.replace(/\/\/[^@]+@/, '/***@');
        console.log('[OwnerManager] Connecting to database:', maskedUrl);

        dbClient = postgres(NEON_DATABASE_URL, {
          max: 10,
          idle_timeout: 20,
          connect_timeout: 10,
        });

        dbInstance = drizzle(dbClient, { schema });
        console.log('[OwnerManager] Database connection established');
      } catch (error) {
        console.error('[OwnerManager] Failed to connect to database:', error);
        return null;
      }
    }
    return dbInstance;
  }

  /**
   * 创建负责人
   */
  async createOwner(data: InsertOwner): Promise<Owner> {
    const db = this.getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }

    const validated = insertOwnerSchema.parse(data);
    const [owner] = await db.insert(owners).values(validated).returning();
    return owner;
  }

  /**
   * 获取所有负责人
   */
  async getOwners(options: {
    skip?: number;
    limit?: number;
    isActive?: boolean;
  } = {}): Promise<Owner[]> {
    const db = this.getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }

    const { skip = 0, limit = 100, isActive } = options;

    const conditions: SQL[] = [];
    if (isActive !== undefined) {
      conditions.push(eq(owners.isActive, isActive));
    }

    if (conditions.length > 0) {
      return db
        .select()
        .from(owners)
        .where(and(...conditions))
        .orderBy(desc(owners.createdAt))
        .limit(limit)
        .offset(skip);
    }

    return db
      .select()
      .from(owners)
      .orderBy(desc(owners.createdAt))
      .limit(limit)
      .offset(skip);
  }

  /**
   * 根据 ID 获取负责人
   */
  async getOwnerById(id: string): Promise<Owner | null> {
    const db = this.getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }

    const [owner] = await db.select().from(owners).where(eq(owners.id, id));
    return owner || null;
  }

  /**
   * 根据邮箱获取负责人
   */
  async getOwnerByEmail(email: string): Promise<Owner | null> {
    const db = this.getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }

    const [owner] = await db.select().from(owners).where(eq(owners.email, email));
    return owner || null;
  }

  /**
   * 更新负责人
   */
  async updateOwner(id: string, data: UpdateOwner): Promise<Owner | null> {
    const db = this.getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }

    const validated = updateOwnerSchema.parse(data);
    const [owner] = await db
      .update(owners)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(owners.id, id))
      .returning();
    return owner || null;
  }

  /**
   * 删除负责人（软删除）
   */
  async deleteOwner(id: string): Promise<boolean> {
    const db = this.getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }

    const result = await db
      .update(owners)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(owners.id, id));

    // postgres.js 返回的对象没有 rowCount，我们通过查询来验证
    const updatedOwner = await this.getOwnerById(id);
    return updatedOwner ? updatedOwner.isActive === false : false;
  }

  /**
   * 获取负责人的视频数量
   */
  async getOwnerVideoCount(ownerId: string): Promise<number> {
    const db = this.getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }

    const owner = await this.getOwnerById(ownerId);
    if (!owner) {
      return 0;
    }

    const videosResult = await db
      .select()
      .from(videos)
      .where(eq(videos.owner, owner.name));

    return videosResult.length;
  }
}

export const ownerManager = new OwnerManager();
