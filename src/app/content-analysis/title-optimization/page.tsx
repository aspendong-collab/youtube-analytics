'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Target, TrendingUp, Lightbulb, Copy, Check } from 'lucide-react';

interface TitleOptimization {
  id: string;
  originalTitle: string;
  optimizedTitle: string;
  ctrImprovement: number;
  status: 'pending' | 'running' | 'completed';
  results?: {
    originalCTR: number;
    optimizedCTR: number;
    views: number;
  };
}

interface SuccessCase {
  id: string;
  title: string;
  ctr: number;
  category: string;
}

export default function TitleOptimizationPage() {
  const [optimizations, setOptimizations] = useState<TitleOptimization[]>([]);
  const [successCases, setSuccessCases] = useState<SuccessCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 模拟A/B测试记录
      const mockOptimizations: TitleOptimization[] = [
        {
          id: '1',
          originalTitle: 'Python学习指南',
          optimizedTitle: '10个Python技巧，让你的代码效率提升10倍',
          ctrImprovement: 86,
          status: 'completed',
          results: {
            originalCTR: 5.1,
            optimizedCTR: 9.5,
            views: 156000,
          },
        },
      ];

      // 模拟成功案例
      const mockSuccessCases: SuccessCase[] = [
        {
          id: '1',
          title: '10个Python技巧，让你的代码快10倍',
          ctr: 12.3,
          category: '数字+结果承诺',
        },
        {
          id: '2',
          title: '我是如何3个月学会编程的',
          ctr: 11.7,
          category: '个人经历+时间承诺',
        },
        {
          id: '3',
          title: 'Python新手必看：5个常见错误及解决方法',
          ctr: 10.8,
          category: '目标人群+痛点解决',
        },
      ];

      setOptimizations(mockOptimizations);
      setSuccessCases(mockSuccessCases);
    } catch (error) {
      console.error('加载失败:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOptimization = () => {
    if (!newTitle.trim()) {
      toast.error('请输入原始标题');
      return;
    }

    // 这里应该调用AI生成优化后的标题
    toast.success('优化建议生成成功（模拟）');
    setNewTitle('');
  };

  const handleCopy = (id: string, title: string) => {
    navigator.clipboard.writeText(title);
    setCopiedId(id);
    toast.success('已复制到剪贴板');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-2 flex items-center gap-2">
          <Target className="w-8 h-8" />
          标题与封面优化
        </h1>
        <p className="text-gray-600">
          通过A/B测试和成功案例分析，提升标题和封面的CTR
        </p>
      </div>

      {/* 标题优化输入区 */}
      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          创建新的标题优化
        </h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="originalTitle">原始标题</Label>
            <Input
              id="originalTitle"
              placeholder="输入视频原始标题..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>
          <Button onClick={handleCreateOptimization} className="mt-6">
            生成优化建议
          </Button>
        </div>
      </Card>

      {/* 当前CTR vs 行业平均 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="p-6">
          <h3 className="text-sm text-gray-600 mb-2">你的平均CTR</h3>
          <div className="text-3xl font-bold text-blue-600">5.1%</div>
          <p className="text-sm text-red-500 mt-1">↓ 比行业平均低 37%</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm text-gray-600 mb-2">行业平均CTR</h3>
          <div className="text-3xl font-bold text-green-600">8.3%</div>
          <p className="text-sm text-gray-500 mt-1">参考值</p>
        </Card>
      </div>

      {/* 成功案例库 */}
      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          成功案例推荐
        </h3>
        <div className="space-y-3">
          {successCases.map((caseItem) => (
            <div
              key={caseItem.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <div className="font-medium mb-1">{caseItem.title}</div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{caseItem.category}</Badge>
                  <span className="text-sm text-gray-600">CTR: {caseItem.ctr}%</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(caseItem.id, caseItem.title)}
              >
                {copiedId === caseItem.id ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    复制
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* A/B测试记录 */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          A/B测试记录
        </h3>
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        ) : optimizations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无测试记录
          </div>
        ) : (
          <div className="space-y-4">
            {optimizations.map((opt) => (
              <div key={opt.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">原标题</div>
                    <div className="font-medium mb-2">{opt.originalTitle}</div>
                    <div className="text-sm text-gray-600 mb-1">优化后标题</div>
                    <div className="font-medium text-green-600">{opt.optimizedTitle}</div>
                  </div>
                  <Badge
                    className={
                      opt.status === 'completed'
                        ? 'bg-green-500'
                        : opt.status === 'running'
                        ? 'bg-blue-500'
                        : 'bg-yellow-500'
                    }
                  >
                    {opt.status === 'completed'
                      ? '已完成'
                      : opt.status === 'running'
                      ? '进行中'
                      : '待开始'}
                  </Badge>
                </div>

                {opt.status === 'completed' && opt.results && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">原CTR</div>
                        <div className="font-bold">{opt.results.originalCTR}%</div>
                      </div>
                      <div>
                        <div className="text-gray-600">优化后CTR</div>
                        <div className="font-bold text-green-600">{opt.results.optimizedCTR}%</div>
                      </div>
                      <div>
                        <div className="text-gray-600">提升幅度</div>
                        <div className="font-bold text-blue-600">+{opt.ctrImprovement}%</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
