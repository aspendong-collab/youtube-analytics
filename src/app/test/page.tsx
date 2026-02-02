'use client';

import { useEffect, useState } from 'react';

export default function TestPage() {
  const [apiStatus, setApiStatus] = useState<{
    stats: 'loading' | 'success' | 'error';
    videos: 'loading' | 'success' | 'error';
  }>({
    stats: 'loading',
    videos: 'loading',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function testAPIs() {
      try {
        // 测试 stats API
        const statsRes = await fetch('/api/stats/multi');
        if (statsRes.ok) {
          setApiStatus(prev => ({ ...prev, stats: 'success' }));
        } else {
          throw new Error(`Stats API failed: ${statsRes.status}`);
        }
      } catch (e) {
        setApiStatus(prev => ({ ...prev, stats: 'error' }));
        setErrors(prev => ({ ...prev, stats: e instanceof Error ? e.message : 'Unknown error' }));
      }

      try {
        // 测试 videos API
        const videosRes = await fetch('/api/videos?limit=1');
        if (videosRes.ok) {
          setApiStatus(prev => ({ ...prev, videos: 'success' }));
        } else {
          throw new Error(`Videos API failed: ${videosRes.status}`);
        }
      } catch (e) {
        setApiStatus(prev => ({ ...prev, videos: 'error' }));
        setErrors(prev => ({ ...prev, videos: e instanceof Error ? e.message : 'Unknown error' }));
      }
    }

    testAPIs();
  }, []);

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-semibold text-[#1D1D1F] mb-4">
        系统诊断
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          title="Stats API"
          status={apiStatus.stats}
          error={errors.stats}
        />
        <Card
          title="Videos API"
          status={apiStatus.videos}
          error={errors.videos}
        />
      </div>

      <div className="p-4 bg-[#F5F5F7] rounded-lg">
        <h3 className="font-semibold text-[#1D1D1F] mb-2">环境信息</h3>
        <ul className="space-y-1 text-sm text-[#86868B]">
          <li>运行环境: {typeof window !== 'undefined' ? 'Browser' : 'Server'}</li>
          <li>用户代理: {typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'N/A'}</li>
        </ul>
      </div>
    </div>
  );
}

function Card({ title, status, error }: { title: string; status: 'loading' | 'success' | 'error'; error?: string }) {
  const statusConfig = {
    loading: { color: 'bg-gray-100 text-gray-800', icon: '⏳', text: '测试中...' },
    success: { color: 'bg-green-100 text-green-800', icon: '✅', text: '正常' },
    error: { color: 'bg-red-100 text-red-800', icon: '❌', text: '失败' },
  };

  const config = statusConfig[status];

  return (
    <div className="p-6 bg-white rounded-lg border border-[rgba(0,0,0,0.08)]">
      <h2 className="text-lg font-semibold text-[#1D1D1F] mb-2">{title}</h2>
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <span>{config.icon}</span>
        <span>{config.text}</span>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
