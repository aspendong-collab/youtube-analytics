'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function DataCollectionPage() {
  const [apiKeys, setApiKeys] = useState({
    youtubeApiKey: '',
    googleClientId: '',
  });

  const [collectionSettings, setCollectionSettings] = useState({
    autoCollect: true,
    collectInterval: 24,
    collectMetrics: true,
    collectComments: false,
    collectAnalytics: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // LocalStorage 键名
  const STORAGE_KEY = 'youtube_analytics_settings';

  // 从 LocalStorage 加载配置
  const loadFromLocalStorage = () => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch (error) {
      console.error('从 LocalStorage 加载配置失败:', error);
    }
    return null;
  };

  // 保存到 LocalStorage
  const saveToLocalStorage = (data: any) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('保存到 LocalStorage 失败:', error);
    }
  };

  // 页面加载时获取配置
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // 优先从 API（Cookie）加载
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.apiKeys) setApiKeys(data.apiKeys);
        if (data.collection) setCollectionSettings(data.collection);
      } else {
        // 如果 Cookie 失败，从 LocalStorage 加载
        const localData = loadFromLocalStorage();
        if (localData) {
          if (localData.apiKeys) setApiKeys(localData.apiKeys);
          if (localData.collection) setCollectionSettings(localData.collection);
        }
      }
    } catch (error) {
      console.error('加载配置失败:', error);
      // 如果加载失败，从 LocalStorage 加载
      const localData = loadFromLocalStorage();
      if (localData) {
        if (localData.apiKeys) setApiKeys(localData.apiKeys);
        if (localData.collection) setCollectionSettings(localData.collection);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const settingsData = {
        apiKeys,
        collection: collectionSettings,
      };

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsData),
      });

      if (!response.ok) {
        throw new Error('保存失败');
      }

      // 同时保存到 LocalStorage 作为备份
      saveToLocalStorage(settingsData);

      const data = await response.json();
      toast.success(data.message || '配置保存成功，有效期 1 年');
    } catch (error) {
      console.error('保存配置失败:', error);

      // 即使 API 失败，也保存到 LocalStorage
      const settingsData = {
        apiKeys,
        collection: collectionSettings,
      };
      saveToLocalStorage(settingsData);

      toast.error('保存到服务器失败，但已保存到本地，刷新后可恢复');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveApiKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSaveAll();
  };

  const handleSaveSchedule = async () => {
    await handleSaveAll();
  };

  const handleSaveMetrics = async () => {
    await handleSaveAll();
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-[#86868B]">加载配置中...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1D1D1F]">数据采集设置</h1>
        <p className="text-sm text-[#86868B] mt-1">配置数据采集相关设置</p>
      </div>

      {/* 配置说明卡片 */}
      <Card className="p-4 bg-blue-50 border-blue-200 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div className="flex-1">
            <h3 className="font-medium text-blue-900 mb-1">配置说明</h3>
            <p className="text-sm text-blue-800">
              在此配置的 YouTube API Key 会在服务端使用，用于获取视频信息。
              保存配置后立即生效，无需重启应用。
            </p>
            <div className="mt-2 p-3 bg-white rounded-md border border-blue-100">
              <p className="text-xs font-medium text-blue-900 mb-1">💾 存储说明</p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• 配置同时保存在 Cookie 和浏览器本地存储中</li>
                <li>• Cookie 有效期：1 年</li>
                <li>• 只要不清除浏览器缓存，配置将永久有效</li>
                <li>• 即使 Cookie 被清除，本地存储的配置仍可恢复</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="api" className="space-y-6">
        <TabsList>
          <TabsTrigger value="api">API 配置</TabsTrigger>
          <TabsTrigger value="schedule">采集计划</TabsTrigger>
          <TabsTrigger value="metrics">数据指标</TabsTrigger>
        </TabsList>

        <TabsContent value="api">
          <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
            <h3 className="text-lg font-medium text-[#1D1D1F] mb-6">API 密钥配置</h3>
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="youtubeApiKey">YouTube API Key</Label>
                <Input
                  id="youtubeApiKey"
                  type="password"
                  placeholder="输入 YouTube API 密钥"
                  value={apiKeys.youtubeApiKey}
                  onChange={(e) => setApiKeys({ ...apiKeys, youtubeApiKey: e.target.value })}
                />
                <p className="text-xs text-[#86868B]">
                  用于访问 YouTube Data API，请前往 Google Cloud Console 获取
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="googleClientId">Google Client ID</Label>
                <Input
                  id="googleClientId"
                  type="password"
                  placeholder="输入 Google Client ID"
                  value={apiKeys.googleClientId}
                  onChange={(e) => setApiKeys({ ...apiKeys, googleClientId: e.target.value })}
                />
                <p className="text-xs text-[#86868B]">
                  用于 OAuth 认证，可选配置
                </p>
              </div>

              <Button
                type="button"
                className="bg-[#007AFF] hover:bg-[#0066CC]"
                onClick={handleSaveAll}
                disabled={isSaving}
              >
                {isSaving ? '保存中...' : '保存配置'}
              </Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
            <h3 className="text-lg font-medium text-[#1D1D1F] mb-6">自动采集计划</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>启用自动采集</Label>
                  <p className="text-sm text-[#86868B] mt-1">
                    定时自动采集视频数据
                  </p>
                </div>
                <Switch
                  checked={collectionSettings.autoCollect}
                  onCheckedChange={(checked) =>
                    setCollectionSettings({ ...collectionSettings, autoCollect: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>采集间隔（小时）</Label>
                <Input
                  type="number"
                  min="1"
                  max="168"
                  value={collectionSettings.collectInterval}
                  onChange={(e) =>
                    setCollectionSettings({
                      ...collectionSettings,
                      collectInterval: parseInt(e.target.value),
                    })
                  }
                />
                <p className="text-xs text-[#86868B]">
                  每隔多少小时自动采集一次数据
                </p>
              </div>

              <Button
                type="button"
                className="bg-[#007AFF] hover:bg-[#0066CC]"
                onClick={handleSaveAll}
                disabled={isSaving}
              >
                {isSaving ? '保存中...' : '保存配置'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
            <h3 className="text-lg font-medium text-[#1D1D1F] mb-6">数据指标选择</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>采集视频指标</Label>
                  <p className="text-sm text-[#86868B] mt-1">
                    播放量、点赞、评论等基础指标
                  </p>
                </div>
                <Switch
                  checked={collectionSettings.collectMetrics}
                  onCheckedChange={(checked) =>
                    setCollectionSettings({ ...collectionSettings, collectMetrics: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>采集评论内容</Label>
                  <p className="text-sm text-[#86868B] mt-1">
                    收集视频评论数据（需要更多 API 配额）
                  </p>
                </div>
                <Switch
                  checked={collectionSettings.collectComments}
                  onCheckedChange={(checked) =>
                    setCollectionSettings({ ...collectionSettings, collectComments: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>采集分析数据</Label>
                  <p className="text-sm text-[#86868B] mt-1">
                    流量来源、观众留存等分析数据
                  </p>
                </div>
                <Switch
                  checked={collectionSettings.collectAnalytics}
                  onCheckedChange={(checked) =>
                    setCollectionSettings({ ...collectionSettings, collectAnalytics: checked })
                  }
                />
              </div>

              <Button
                type="button"
                className="bg-[#007AFF] hover:bg-[#0066CC]"
                onClick={handleSaveAll}
                disabled={isSaving}
              >
                {isSaving ? '保存中...' : '保存配置'}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
