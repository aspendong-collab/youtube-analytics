'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function VideosPage() {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#1D1D1F] mb-2">
            视频监控
          </h1>
          <p className="text-sm text-[#86868B]">
            管理所有监控的视频，查看实时数据
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-[#007AFF] hover:bg-[#0056CC] text-white rounded-xl px-6"
        >
          + 添加视频
        </Button>
      </div>

      {/* 筛选栏 */}
      <Card className="p-4 bg-[#F5F5F7] border-none">
        <div className="flex gap-4">
          <select className="px-4 py-2 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg text-sm">
            <option>全部负责人</option>
            <option>张三</option>
            <option>李四</option>
          </select>
          <select className="px-4 py-2 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg text-sm">
            <option>全部状态</option>
            <option>优秀</option>
            <option>正常</option>
            <option>异常</option>
          </select>
          <input
            type="text"
            placeholder="搜索视频..."
            className="flex-1 px-4 py-2 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg text-sm"
          />
        </div>
      </Card>

      {/* 视频列表 */}
      <div className="space-y-4">
        <VideoCard
          thumbnail="https://via.placeholder.com/160x90"
          title="如何提升YouTube视频观看量？"
          owner="张三"
          views="10.5W"
          likes="8.2K"
          comments="456"
          engagement="8.2%"
          publishedAt="3天前"
          status="excellent"
        />
        <VideoCard
          thumbnail="https://via.placeholder.com/160x90"
          title="2025年电商趋势分析"
          owner="李四"
          views="8.2W"
          likes="5.1K"
          comments="321"
          engagement="6.5%"
          publishedAt="5天前"
          status="normal"
        />
        <VideoCard
          thumbnail="https://via.placeholder.com/160x90"
          title="AI工具使用教程"
          owner="张三"
          views="5.1W"
          likes="2.8K"
          comments="156"
          engagement="5.8%"
          publishedAt="7天前"
          status="warning"
        />
      </div>

      {/* 添加视频模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-[#1D1D1F] mb-4">
              添加视频
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#86868B] mb-2">
                  视频链接
                </label>
                <input
                  type="text"
                  placeholder="粘贴 YouTube 视频链接"
                  className="w-full px-4 py-2 border border-[rgba(0,0,0,0.1)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#86868B] mb-2">
                  负责人
                </label>
                <select className="w-full px-4 py-2 border border-[rgba(0,0,0,0.1)] rounded-lg">
                  <option>选择负责人</option>
                  <option>张三</option>
                  <option>李四</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowAddModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  取消
                </Button>
                <Button className="flex-1 bg-[#007AFF] hover:bg-[#0056CC] text-white">
                  添加
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 视频卡片组件
function VideoCard({
  thumbnail,
  title,
  owner,
  views,
  likes,
  comments,
  engagement,
  publishedAt,
  status,
}: {
  thumbnail: string;
  title: string;
  owner: string;
  views: string;
  likes: string;
  comments: string;
  engagement: string;
  publishedAt: string;
  status: 'excellent' | 'normal' | 'warning';
}) {
  const statusConfig = {
    excellent: { label: '优秀', color: 'bg-[#34C759]' },
    normal: { label: '正常', color: 'bg-[#007AFF]' },
    warning: { label: '异常', color: 'bg-[#FF9500]' },
  };

  const config = statusConfig[status];

  return (
    <Card className="p-5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-200">
      <div className="flex gap-4">
        {/* 缩略图 */}
        <a
          href="#"
          target="_blank"
          className="relative w-40 h-24 rounded-lg overflow-hidden flex-shrink-0"
        >
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-white text-sm">▶</span>
          </div>
        </a>

        {/* 视频信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[#1D1D1F] mb-1 truncate">
                {title}
              </h3>
              <p className="text-sm text-[#86868B] mb-2">
                {owner} • {publishedAt}
              </p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs text-white ${config.color}`}>
              {config.label}
            </span>
          </div>

          {/* 数据指标 */}
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-[#86868B]">👀</span>{' '}
              <span className="font-medium text-[#1D1D1F]">{views}</span>
            </div>
            <div>
              <span className="text-[#86868B]">👍</span>{' '}
              <span className="font-medium text-[#1D1D1F]">{likes}</span>
            </div>
            <div>
              <span className="text-[#86868B]">💬</span>{' '}
              <span className="font-medium text-[#1D1D1F]">{comments}</span>
            </div>
            <div>
              <span className="text-[#86868B]">📊</span>{' '}
              <span className="font-medium text-[#1D1D1F]">{engagement}</span>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 mt-3">
            <Button variant="outline" size="sm" className="text-xs">
              查看详情
            </Button>
            <Button variant="ghost" size="sm" className="text-xs">
              编辑
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
