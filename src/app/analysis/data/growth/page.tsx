'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { TrendingUp, Users, Calendar, Activity, ArrowUp, ArrowDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface GrowthData {
  channelId: string;
  channelTitle: string;
  currentSubscribers: number;
  growthHistory: Array<{ date: string; subscribers: number; dailyChange: number }>;
  weeklyGrowth: number;
  monthlyGrowth: number;
  growthRate: number;
  milestones: Array<{ date: string; subscribers: number; type: 'milestone' | 'peak' | 'low' }>;
  predictions: Array<{ month: string; predictedSubscribers: number }>;
}

export default function GrowthAnalysisPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [growthData, setGrowthData] = useState<GrowthData | null>(null);

  useEffect(() => {
    loadGrowthData();
  }, []);

  const loadGrowthData = async () => {
    setIsLoading(true);

    try {
      // 从localStorage获取追踪的频道
      const saved = localStorage.getItem('trackedChannels');
      if (!saved) {
        toast.error('请先添加要追踪的频道');
        setIsLoading(false);
        return;
      }

      const trackedChannels = JSON.parse(saved);
      if (trackedChannels.length === 0) {
        toast.error('请先添加要追踪的频道');
        setIsLoading(false);
        return;
      }

      // 模拟增长数据
      const mockGrowthData: GrowthData = {
        channelId: trackedChannels[0].channelId,
        channelTitle: trackedChannels[0].channelTitle,
        currentSubscribers: 125000,
        growthHistory: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          subscribers: 100000 + i * 833 + Math.floor(Math.random() * 1000),
          dailyChange: Math.floor(Math.random() * 500) - 100,
        })),
        weeklyGrowth: 5.2,
        monthlyGrowth: 18.5,
        growthRate: 2.3,
        milestones: [
          { date: '2024-01-01', subscribers: 100000, type: 'milestone' },
          { date: '2024-01-10', subscribers: 110000, type: 'peak' },
          { date: '2024-01-20', subscribers: 105000, type: 'low' },
          { date: '2024-01-30', subscribers: 125000, type: 'milestone' },
        ],
        predictions: [
          { month: '2月', predictedSubscribers: 135000 },
          { month: '3月', predictedSubscribers: 145000 },
          { month: '4月', predictedSubscribers: 155000 },
          { month: '5月', predictedSubscribers: 165000 },
        ],
      };

      setGrowthData(mockGrowthData);
    } catch (error) {
      console.error('加载失败:', error);
      toast.error(error instanceof Error ? error.message : '加载失败');
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="w-8 h-8" />
            粉丝增长分析
          </h1>
          <p className="text-gray-600">
            追踪粉丝增长趋势，预测未来增长
          </p>
        </div>
        <Button onClick={loadGrowthData} disabled={isLoading}>
          {isLoading ? '加载中...' : '刷新数据'}
        </Button>
      </div>

      {/* 增长数据 */}
      {growthData && (
        <div className="space-y-6">
          {/* 概览卡片 */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">频道: {growthData.channelTitle}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">当前粉丝</div>
                <div className="text-2xl font-bold">
                  {formatNumber(growthData.currentSubscribers)}
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">周增长率</div>
                <div className={`text-2xl font-bold ${growthData.weeklyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {growthData.weeklyGrowth >= 0 ? '+' : ''}{growthData.weeklyGrowth}%
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">月增长率</div>
                <div className={`text-2xl font-bold ${growthData.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {growthData.monthlyGrowth >= 0 ? '+' : ''}{growthData.monthlyGrowth}%
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">日均增长</div>
                <div className="text-2xl font-bold">
                  {growthData.growthRate}%
                </div>
              </div>
            </div>

            {/* 增长历史曲线图表 */}
            <div>
              <h4 className="font-medium mb-3">30天粉丝增长趋势</h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growthData.growthHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => value.split('-').slice(1).join('/')}
                    />
                    <YAxis
                      tickFormatter={(value) => formatNumber(value)}
                    />
                    <Tooltip
                      labelFormatter={(value) => value}
                      formatter={(value: number, name: string) => formatNumber(value)}
                    />
                    <Line
                      type="monotone"
                      dataKey="subscribers"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6' }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          {/* 每日变化柱状图 */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              每日变化趋势
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthData.growthHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => value.split('-').slice(1).join('/')}
                  />
                  <YAxis tickFormatter={(value) => `${value >= 0 ? '+' : ''}${value}`} />
                  <Tooltip
                    labelFormatter={(value) => value}
                    formatter={(value: number, name: string) => `${value >= 0 ? '+' : ''}${value}`}
                  />
                  <Bar
                    dataKey="dailyChange"
                    fill={(entry: any) => entry.dailyChange >= 0 ? '#22c55e' : '#ef4444'}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 里程碑 */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              关键节点
            </h3>
            <div className="space-y-3">
              {growthData.milestones.map((milestone, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {milestone.type === 'milestone' && (
                      <Badge className="bg-blue-100 text-blue-700">里程碑</Badge>
                    )}
                    {milestone.type === 'peak' && (
                      <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                        <ArrowUp className="w-3 h-3" />
                        峰值
                      </Badge>
                    )}
                    {milestone.type === 'low' && (
                      <Badge className="bg-red-100 text-red-700 flex items-center gap-1">
                        <ArrowDown className="w-3 h-3" />
                        低谷
                      </Badge>
                    )}
                    <div className="font-medium">
                      {formatNumber(milestone.subscribers)} 粉丝
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {milestone.date}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 预测 */}
          <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              未来预测
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {growthData.predictions.map((prediction, index) => (
                <div key={index} className="text-center p-4 bg-white rounded-lg border">
                  <div className="text-sm text-gray-600 mb-1">{prediction.month}</div>
                  <div className="text-xl font-bold text-purple-600">
                    {formatNumber(prediction.predictedSubscribers)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    预计粉丝数
                  </div>
                </div>
              ))}
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthData.predictions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value: number) => formatNumber(value)} />
                  <Tooltip formatter={(value: number, name: string) => formatNumber(value)} />
                  <Bar dataKey="predictedSubscribers" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* 空状态 */}
      {!isLoading && !growthData && (
        <Card className="p-12 text-center text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>点击右上角按钮加载增长数据</p>
          <p className="text-sm mt-2">请先在"竞品频道追踪"中添加频道</p>
        </Card>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      )}
    </div>
  );
}
