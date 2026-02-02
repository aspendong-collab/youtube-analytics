'use client';

import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function TrackingPage() {
  const trackingData = [
    {
      id: 1,
      videoTitle: '最新科技产品评测',
      suggestion: '优化标题关键词',
      status: 'completed',
      beforeViews: '25.3K',
      afterViews: '42.1K',
      improvement: '+66.4%',
      date: '2024-01-15',
    },
    {
      id: 2,
      videoTitle: '日常生活Vlog 2024',
      suggestion: '调整视频时长',
      status: 'in-progress',
      beforeViews: '18.7K',
      afterViews: '22.4K',
      improvement: '+19.8%',
      date: '2024-01-14',
    },
    {
      id: 3,
      videoTitle: '编程教程：React入门',
      suggestion: '添加章节标注',
      status: 'pending',
      beforeViews: '15.2K',
      afterViews: '-',
      improvement: '-',
      date: '2024-01-13',
    },
    {
      id: 4,
      videoTitle: '游戏实况：王者荣耀',
      suggestion: '优化视频封面',
      status: 'completed',
      beforeViews: '32.1K',
      afterViews: '58.9K',
      improvement: '+83.5%',
      date: '2024-01-12',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">已完成</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800">进行中</Badge>;
      case 'pending':
        return <Badge variant="secondary">待处理</Badge>;
      default:
        return <Badge>未知</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1D1D1F]">优化追踪</h1>
        <p className="text-sm text-[#86868B] mt-1">追踪优化建议的执行情况和效果</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
          <h3 className="text-sm font-medium text-[#86868B] mb-2">总优化建议</h3>
          <p className="text-2xl font-bold text-[#1D1D1F]">156</p>
        </Card>
        <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
          <h3 className="text-sm font-medium text-[#86868B] mb-2">已完成</h3>
          <p className="text-2xl font-bold text-green-600">89</p>
        </Card>
        <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
          <h3 className="text-sm font-medium text-[#86868B] mb-2">进行中</h3>
          <p className="text-2xl font-bold text-blue-600">42</p>
        </Card>
        <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
          <h3 className="text-sm font-medium text-[#86868B] mb-2">待处理</h3>
          <p className="text-2xl font-bold text-[#86868B]">25</p>
        </Card>
      </div>

      <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
        <h3 className="text-lg font-medium text-[#1D1D1F] mb-4">优化记录</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[#86868B]">视频标题</TableHead>
              <TableHead className="text-[#86868B]">优化建议</TableHead>
              <TableHead className="text-[#86868B]">状态</TableHead>
              <TableHead className="text-[#86868B]">优化前</TableHead>
              <TableHead className="text-[#86868B]">优化后</TableHead>
              <TableHead className="text-[#86868B]">提升幅度</TableHead>
              <TableHead className="text-[#86868B]">日期</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trackingData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.videoTitle}</TableCell>
                <TableCell>{item.suggestion}</TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
                <TableCell>{item.beforeViews}</TableCell>
                <TableCell>{item.afterViews}</TableCell>
                <TableCell className="text-green-600 font-medium">{item.improvement}</TableCell>
                <TableCell>{item.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
