'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FlaskConical, TrendingUp, Users, Eye, RefreshCw, Play, Square } from 'lucide-react';

interface Variant {
  id: string;
  name: string;
  title: string;
  description: string;
  thumbnail?: string;
  metrics: {
    views: number;
    ctr: number;
    avgWatchTime: number;
    engagement: number;
  };
}

export default function ABTestPage() {
  const [testName, setTestName] = useState('');
  const [variantA, setVariantA] = useState({ title: '', description: '' });
  const [variantB, setVariantB] = useState({ title: '', description: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [testId, setTestId] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<'draft' | 'running' | 'completed'>('draft');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCreateTest = async () => {
    if (!testName.trim()) {
      toast.error('请输入测试名称');
      return;
    }
    if (!variantA.title.trim() || !variantB.title.trim()) {
      toast.error('请填写两个变体的标题');
      return;
    }

    setIsCreating(true);

    try {
      // 获取用户ID（简化处理，实际应该从session获取）
      const userId = 'default-user';

      const response = await fetch('/api/ab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: testName,
          type: 'title',
          userId,
          variants: [
            { variantName: 'A', title: variantA.title, description: variantA.description },
            { variantName: 'B', title: variantB.title, description: variantB.description },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('创建测试失败');
      }

      const data = await response.json();
      setTestId(data.test.id);

      // 转换数据格式
      const newVariants: Variant[] = data.test.variants.map((v: any) => ({
        id: v.id,
        name: `变体 ${v.variantName}`,
        title: v.title,
        description: v.description,
        thumbnail: v.thumbnail,
        metrics: {
          views: v.views || 0,
          ctr: parseFloat(v.ctr || 0),
          avgWatchTime: v.avgWatchTime || 0,
          engagement: 0,
        },
      }));

      setVariants(newVariants);
      setTestStatus('draft');
      toast.success('A/B测试创建成功');

      // 重置表单
      setTestName('');
      setVariantA({ title: '', description: '' });
      setVariantB({ title: '', description: '' });
    } catch (error) {
      console.error('创建失败:', error);
      toast.error(error instanceof Error ? error.message : '创建失败');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartTest = async () => {
    if (!testId) return;

    try {
      const response = await fetch('/api/ab-tests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId, status: 'running' }),
      });

      if (!response.ok) throw new Error('启动测试失败');

      setTestStatus('running');
      toast.success('测试已启动');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '启动失败');
    }
  };

  const handleStopTest = async () => {
    if (!testId) return;

    try {
      const response = await fetch('/api/ab-tests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId, status: 'completed' }),
      });

      if (!response.ok) throw new Error('停止测试失败');

      setTestStatus('completed');
      toast.success('测试已停止');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '停止失败');
    }
  };

  const refreshData = async () => {
    if (!testId) return;

    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/ab-tests/${testId}`);
      if (!response.ok) throw new Error('获取数据失败');

      const data = await response.json();

      const updatedVariants: Variant[] = data.test.variants.map((v: any) => ({
        id: v.id,
        name: `变体 ${v.variantName}`,
        title: v.title,
        description: v.description,
        thumbnail: v.thumbnail,
        metrics: {
          views: v.views || 0,
          ctr: parseFloat(v.ctr || 0),
          avgWatchTime: v.avgWatchTime || 0,
          engagement: parseFloat(v.conversionRate || 0),
        },
      }));

      setVariants(updatedVariants);
      setTestStatus(data.test.status);
      toast.success('数据已更新');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '刷新失败');
    } finally {
      setIsRefreshing(false);
    }
  };

  // 模拟记录事件（实际应用中应该由前端自动记录）
  const simulateImpression = async (variantId: string) => {
    try {
      await fetch('/api/ab-tests/record-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, eventType: 'impression' }),
      });
      refreshData();
    } catch (error) {
      console.error('记录展示失败:', error);
    }
  };

  const getWinner = () => {
    if (variants.length === 0) return null;
    return variants.reduce((prev, current) =>
      prev.metrics.ctr > current.metrics.ctr ? prev : current
    );
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-2 flex items-center gap-2">
          <FlaskConical className="w-8 h-8" />
          A/B 测试
        </h1>
        <p className="text-gray-600">
          对比不同的标题、封面和描述，找出最佳方案
        </p>
      </div>

      {/* 创建测试表单 */}
      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4">创建新的A/B测试</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="testName">测试名称</Label>
            <Input
              id="testName"
              placeholder="例如：标题优化测试"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-blue-600 font-medium">变体 A</Label>
              <Input
                placeholder="标题 A"
                value={variantA.title}
                onChange={(e) => setVariantA({ ...variantA, title: e.target.value })}
              />
              <Textarea
                placeholder="描述 A"
                value={variantA.description}
                onChange={(e) => setVariantA({ ...variantA, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-green-600 font-medium">变体 B</Label>
              <Input
                placeholder="标题 B"
                value={variantB.title}
                onChange={(e) => setVariantB({ ...variantB, title: e.target.value })}
              />
              <Textarea
                placeholder="描述 B"
                value={variantB.description}
                onChange={(e) => setVariantB({ ...variantB, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <Button onClick={handleCreateTest} disabled={isCreating} className="w-full">
            {isCreating ? '创建中...' : '创建测试'}
          </Button>
        </div>
      </Card>

      {/* 测试控制和结果 */}
      {variants.length > 0 && (
        <div className="space-y-6">
          {/* 控制面板 */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant={testStatus === 'running' ? 'default' : testStatus === 'completed' ? 'secondary' : 'outline'}>
                  {testStatus === 'draft' && '草稿'}
                  {testStatus === 'running' && '进行中'}
                  {testStatus === 'completed' && '已完成'}
                </Badge>
                <span className="text-sm text-gray-600">
                  {testStatus === 'draft' && '点击启动开始测试'}
                  {testStatus === 'running' && '测试进行中，数据实时更新'}
                  {testStatus === 'completed' && '测试已结束，查看结果'}
                </span>
              </div>
              <div className="flex gap-2">
                {testStatus === 'draft' && (
                  <Button onClick={handleStartTest}>
                    <Play className="w-4 h-4 mr-2" />
                    启动测试
                  </Button>
                )}
                {testStatus === 'running' && (
                  <>
                    <Button onClick={handleStopTest} variant="outline">
                      <Square className="w-4 h-4 mr-2" />
                      停止测试
                    </Button>
                    <Button onClick={refreshData} disabled={isRefreshing} variant="outline">
                      <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                      刷新数据
                    </Button>
                  </>
                )}
                {testStatus === 'completed' && (
                  <Button onClick={refreshData} disabled={isRefreshing} variant="outline">
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    刷新数据
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* 胜者展示 */}
          {testStatus === 'completed' && (() => {
            const winner = getWinner();
            if (!winner) return null;
            return (
              <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  <h3 className="font-semibold text-lg">测试结果</h3>
                </div>
                <div className="p-4 bg-white rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-green-100 text-green-700">
                      🏆 胜者：{winner.name}
                    </Badge>
                  </div>
                  <div className="text-xl font-medium">{winner.title}</div>
                </div>
              </Card>
            );
          })()}

          {/* 变体对比 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {variants.map((variant) => {
              const isWinner = getWinner()?.id === variant.id;
              return (
                <Card
                  key={variant.id}
                  className={`p-6 ${isWinner ? 'ring-2 ring-green-500' : ''}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{variant.name}</h3>
                    {isWinner && testStatus === 'completed' && (
                      <Badge className="bg-green-100 text-green-700">🏆 胜者</Badge>
                    )}
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <Label className="text-xs text-gray-500">标题</Label>
                      <div className="font-medium">{variant.title}</div>
                    </div>
                    {variant.description && (
                      <div>
                        <Label className="text-xs text-gray-500">描述</Label>
                        <div className="text-sm text-gray-600">{variant.description}</div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Eye className="w-4 h-4" />
                        展示次数
                      </div>
                      <span className="font-semibold">
                        {variant.metrics.views || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <TrendingUp className="w-4 h-4" />
                        点击率
                      </div>
                      <span className={`font-semibold ${isWinner ? 'text-green-600' : ''}`}>
                        {formatPercent(variant.metrics.ctr)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        平均观看时长
                      </div>
                      <span className="font-semibold">
                        {formatDuration(variant.metrics.avgWatchTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        转化率
                      </div>
                      <span className="font-semibold">
                        {formatPercent(variant.metrics.engagement)}
                      </span>
                    </div>
                  </div>

                  {testStatus === 'running' && (
                    <Button
                      onClick={() => simulateImpression(variant.id)}
                      variant="outline"
                      className="w-full mt-4"
                      size="sm"
                    >
                      模拟一次展示
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {!isCreating && variants.length === 0 && (
        <Card className="p-12 text-center text-gray-500">
          <FlaskConical className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>创建第一个A/B测试开始优化</p>
        </Card>
      )}

      {/* 加载状态 */}
      {isCreating && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">创建测试中...</p>
        </div>
      )}
    </div>
  );
}
