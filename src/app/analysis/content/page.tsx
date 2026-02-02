'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ContentOptimizationPage() {
  const router = useRouter();

  useEffect(() => {
    // 重定向到主页面
    router.replace('/analysis');
  }, [router]);

  return (
    <div className="p-8 flex items-center justify-center">
      <div className="text-[#86868B]">正在跳转到深度分析页面...</div>
    </div>
  );
}
