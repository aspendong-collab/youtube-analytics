/**
 * 工作流步骤卡片组件
 * 显示单个工作流步骤的详细信息、状态和进度
 */

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkflowStepStatus } from "@/storage/database/shared/schema";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface WorkflowStepCardProps {
  step: {
    id: string;
    stepId: string;
    stepName: string;
    description: string;
    icon: string;
    status: WorkflowStepStatus;
    progress: number;
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    startedAt: Date | null;
    completedAt: Date | null;
    errorMessage: string | null;
  };
  index: number;
}

export function WorkflowStepCard({ step, index }: WorkflowStepCardProps) {
  const isCompleted = step.status === 'completed';
  const isRunning = step.status === 'in_progress';
  const isFailed = step.status === 'failed';
  const isPending = step.status === 'pending';

  const getStatusVariant = (status: WorkflowStepStatus) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'skipped':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: WorkflowStepStatus) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'in_progress':
        return '进行中';
      case 'failed':
        return '失败';
      case 'skipped':
        return '已跳过';
      default:
        return '等待中';
    }
  };

  const getStatusColor = (status: WorkflowStepStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'in_progress':
        return 'bg-blue-500 text-white animate-pulse';
      case 'failed':
        return 'bg-red-500 text-white';
      case 'skipped':
        return 'bg-gray-400 text-white';
      default:
        return 'bg-gray-300 text-gray-600';
    }
  };

  const getBorderColor = (status: WorkflowStepStatus) => {
    switch (status) {
      case 'completed':
        return 'border-green-500';
      case 'in_progress':
        return 'border-blue-500';
      case 'failed':
        return 'border-red-500';
      default:
        return 'border-gray-200';
    }
  };

  const calculateDuration = () => {
    if (!step.startedAt) return null;
    if (isCompleted && step.completedAt) {
      return formatDistanceToNow(step.startedAt, { 
        addSuffix: false,
        locale: zhCN 
      });
    }
    if (isRunning) {
      return formatDistanceToNow(step.startedAt, { 
        addSuffix: true,
        locale: zhCN 
      });
    }
    return null;
  };

  return (
    <Card className={`p-5 transition-all ${getBorderColor(step.status)} ${isRunning ? 'shadow-md' : ''}`}>
      <div className="flex items-start gap-4">
        {/* 步骤序号 */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${getStatusColor(step.status)}`}>
          {isCompleted ? '✓' : index + 1}
        </div>

        {/* 步骤信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl">{step.icon}</span>
            <h3 className="font-semibold text-lg">{step.stepName}</h3>
            <Badge variant={getStatusVariant(step.status)}>
              {getStatusLabel(step.status)}
            </Badge>
            {(isRunning || isCompleted) && step.progress > 0 && (
              <Badge variant="outline">{step.progress}%</Badge>
            )}
          </div>
          
          <p className="text-sm text-gray-600 mt-1">{step.description}</p>

          {/* 进度信息 */}
          {(isRunning || isCompleted || (isPending && step.totalTasks > 0)) && step.totalTasks > 0 && (
            <div className="mt-3 space-y-2">
              {/* 进度条 */}
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    isFailed ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${step.progress}%` }}
                />
              </div>

              {/* 任务统计 */}
              <div className="flex items-center gap-4 text-xs">
                <span className="text-gray-600">
                  <span className="font-medium text-gray-900">{step.completedTasks}</span>
                  {' '}完成
                </span>
                {step.failedTasks > 0 && (
                  <span className="text-red-600">
                    <span className="font-medium">{step.failedTasks}</span>
                    {' '}失败
                  </span>
                )}
                <span className="text-gray-600">
                  总计 {step.totalTasks} 项任务
                </span>
                {(isRunning || isCompleted) && calculateDuration() && (
                  <span className="text-gray-500">
                    耗时 {calculateDuration()}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 错误信息 */}
          {isFailed && step.errorMessage && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">执行失败</p>
              <p className="text-sm text-red-600 mt-1">{step.errorMessage}</p>
            </div>
          )}

          {/* 等待状态提示 */}
          {isPending && index === 0 && (
            <div className="mt-3 text-sm text-gray-500">
              等待开始...
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
