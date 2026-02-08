/**
 * 自动化推广工作流步骤定义
 * 定义完整的自动化流程、每一步的执行逻辑和预期时间
 */

export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  icon: string;
  estimatedDuration: number; // 预计耗时（秒）
  dependencies?: string[]; // 依赖的前置步骤ID
  batch?: boolean; // 是否批量处理
  async?: boolean; // 是否异步任务（长期运行）
  retryable?: boolean; // 是否可重试
}

export interface WorkflowStepExecution {
  campaignId: string;
  stepId: string;
  stepName: string;
  description: string;
  icon: string;
  status: StepStatus;
  progress: number; // 0-100
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
  metadata: Record<string, any>;
}

/**
 * 自动化推广完整工作流
 */
export const AUTO_CAMPAIGN_WORKFLOW: WorkflowStep[] = [
  {
    id: 'init',
    name: '初始化',
    description: '创建活动、验证参数、初始化工作区',
    icon: '🚀',
    estimatedDuration: 1,
  },
  {
    id: 'search_influencers',
    name: '搜索达人',
    description: '根据条件从YouTube搜索匹配的达人',
    icon: '🔍',
    estimatedDuration: 10,
    dependencies: ['init'],
  },
  {
    id: 'extract_emails',
    name: '提取邮箱',
    description: '从频道信息和视频描述中提取联系邮箱',
    icon: '📧',
    estimatedDuration: 15,
    dependencies: ['search_influencers'],
    batch: true,
  },
  {
    id: 'calculate_cpv',
    name: '计算CPV',
    description: '计算每个达人的CPV、性价比评分和推荐价格',
    icon: '📊',
    estimatedDuration: 5,
    dependencies: ['extract_emails'],
    batch: true,
  },
  {
    id: 'filter_by_budget',
    name: '预算筛选',
    description: '根据预算和CPV筛选高性价比达人',
    icon: '💰',
    estimatedDuration: 3,
    dependencies: ['calculate_cpv'],
  },
  {
    id: 'create_email_queue',
    name: '创建邮件队列',
    description: '为每个达人创建个性化邀请邮件',
    icon: '📬',
    estimatedDuration: 2,
    dependencies: ['filter_by_budget'],
    batch: true,
  },
  {
    id: 'send_emails',
    name: '发送邮件',
    description: '批量发送邀请邮件到达人邮箱',
    icon: '✉️',
    estimatedDuration: 30,
    dependencies: ['create_email_queue'],
    batch: true,
    retryable: true,
  },
  {
    id: 'track_responses',
    name: '跟踪反馈',
    description: '监控邮件打开、点击和回复情况',
    icon: '📈',
    estimatedDuration: 86400, // 24小时持续跟踪
    dependencies: ['send_emails'],
    async: true,
  },
  {
    id: 'analyze_responses',
    name: '分析回复',
    description: '解析达人回复邮件，识别意向和报价',
    icon: '🔍',
    estimatedDuration: 5,
    dependencies: ['track_responses'],
    batch: true,
  },
  {
    id: 'start_negotiation',
    name: '启动谈判',
    description: '对有合作意向的达人启动自动砍价',
    icon: '💬',
    estimatedDuration: 10,
    dependencies: ['analyze_responses'],
    batch: true,
  },
  {
    id: 'complete',
    name: '完成',
    description: '汇总所有谈判结果，生成最终报告',
    icon: '✅',
    estimatedDuration: 2,
    dependencies: ['start_negotiation'],
  },
];

/**
 * 获取工作流步骤信息
 */
export function getWorkflowStep(stepId: string): WorkflowStep | undefined {
  return AUTO_CAMPAIGN_WORKFLOW.find(step => step.id === stepId);
}

/**
 * 获取下一步骤
 */
export function getNextStep(currentStepId: string): WorkflowStep | undefined {
  const currentIndex = AUTO_CAMPAIGN_WORKFLOW.findIndex(step => step.id === currentStepId);
  if (currentIndex === -1 || currentIndex === AUTO_CAMPAIGN_WORKFLOW.length - 1) {
    return undefined;
  }
  return AUTO_CAMPAIGN_WORKFLOW[currentIndex + 1];
}

/**
 * 获取所有依赖步骤
 */
export function getDependencyChain(stepId: string): WorkflowStep[] {
  const step = getWorkflowStep(stepId);
  if (!step || !step.dependencies) {
    return [];
  }

  const dependencies: WorkflowStep[] = [];
  for (const depId of step.dependencies) {
    const depStep = getWorkflowStep(depId);
    if (depStep) {
      dependencies.push(depStep);
      dependencies.push(...getDependencyChain(depId));
    }
  }

  return dependencies;
}

/**
 * 计算总预计耗时
 */
export function calculateTotalEstimatedDuration(): number {
  return AUTO_CAMPAIGN_WORKFLOW.reduce((sum, step) => sum + step.estimatedDuration, 0);
}

/**
 * 计算已完成的步骤百分比
 */
export function calculateProgressPercentage(completedStepIds: string[]): number {
  const totalSteps = AUTO_CAMPAIGN_WORKFLOW.length;
  const completedSteps = completedStepIds.length;
  return Math.round((completedSteps / totalSteps) * 100);
}
