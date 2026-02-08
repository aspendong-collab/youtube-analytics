/**
 * 工作流步骤可视化组件
 * 显示完整的自动化工作流和每一步的执行状态
 */

import { useEffect, useState } from "react";
import { WorkflowStepCard } from "./workflow-step-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Play } from "lucide-react";
import { toast } from "sonner";
import { WorkflowStepStatus } from "@/storage/database/shared/schema";

interface WorkflowStep {
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
}

interface WorkflowStepsProps {
  campaignId: string;
  autoRefresh?: boolean;
}

export function WorkflowSteps({ campaignId, autoRefresh = true }: WorkflowStepsProps) {
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  const loadSteps = async () => {
    try {
      const response = await fetch(`/api/v1/campaigns/${campaignId}/workflow-steps`);
      const result = await response.json();
      
      if (result.success) {
        setSteps(result.data.steps || []);
        setOverallProgress(result.data.overallProgress || 0);
      }
    } catch (error) {
      console.error("Load workflow steps error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSteps();
    
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(loadSteps, 3000); // 每3秒刷新
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [campaignId, autoRefresh]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadSteps();
  };

  const calculateProgress = () => {
    if (steps.length === 0) return 0;
    
    const completedSteps = steps.filter(s => s.status === 'completed').length;
    const inProgressSteps = steps.filter(s => s.status === 'in_progress').length;
    
    // 计算总进度
    const stepProgress = steps.reduce((sum, step) => sum + step.progress, 0);
    return Math.round(stepProgress / steps.length);
  };

  const getStatusSummary = () => {
    const completed = steps.filter(s => s.status === 'completed').length;
    const inProgress = steps.filter(s => s.status === 'in_progress').length;
    const failed = steps.filter(s => s.status === 'failed').length;
    const total = steps.length;

    return { completed, inProgress, failed, total };
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">加载工作流...</span>
        </div>
      </Card>
    );
  }

  const summary = getStatusSummary();

  return (
    <Card className="p-6">
      {/* 标题和操作按钮 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">自动化工作流</h2>
          <p className="text-sm text-gray-600 mt-1">
            实时查看每个步骤的执行进度
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* 总体进度 */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">总体进度</span>
          <span className="text-lg font-bold text-blue-600">{calculateProgress()}%</span>
        </div>
        <div className="w-full bg-white rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${calculateProgress()}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            已完成: {summary.completed}/{summary.total}
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            进行中: {summary.inProgress}
          </span>
          {summary.failed > 0 && (
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              失败: {summary.failed}
            </span>
          )}
        </div>
      </div>

      {/* 步骤列表 */}
      <div className="space-y-3">
        {steps.length > 0 ? (
          steps.map((step, index) => (
            <WorkflowStepCard
              key={step.id}
              step={step}
              index={index}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            暂无工作流数据
          </div>
        )}
      </div>
    </Card>
  );
}
