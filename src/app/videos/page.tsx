'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OldVideosRedirect() {
  const router = useRouter();

  useEffect(() => {
    // 重定向到新的视频监控页面
    router.replace('/monitoring');
  }, [router]);

  return (
    <div className="p-8 flex items-center justify-center">
      <div className="text-[#86868B]">正在跳转到视频监控页面...</div>
    </div>
  );
}
