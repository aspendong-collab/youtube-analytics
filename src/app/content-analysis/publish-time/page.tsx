'use client';

import { Card } from '@/components/ui/card';
import { VideoSelector } from '@/components/video-selector';
import { useAnalysis } from '@/contexts/analysis-context';
import { Clock } from 'lucide-react';

export default function PublishTimePage() {
  const { selectedVideo } = useAnalysis();

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1D1D1F]">发布时机优化</h1>
        <p className="text-sm text-[#86868B] mt-1">分析最佳发布时间，提升视频曝光</p>
      </div>

      <VideoSelector
        selectedVideoId={selectedVideo?.id || null}
        onVideoSelect={() => {}}
      />

      {!selectedVideo ? (
        <Card className="p-12 bg-white border-[rgba(0,0,0,0.08)]">
          <div className="text-center text-[#86868B]">
            <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">请选择要分析的视频</p>
            <p className="text-sm">选择视频后将显示发布时间建议</p>
          </div>
        </Card>
      ) : (
        <Card className="p-6 bg-white border-[rgba(0,0,0,0.08)]">
          <p className="text-center text-[#86868B] py-8">
            发布时机优化功能开发中...
          </p>
        </Card>
      )}
    </div>
  );
}
