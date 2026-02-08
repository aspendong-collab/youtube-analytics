/**
 * 实时日志组件
 * 显示工作流执行过程中的实时日志
 */

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

interface LogEntry {
  id: string;
  campaignId: string;
  stepId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  details: Record<string, any> | null;
  timestamp: Date;
}

interface LiveLogsProps {
  campaignId: string;
  autoRefresh?: boolean;
  maxLogs?: number;
}

export function LiveLogs({ campaignId, autoRefresh = true, maxLogs = 100 }: LiveLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const loadLogs = async () => {
    try {
      const response = await fetch(`/api/v1/campaigns/${campaignId}/workflow-logs?limit=${maxLogs}`);
      const result = await response.json();
      
      if (result.success) {
        setLogs(result.data.logs || []);
      }
    } catch (error) {
      console.error("Load logs error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    
    let interval: NodeJS.Timeout | null = null;
    if (autoRefreshEnabled) {
      interval = setInterval(loadLogs, 2000); // 每2秒刷新日志
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [campaignId, autoRefreshEnabled, maxLogs]);

  // 自动滚动到底部
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const handleClearLogs = () => {
    setLogs([]);
    toast.success("日志已清除");
  };

  const handleCopyLogs = () => {
    const logText = logs.map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString('zh-CN');
      const details = log.details ? `\n  ${JSON.stringify(log.details, null, 2)}` : '';
      return `[${time}] [${log.level.toUpperCase()}] [${log.stepId}] ${log.message}${details}`;
    }).join('\n\n');
    
    navigator.clipboard.writeText(logText);
    toast.success("日志已复制到剪贴板");
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info':
        return 'text-green-400';
      case 'warn':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      case 'debug':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const getLevelBgColor = (level: string) => {
    switch (level) {
      case 'info':
        return 'bg-green-900/30 border-green-700';
      case 'warn':
        return 'bg-yellow-900/30 border-yellow-700';
      case 'error':
        return 'bg-red-900/30 border-red-700';
      case 'debug':
        return 'bg-blue-900/30 border-blue-700';
      default:
        return 'bg-gray-900/30 border-gray-700';
    }
  };

  const getStepDisplayName = (stepId: string) => {
    const stepNames: Record<string, string> = {
      'init': '初始化',
      'search_influencers': '搜索达人',
      'extract_emails': '提取邮箱',
      'calculate_cpv': '计算CPV',
      'filter_by_budget': '预算筛选',
      'create_email_queue': '创建邮件队列',
      'send_emails': '发送邮件',
      'track_responses': '跟踪反馈',
      'analyze_responses': '分析回复',
      'start_negotiation': '启动谈判',
      'complete': '完成',
    };
    return stepNames[stepId] || stepId;
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">加载日志...</span>
        </div>
      </Card>
    );
  }

  const logCount = logs.length;
  const errorCount = logs.filter(l => l.level === 'error').length;
  const warnCount = logs.filter(l => l.level === 'warn').length;

  return (
    <Card className="p-6">
      {/* 标题和操作按钮 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">实时日志</h2>
          <p className="text-sm text-gray-600 mt-1">
            {logCount} 条日志
            {errorCount > 0 && (
              <span className="text-red-600 ml-2">({errorCount} 错误)</span>
            )}
            {warnCount > 0 && (
              <span className="text-yellow-600 ml-2">({warnCount} 警告)</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            variant={autoRefreshEnabled ? "default" : "outline"}
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefreshEnabled ? 'animate-spin' : ''}`} />
            {autoRefreshEnabled ? '自动刷新' : '手动刷新'}
          </Button>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
          >
            刷新
          </Button>
          <Button
            onClick={handleCopyLogs}
            variant="outline"
            size="sm"
          >
            <Copy className="w-4 h-4 mr-2" />
            复制
          </Button>
          <Button
            onClick={handleClearLogs}
            variant="outline"
            size="sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            清除
          </Button>
        </div>
      </div>

      {/* 日志窗口 */}
      <div className="bg-gray-950 rounded-lg p-4 font-mono text-sm min-h-[400px] max-h-[600px] overflow-y-auto">
        {logs.length > 0 ? (
          <div className="space-y-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`py-2 px-3 rounded border-l-2 ${getLevelBgColor(log.level)} ${getLevelColor(log.level)}`}
              >
                <div className="flex items-center gap-3">
                  {/* 时间戳 */}
                  <span className="opacity-70 flex-shrink-0">
                    [{formatTimestamp(log.timestamp)}]
                  </span>
                  
                  {/* 步骤名称 */}
                  <Badge variant="outline" className="flex-shrink-0 text-xs border-gray-600">
                    {getStepDisplayName(log.stepId)}
                  </Badge>
                  
                  {/* 级别 */}
                  <Badge variant="outline" className="flex-shrink-0 text-xs">
                    {log.level.toUpperCase()}
                  </Badge>
                  
                  {/* 消息 */}
                  <span className="flex-1 break-all">
                    {log.message}
                  </span>
                </div>
                
                {/* 详细信息 */}
                {log.details && Object.keys(log.details).length > 0 && (
                  <div className="ml-4 mt-2 text-gray-500 text-xs overflow-x-auto">
                    <pre>{JSON.stringify(log.details, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-96 text-gray-500">
            暂无日志
          </div>
        )}
      </div>
    </Card>
  );
}
