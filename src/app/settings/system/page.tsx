'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export default function SystemSettingsPage() {
  const [userSettings, setUserSettings] = useState({
    username: 'admin',
    email: 'admin@example.com',
    language: 'zh-CN',
    timezone: 'Asia/Shanghai',
  });

  const [systemSettings, setSystemSettings] = useState({
    enableNotifications: true,
    enableEmailAlerts: true,
    darkMode: false,
    highContrast: false,
  });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1D1D1F]">系统设置</h1>
        <p className="text-sm text-[#86868B] mt-1">配置系统和用户偏好设置</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
          <h3 className="text-lg font-medium text-[#1D1D1F] mb-6">账户设置</h3>
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                value={userSettings.username}
                onChange={(e) => setUserSettings({ ...userSettings, username: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">邮箱地址</Label>
              <Input
                id="email"
                type="email"
                value={userSettings.email}
                onChange={(e) => setUserSettings({ ...userSettings, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>语言</Label>
              <Select value={userSettings.language}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh-CN">简体中文</SelectItem>
                  <SelectItem value="en-US">English</SelectItem>
                  <SelectItem value="ja-JP">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>时区</Label>
              <Select value={userSettings.timezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Shanghai">亚洲/上海 (GMT+8)</SelectItem>
                  <SelectItem value="America/New_York">美国/纽约 (GMT-5)</SelectItem>
                  <SelectItem value="Europe/London">欧洲/伦敦 (GMT+0)</SelectItem>
                  <SelectItem value="Asia/Tokyo">亚洲/东京 (GMT+9)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="button" className="w-full bg-[#007AFF] hover:bg-[#0066CC]">
              保存账户设置
            </Button>
          </form>
        </Card>

        <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
          <h3 className="text-lg font-medium text-[#1D1D1F] mb-6">偏好设置</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>启用通知</Label>
                <p className="text-sm text-[#86868B] mt-1">
                  接收系统通知和提醒
                </p>
              </div>
              <Switch
                checked={systemSettings.enableNotifications}
                onCheckedChange={(checked) =>
                  setSystemSettings({ ...systemSettings, enableNotifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>邮件提醒</Label>
                <p className="text-sm text-[#86868B] mt-1">
                  接收重要事件的邮件提醒
                </p>
              </div>
              <Switch
                checked={systemSettings.enableEmailAlerts}
                onCheckedChange={(checked) =>
                  setSystemSettings({ ...systemSettings, enableEmailAlerts: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>深色模式</Label>
                <p className="text-sm text-[#86868B] mt-1">
                  使用深色主题界面
                </p>
              </div>
              <Switch
                checked={systemSettings.darkMode}
                onCheckedChange={(checked) =>
                  setSystemSettings({ ...systemSettings, darkMode: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>高对比度</Label>
                <p className="text-sm text-[#86868B] mt-1">
                  使用高对比度显示
                </p>
              </div>
              <Switch
                checked={systemSettings.highContrast}
                onCheckedChange={(checked) =>
                  setSystemSettings({ ...systemSettings, highContrast: checked })
                }
              />
            </div>

            <Button type="button" className="w-full bg-[#007AFF] hover:bg-[#0066CC]">
              保存偏好设置
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
        <h3 className="text-lg font-medium text-[#1D1D1F] mb-6">数据管理</h3>
        <div className="flex gap-4">
          <Button variant="outline" className="border-[rgba(0,0,0,0.1)]">
            导出数据
          </Button>
          <Button variant="outline" className="border-[rgba(0,0,0,0.1)] text-red-600 hover:text-red-700">
            清除缓存
          </Button>
          <Button variant="outline" className="border-[rgba(0,0,0,0.1)] text-red-600 hover:text-red-700">
            重置系统
          </Button>
        </div>
      </Card>
    </div>
  );
}
