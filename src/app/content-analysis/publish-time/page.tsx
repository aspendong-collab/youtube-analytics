'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, Clock, TrendingUp, Users, CheckCircle, AlertCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface TimeSlot {
  hour: number;
  viewers: number;
  engagement: number;
  retention: number;
}

interface BestPublishTime {
  day: string;
  hour: number;
  viewers: number;
  engagement: number;
  retention: number;
}

interface SpecialDate {
  date: string;
  type: 'holiday' | 'event' | 'trend';
  name: string;
  impact: 'high' | 'medium' | 'low';
}

export default function PublishTimeOptimizationPage() {
  const [loading, setLoading] = useState(true);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [bestPublishTimes, setBestPublishTimes] = useState<BestPublishTime[]>([]);
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([]);
  const [currentTimezone, setCurrentTimezone] = useState('UTC+8');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 模拟时间段数据
      const mockTimeSlots: TimeSlot[] = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        viewers: Math.floor(Math.random() * 50000) + 10000,
        engagement: Math.floor(Math.random() * 50) + 50,
        retention: Math.floor(Math.random() * 40) + 40,
      }));

      // 模拟最佳发布时间
      const mockBestTimes: BestPublishTime[] = [
        {
          day: '周六',
          hour: 10,
          viewers: 125000,
          engagement: 78,
          retention: 72,
        },
        {
          day: '周日',
          hour: 15,
          viewers: 118000,
          engagement: 75,
          retention: 70,
        },
        {
          day: '周五',
          hour: 19,
          viewers: 95000,
          engagement: 68,
          retention: 65,
        },
      ];

      // 模拟特殊日期
      const mockSpecialDates: SpecialDate[] = [
        {
          date: '2025-01-01',
          type: 'holiday',
          name: '元旦',
          impact: 'high',
        },
        {
          date: '2025-01-29',
          type: 'holiday',
          name: '春节',
          impact: 'high',
        },
        {
          date: '2025-02-14',
          type: 'event',
          name: '情人节',
          impact: 'medium',
        },
      ];

      setTimeSlots(mockTimeSlots);
      setBestPublishTimes(mockBestTimes);
      setSpecialDates(mockSpecialDates);
    } catch (error) {
      console.error('加载失败:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTimezoneChange = (timezone: string) => {
    setCurrentTimezone(timezone);
    toast.success(`时区已切换至 ${timezone}`);
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high':
        return <Badge className="bg-red-100 text-red-700">高影响</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-700">中影响</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-700">低影响</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'holiday':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'event':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'trend':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-2 flex items-center gap-2">
          <Clock className="w-8 h-8" />
          发布时机优化
        </h1>
        <p className="text-gray-600">
          分析最佳发布时间，提升视频初始表现
        </p>
      </div>

      {/* 时区选择 */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-1">时区设置</h3>
            <p className="text-sm text-gray-600">选择你的目标观众时区</p>
          </div>
          <div className="flex gap-2">
            {['UTC+8', 'UTC-5', 'UTC+0', 'UTC-8'].map((tz) => (
              <Button
                key={tz}
                variant={currentTimezone === tz ? 'default' : 'outline'}
                onClick={() => handleTimezoneChange(tz)}
              >
                {tz}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* 最佳发布时间 */}
      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          最佳发布时间
        </h3>
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {bestPublishTimes.map((time, index) => (
              <Card
                key={`${time.day}-${time.hour}`}
                className="p-4 bg-green-50 border-green-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <Badge className="bg-green-500">推荐 #{index + 1}</Badge>
                  <div className="text-sm text-gray-600">{currentTimezone}</div>
                </div>
                <div className="text-2xl font-bold mb-2">
                  {time.day} {time.hour}:00
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">观众数</span>
                    <span className="font-medium">{(time.viewers / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">互动率</span>
                    <span className="font-medium text-green-600">{time.engagement}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">完播率</span>
                    <span className="font-medium text-blue-600">{time.retention}%</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* 一天24小时观众活跃度 */}
      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          一天24小时观众活跃度
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeSlots}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="hour"
              tickFormatter={(value) => `${value}:00`}
            />
            <YAxis />
            <Tooltip
              formatter={(value: number | undefined) => value ? value.toLocaleString() : '0'}
              labelFormatter={(value) => `${value}:00`}
            />
            <Line
              type="monotone"
              dataKey="viewers"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* 互动率和完播率趋势 */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">互动率趋势</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={timeSlots}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="hour"
                tickFormatter={(value) => `${value}:00`}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip
                formatter={(value: number | undefined) => value ? `${value}%` : '0%'}
                labelFormatter={(value) => `${value}:00`}
              />
              <Bar dataKey="engagement" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">完播率趋势</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={timeSlots}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="hour"
                tickFormatter={(value) => `${value}:00`}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip
                formatter={(value: number | undefined) => value ? `${value}%` : '0%'}
                labelFormatter={(value) => `${value}:00`}
              />
              <Bar dataKey="retention" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* 特殊日期提醒 */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          特殊日期提醒
        </h3>
        <div className="space-y-3">
          {specialDates.map((date) => (
            <div
              key={date.date}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                {getTypeIcon(date.type)}
                <div>
                  <div className="font-medium">{date.name}</div>
                  <div className="text-sm text-gray-600">{date.date}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getImpactBadge(date.impact)}
                <Button variant="outline" size="sm">
                  查看详情
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 发布建议 */}
      <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-3">💡 发布建议</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            <span>在最佳时间段（周六10:00、周日15:00、周五19:00）发布视频可获得更高的初始曝光</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            <span>避免在观众活跃度较低的时段（凌晨2-6点）发布</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            <span>特殊日期（如春节、元旦）前后可以调整发布策略，利用节日流量</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            <span>根据观众所在时区调整发布时间，确保目标观众在线时看到新视频</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
