/**
 * 测试工具页面 - 快速测试 API 功能
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TestToolsPage() {
  const [keyword, setKeyword] = useState('wireless earbuds');
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 测试 Key 池状态
  const testKeyPoolStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/youtube/key-pool/status');
      const result = await response.json();
      setTestResult({
        type: 'Key Pool Status',
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      setTestResult({
        type: 'Error',
        error: error.message
      });
    }
    setLoading(false);
  };

  // 测试 Key 池
  const testKeyPool = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/youtube/key-pool/test');
      const result = await response.json();
      setTestResult({
        type: 'Key Pool Test',
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      setTestResult({
        type: 'Error',
        error: error.message
      });
    }
    setLoading(false);
  };

  // 测试 Affiliate 拓展
  const testAffiliate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/influencers/affiliate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword,
          language: 'en',
          maxVideos: 5,
          maxResults: 3,
          minAffiliateScore: 0,
          includeComments: false
        })
      });
      const result = await response.json();
      setTestResult({
        type: 'Affiliate Expansion',
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      setTestResult({
        type: 'Error',
        error: error.message
      });
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">API 测试工具</h1>

      <Tabs defaultValue="keypool" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="keypool">Key 池测试</TabsTrigger>
          <TabsTrigger value="affiliate">Affiliate 测试</TabsTrigger>
        </TabsList>

        <TabsContent value="keypool" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>YouTube API Key 池测试</CardTitle>
              <CardDescription>测试 Key 池管理和多 Key 轮询功能</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={testKeyPoolStatus} disabled={loading}>
                  {loading ? '测试中...' : '查看 Key 池状态'}
                </Button>
                <Button onClick={testKeyPool} disabled={loading} variant="outline">
                  {loading ? '测试中...' : '运行完整测试'}
                </Button>
              </div>

              {testResult && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">测试结果:</h3>
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="affiliate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Affiliate 拓展测试</CardTitle>
              <CardDescription>测试查找适合 affiliate 合作的博主</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="keyword">测试关键词</Label>
                <Input
                  id="keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="输入产品关键词"
                  className="mt-1"
                />
              </div>

              <Button onClick={testAffiliate} disabled={loading}>
                {loading ? '测试中...' : '测试 Affiliate 拓展'}
              </Button>

              {testResult && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">测试结果:</h3>
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
