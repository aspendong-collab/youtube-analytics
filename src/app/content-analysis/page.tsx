'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ContentAnalysisRedirect() {
  const router = useRouter();

  useEffect(() => {
    // 重定向到内容表现分析页面
    router.replace('/content-analysis/performance');
  }, [router]);

  return (
    <div className="p-8 flex items-center justify-center">
      <div className="text-[#86868B]">正在跳转到内容分析页面...</div>
    </div>
  );
}
