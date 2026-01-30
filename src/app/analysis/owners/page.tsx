'use client';

import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function OwnersPerformancePage() {
  const performance = [
    {
      id: 1,
      name: '张三',
      videos: 12,
      totalViews: '1.2M',
      avgViews: '100K',
      engagement: '8.5%',
      revenue: '¥12,500',
      rank: 1,
    },
    {
      id: 2,
      name: '李四',
      videos: 8,
      totalViews: '890K',
      avgViews: '111K',
      engagement: '9.2%',
      revenue: '¥10,200',
      rank: 2,
    },
    {
      id: 3,
      name: '王五',
      videos: 15,
      totalViews: '1.5M',
      avgViews: '100K',
      engagement: '7.8%',
      revenue: '¥15,800',
      rank: 3,
    },
    {
      id: 4,
      name: '赵六',
      videos: 10,
      totalViews: '750K',
      avgViews: '75K',
      engagement: '6.5%',
      revenue: '¥8,900',
      rank: 4,
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1D1D1F]">负责人绩效</h1>
        <p className="text-sm text-[#86868B] mt-1">查看负责人的工作绩效和表现</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
          <h3 className="text-sm font-medium text-[#86868B] mb-2">总视频数</h3>
          <p className="text-2xl font-bold text-[#1D1D1F]">45</p>
        </Card>
        <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
          <h3 className="text-sm font-medium text-[#86868B] mb-2">总播放量</h3>
          <p className="text-2xl font-bold text-[#007AFF]">4.34M</p>
        </Card>
        <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
          <h3 className="text-sm font-medium text-[#86868B] mb-2">平均互动率</h3>
          <p className="text-2xl font-bold text-[#007AFF]">8.0%</p>
        </Card>
        <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
          <h3 className="text-sm font-medium text-[#86868B] mb-2">总收入</h3>
          <p className="text-2xl font-bold text-green-600">¥47,400</p>
        </Card>
      </div>

      <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
        <h3 className="text-lg font-medium text-[#1D1D1F] mb-4">绩效排行榜</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[#86868B]">排名</TableHead>
              <TableHead className="text-[#86868B]">姓名</TableHead>
              <TableHead className="text-[#86868B]">视频数</TableHead>
              <TableHead className="text-[#86868B]">总播放量</TableHead>
              <TableHead className="text-[#86868B]">平均播放量</TableHead>
              <TableHead className="text-[#86868B]">互动率</TableHead>
              <TableHead className="text-[#86868B]">收入</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {performance.map((person) => (
              <TableRow key={person.id}>
                <TableCell>
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                    person.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                    person.rank === 2 ? 'bg-gray-100 text-gray-800' :
                    person.rank === 3 ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-50 text-gray-600'
                  }`}>
                    {person.rank}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{person.name}</TableCell>
                <TableCell>{person.videos}</TableCell>
                <TableCell>{person.totalViews}</TableCell>
                <TableCell>{person.avgViews}</TableCell>
                <TableCell>{person.engagement}</TableCell>
                <TableCell className="font-medium text-green-600">{person.revenue}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
