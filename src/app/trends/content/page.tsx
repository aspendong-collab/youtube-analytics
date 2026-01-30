'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function HotContentPage() {
  const hotContents = [
    {
      id: 1,
      title: 'AI技术革新：2024年最新趋势',
      thumbnail: '🤖',
      views: '2.5M',
      likes: '125K',
      comments: '8.5K',
      growth: '+156%',
      category: '科技',
      publishTime: '2小时前',
    },
    {
      id: 2,
      title: '新能源汽车市场分析报告',
      thumbnail: '🚗',
      views: '1.8M',
      likes: '89K',
      comments: '6.2K',
      growth: '+98%',
      category: '汽车',
      publishTime: '5小时前',
    },
    {
      id: 3,
      title: '智能家居生活指南',
      thumbnail: '🏠',
      views: '1.2M',
      likes: '67K',
      comments: '4.8K',
      growth: '+134%',
      category: '生活',
      publishTime: '8小时前',
    },
    {
      id: 4,
      title: '最新游戏评测大合集',
      thumbnail: '🎮',
      views: '980K',
      likes: '54K',
      comments: '3.9K',
      growth: '+89%',
      category: '游戏',
      publishTime: '12小时前',
    },
    {
      id: 5,
      title: '健康饮食：营养师推荐',
      thumbnail: '🥗',
      views: '856K',
      likes: '48K',
      comments: '3.2K',
      growth: '+112%',
      category: '健康',
      publishTime: '1天前',
    },
    {
      id: 6,
      title: '旅行摄影技巧分享',
      thumbnail: '📸',
      views: '723K',
      likes: '41K',
      comments: '2.8K',
      growth: '+76%',
      category: '旅行',
      publishTime: '1天前',
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1D1D1F]">热门内容</h1>
        <p className="text-sm text-[#86868B] mt-1">当前热门的内容和话题</p>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" className="border-[#007AFF] text-[#007AFF]">
          全部
        </Button>
        <Button variant="ghost" className="text-[#86868B]">
          科技
        </Button>
        <Button variant="ghost" className="text-[#86868B]">
          生活
        </Button>
        <Button variant="ghost" className="text-[#86868B]">
          游戏
        </Button>
        <Button variant="ghost" className="text-[#86868B]">
          汽车
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hotContents.map((content) => (
          <Card key={content.id} className="overflow-hidden bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
            <div className="aspect-video bg-gradient-to-br from-[#007AFF]/10 to-[#5856D6]/10 flex items-center justify-center">
              <span className="text-6xl">{content.thumbnail}</span>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{content.category}</Badge>
                <span className="text-xs text-[#86868B]">{content.publishTime}</span>
              </div>
              <h3 className="font-medium text-[#1D1D1F] mb-3 line-clamp-2">
                {content.title}
              </h3>
              <div className="flex items-center justify-between text-sm text-[#86868B] mb-3">
                <span>👁 {content.views}</span>
                <span>👍 {content.likes}</span>
                <span>💬 {content.comments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-600 font-medium text-sm">{content.growth}</span>
                <Button size="sm" variant="ghost" className="text-[#007AFF]">
                  查看详情
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
