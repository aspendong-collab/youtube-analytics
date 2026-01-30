'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function TopicRecommendationPage() {
  const topics = [
    {
      id: 1,
      name: '人工智能',
      description: 'AI技术、机器学习、深度学习等相关话题',
     热度: '9.8M',
      growth: '+234%',
      trend: 'up',
      tags: ['ChatGPT', '机器学习', '深度学习', '自动化'],
      related: ['Python编程', '数据科学', '云计算'],
    },
    {
      id: 2,
      name: '新能源汽车',
      description: '电动汽车、混合动力汽车、充电桩等',
      热度: '8.5M',
      growth: '+189%',
      trend: 'up',
      tags: ['特斯拉', '比亚迪', '充电桩', '自动驾驶'],
      related: ['汽车评测', '电池技术', '智能驾驶'],
    },
    {
      id: 3,
      name: '智能家居',
      description: '智能家电、物联网、家庭自动化',
      热度: '7.2M',
      growth: '+156%',
      trend: 'up',
      tags: ['智能音箱', '智能门锁', '智能灯光', '安防系统'],
      related: ['科技评测', '生活指南', '装修设计'],
    },
    {
      id: 4,
      name: '健康生活',
      description: '健身、营养、心理健康等健康相关话题',
      热度: '6.8M',
      growth: '+134%',
      trend: 'stable',
      tags: ['健身', '瑜伽', '营养搭配', '心理健康'],
      related: ['瑜伽教程', '营养食谱', '冥想'],
    },
    {
      id: 5,
      name: '游戏直播',
      description: '热门游戏、电竞、游戏攻略',
      热度: '5.9M',
      growth: '+112%',
      trend: 'up',
      tags: ['王者荣耀', '英雄联盟', '原神', 'CS:GO'],
      related: ['游戏攻略', '电竞新闻', '游戏评测'],
    },
    {
      id: 6,
      name: '旅行摄影',
      description: '旅行攻略、摄影技巧、户外探险',
      热度: '4.5M',
      growth: '+98%',
      trend: 'stable',
      tags: ['相机评测', '拍摄技巧', '旅行攻略', '户外装备'],
      related: ['Vlog教程', '后期剪辑', '户外探险'],
    },
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      case 'stable':
        return '➡️';
      default:
        return '❓';
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1D1D1F]">话题推荐</h1>
        <p className="text-sm text-[#86868B] mt-1">热门话题推荐和相关内容</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics.map((topic) => (
          <Card key={topic.id} className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#1D1D1F] mb-2">
                  {topic.name}
                </h3>
                <p className="text-sm text-[#86868B] line-clamp-2">
                  {topic.description}
                </p>
              </div>
              <div className="flex flex-col items-end ml-4">
                <div className="flex items-center gap-1">
                  <span className="text-2xl">{getTrendIcon(topic.trend)}</span>
                  <span className="text-green-600 font-bold text-lg">{topic.growth}</span>
                </div>
                <span className="text-sm text-[#86868B] mt-1">{topic.热度} 热度</span>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-[#1D1D1F] mb-2">热门标签：</h4>
              <div className="flex flex-wrap gap-2">
                {topic.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-[#1D1D1F] mb-2">相关话题：</h4>
              <div className="flex flex-wrap gap-2">
                {topic.related.map((item, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>

            <Button className="w-full bg-[#007AFF] hover:bg-[#0066CC]">
                  创建相关内容
                </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
