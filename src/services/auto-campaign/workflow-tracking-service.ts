/**
 * 工作流步骤追踪服务
 * 负责追踪工作流步骤的执行状态和进度
 */

import { dbInstance as db } from '@/lib/db';
import { workflowSteps } from '@/storage/database/shared/schema';
import { logger } from '@/core/logger';
import { generateId } from '@/shared/utils/string';
import { eq, and } from 'drizzle-orm';
import { AUTO_CAMPAIGN_WORKFLOW } from './workflow-steps';
import type { WorkflowStepStatus } from '@/storage/database/shared/schema';

export interface UpdateStepProgressParams {
  campaignId: string;
  stepId: string;
  status?: WorkflowStepStatus;
  progress?: number; // 0-100
  totalTasks?: number;
  completedTasks?: number;
  failedTasks?: number;
  errorMessage?: string | null;
  metadata?: Record<string, any>;
}

export class WorkflowTrackingService {
  private static instance: WorkflowTrackingService;

  private constructor() {}

  static getInstance(): WorkflowTrackingService {
    if (!WorkflowTrackingService.instance) {
      WorkflowTrackingService.instance = new WorkflowTrackingService();
    }
    return WorkflowTrackingService.instance;
  }

  /**
   * 初始化工作流步骤
   */
  async initializeWorkflow(campaignId: string): Promise<void> {
    logger.info('[WorkflowTracking] Initializing workflow', { campaignId });

    try {
      // 为每个工作流步骤创建记录
      for (const step of AUTO_CAMPAIGN_WORKFLOW) {
        await db.insert(workflowSteps).values({
          id: generateId(),
          campaignId,
          stepId: step.id,
          stepName: step.name,
          description: step.description,
          icon: step.icon,
          status: 'pending',
          progress: 0,
          totalTasks: 0,
          completedTasks: 0,
          failedTasks: 0,
          startedAt: null,
          completedAt: null,
          errorMessage: null,
          metadata: {
            estimatedDuration: step.estimatedDuration,
            dependencies: step.dependencies,
            batch: step.batch,
            async: step.async,
            retryable: step.retryable,
          },
        });
      }

      logger.info('[WorkflowTracking] Workflow initialized successfully', { campaignId });
    } catch (error) {
      logger.error('[WorkflowTracking] Failed to initialize workflow', error as Error, { campaignId });
      throw error;
    }
  }

  /**
   * 获取活动的工作流步骤
   */
  async getWorkflowSteps(campaignId: string): Promise<any[]> {
    try {
      const steps = await db
        .select()
        .from(workflowSteps)
        .where(eq(workflowSteps.campaignId, campaignId))
        .orderBy(workflowSteps.createdAt);

      return steps;
    } catch (error) {
      logger.error('[WorkflowTracking] Failed to get workflow steps', error as Error, { campaignId });
      throw error;
    }
  }

  /**
   * 更新步骤状态
   */
  async updateStepStatus(
    campaignId: string,
    stepId: string,
    status: WorkflowStepStatus
  ): Promise<void> {
    const now = new Date();

    try {
      const updateData: any = {
        status,
        updatedAt: now,
      };

      if (status === 'in_progress' && !updateData.startedAt) {
        updateData.startedAt = now;
      }

      if (status === 'completed') {
        updateData.completedAt = now;
        updateData.progress = 100;
      }

      await db
        .update(workflowSteps)
        .set(updateData)
        .where(
          and(
            eq(workflowSteps.campaignId, campaignId),
            eq(workflowSteps.stepId, stepId)
          )
        );

      logger.info('[WorkflowTracking] Step status updated', {
        campaignId,
        stepId,
        status,
      });
    } catch (error) {
      logger.error('[WorkflowTracking] Failed to update step status', error as Error, {
        campaignId,
        stepId,
        status,
      });
      throw error;
    }
  }

  /**
   * 更新步骤进度
   */
  async updateStepProgress(params: UpdateStepProgressParams): Promise<void> {
    const {
      campaignId,
      stepId,
      status,
      progress,
      totalTasks,
      completedTasks,
      failedTasks,
      errorMessage,
      metadata,
    } = params;

    const now = new Date();

    try {
      const updateData: any = {
        updatedAt: now,
      };

      if (status !== undefined) {
        updateData.status = status;
      }

      if (progress !== undefined) {
        updateData.progress = progress;
      }

      if (totalTasks !== undefined) {
        updateData.totalTasks = totalTasks;
      }

      if (completedTasks !== undefined) {
        updateData.completedTasks = completedTasks;
      }

      if (failedTasks !== undefined) {
        updateData.failedTasks = failedTasks;
      }

      if (errorMessage !== undefined) {
        updateData.errorMessage = errorMessage;
      }

      if (metadata !== undefined) {
        updateData.metadata = metadata;
      }

      if (status === 'in_progress' && !updateData.startedAt) {
        updateData.startedAt = now;
      }

      if (status === 'completed') {
        updateData.completedAt = now;
        updateData.progress = 100;
      }

      await db
        .update(workflowSteps)
        .set(updateData)
        .where(
          and(
            eq(workflowSteps.campaignId, campaignId),
            eq(workflowSteps.stepId, stepId)
          )
        );

      logger.info('[WorkflowTracking] Step progress updated', {
        campaignId,
        stepId,
        status,
        progress,
      });
    } catch (error) {
      logger.error('[WorkflowTracking] Failed to update step progress', error as Error, {
        campaignId,
        stepId,
      });
      throw error;
    }
  }

  /**
   * 标记步骤为失败
   */
  async markStepFailed(
    campaignId: string,
    stepId: string,
    errorMessage: string
  ): Promise<void> {
    const now = new Date();

    try {
      await db
        .update(workflowSteps)
        .set({
          status: 'failed',
          errorMessage,
          completedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(workflowSteps.campaignId, campaignId),
            eq(workflowSteps.stepId, stepId)
          )
        );

      logger.error('[WorkflowTracking] Step marked as failed', {
        campaignId,
        stepId,
        errorMessage,
      });
    } catch (error) {
      logger.error('[WorkflowTracking] Failed to mark step as failed', error as Error, {
        campaignId,
        stepId,
      });
      throw error;
    }
  }

  /**
   * 标记步骤为跳过
   */
  async markStepSkipped(
    campaignId: string,
    stepId: string,
    reason?: string
  ): Promise<void> {
    const now = new Date();

    try {
      await db
        .update(workflowSteps)
        .set({
          status: 'skipped',
          errorMessage: reason || 'Skipped',
          completedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(workflowSteps.campaignId, campaignId),
            eq(workflowSteps.stepId, stepId)
          )
        );

      logger.info('[WorkflowTracking] Step marked as skipped', {
        campaignId,
        stepId,
        reason,
      });
    } catch (error) {
      logger.error('[WorkflowTracking] Failed to mark step as skipped', error as Error, {
        campaignId,
        stepId,
      });
      throw error;
    }
  }

  /**
   * 获取当前正在执行的步骤
   */
  async getCurrentStep(campaignId: string): Promise<any | null> {
    try {
      const [step] = await db
        .select()
        .from(workflowSteps)
        .where(
          and(
            eq(workflowSteps.campaignId, campaignId),
            eq(workflowSteps.status, 'in_progress')
          )
        )
        .limit(1);

      return step || null;
    } catch (error) {
      logger.error('[WorkflowTracking] Failed to get current step', error as Error, { campaignId });
      throw error;
    }
  }

  /**
   * 获取下一个待执行的步骤
   */
  async getNextPendingStep(campaignId: string): Promise<any | null> {
    try {
      const [step] = await db
        .select()
        .from(workflowSteps)
        .where(
          and(
            eq(workflowSteps.campaignId, campaignId),
            eq(workflowSteps.status, 'pending')
          )
        )
        .orderBy(workflowSteps.createdAt)
        .limit(1);

      return step || null;
    } catch (error) {
      logger.error('[WorkflowTracking] Failed to get next pending step', error as Error, { campaignId });
      throw error;
    }
  }

  /**
   * 计算总体进度
   */
  async getOverallProgress(campaignId: string): Promise<number> {
    try {
      const steps = await this.getWorkflowSteps(campaignId);

      if (steps.length === 0) {
        return 0;
      }

      const totalProgress = steps.reduce((sum, step) => sum + step.progress, 0);
      return Math.round(totalProgress / steps.length);
    } catch (error) {
      logger.error('[WorkflowTracking] Failed to calculate overall progress', error as Error, { campaignId });
      return 0;
    }
  }
}

export const workflowTrackingService = WorkflowTrackingService.getInstance();
