'use client';

import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ChannelsAnalysisPage() {
  const channels = [
    {
      id: 1,
      name: '科技测评频道',
      subscribers: '125.4K',
      videos: 156,
      avgViews: '45.2K',
      avgEngagement: '8.5%',
      growth: '+12.3%',
    },
    {
      id: 2,
      name: '生活记录',
      subscribers: '89.7K',
      videos: 203,
      avgViews: '32.1K',
      avgEngagement: '6.8%',
      growth: '+8.7%',
    },
    {
      id: 3,
      name: '教程大师',
      subscribers: '234.5K',
      videos: 287,
      avgViews: '78.3K',
      avgEngagement: '11.2%',
      growth: '+15.6%',
    },
    {
      id: 4,
      name: '游戏解说',
      subscribers: '178.2K',
      videos: 145,
      avgViews: '56.7K',
      avgEngagement: '9.4%',
      growth: '+10.2%',
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1D1D1F]">博主分析</h1>
        <p className="text-sm text-[#86868B] mt-1">分析博主的运营数据和表现</p>
      </div>

      <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[#86868B]">博主名称</TableHead>
              <TableHead className="text-[#86868B]">订阅数</TableHead>
              <TableHead className="text-[#86868B]">视频数量</TableHead>
              <TableHead className="text-[#86868B]">平均播放量</TableHead>
              <TableHead className="text-[#86868B]">平均互动率</TableHead>
              <TableHead className="text-[#86868B]">增长率</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {channels.map((channel) => (
              <TableRow key={channel.id}>
                <TableCell className="font-medium">{channel.name}</TableCell>
                <TableCell>{channel.subscribers}</TableCell>
                <TableCell>{channel.videos}</TableCell>
                <TableCell>{channel.avgViews}</TableCell>
                <TableCell>{channel.avgEngagement}</TableCell>
                <TableCell className="text-green-600">{channel.growth}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
          <h3 className="text-lg font-medium text-[#1D1D1F] mb-2">总订阅数</h3>
          <p className="text-3xl font-bold text-[#007AFF]">627.8K</p>
          <p className="text-sm text-[#86868B] mt-1">所有博主合计</p>
        </Card>
        <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
          <h3 className="text-lg font-medium text-[#1D1D1F] mb-2">总视频数</h3>
          <p className="text-3xl font-bold text-[#007AFF]">791</p>
          <p className="text-sm text-[#86868B] mt-1">所有博主合计</p>
        </Card>
        <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
          <h3 className="text-lg font-medium text-[#1D1D1F] mb-2">平均增长率</h3>
          <p className="text-3xl font-bold text-green-600">+11.7%</p>
          <p className="text-sm text-[#86868B] mt-1">较上月</p>
        </Card>
      </div>
    </div>
  );
}
