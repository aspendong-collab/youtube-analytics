'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-semibold text-[#1D1D1F] mb-2">
          设置管理
        </h1>
        <p className="text-sm text-[#86868B]">
          配置系统参数和 API 设置
        </p>
      </div>

      {/* YouTube API 配置 */}
      <Card className="p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">
          YouTube API 配置
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#86868B] mb-2">
              API Key
            </label>
            <Input
              type="password"
              placeholder="输入 YouTube Data API v3 的密钥"
              className="w-full"
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-[#F5F5F7] rounded-lg">
            <div>
              <div className="text-sm font-medium text-[#1D1D1F]">配额使用情况</div>
              <div className="text-xs text-[#86868B] mt-1">
                今日已使用：0 / 10,000 units
              </div>
            </div>
            <div className="w-32 h-2 bg-[#E5E5EA] rounded-full overflow-hidden">
              <div className="w-0 h-full bg-[#34C759]"></div>
            </div>
          </div>
          <Button className="bg-[#007AFF] hover:bg-[#0056CC] text-white">
            连接测试
          </Button>
        </div>
      </Card>

      {/* 数据采集设置 */}
      <Card className="p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">
          数据采集设置
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#86868B] mb-2">
              采集频率
            </label>
            <select className="w-full px-4 py-2 border border-[rgba(0,0,0,0.1)] rounded-lg">
              <option>每天</option>
              <option>每 3 天</option>
              <option>每周</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#86868B] mb-2">
              采集时间
            </label>
            <select className="w-full px-4 py-2 border border-[rgba(0,0,0,0.1)] rounded-lg">
              <option>凌晨 2:00</option>
              <option>上午 8:00</option>
              <option>下午 2:00</option>
              <option>晚上 8:00</option>
            </select>
          </div>
          <Button className="bg-[#007AFF] hover:bg-[#0056CC] text-white">
            保存设置
          </Button>
        </div>
      </Card>

      {/* 数据导出 */}
      <Card className="p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">
          数据导出
        </h2>
        <div className="flex gap-3">
          <Button variant="outline">
            导出 CSV
          </Button>
          <Button variant="outline">
            导出 Excel
          </Button>
        </div>
      </Card>
    </div>
  );
}
