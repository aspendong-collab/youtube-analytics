'use client';

import { useState } from 'react';
import { Search, Globe, Mail, Users, Star, TrendingUp, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

// 语言选项
const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'it', label: 'Italiano', flag: '🇮🇹' },
  { value: 'ja', label: '日本語', flag: '🇯🇵' },
  { value: 'ko', label: '한국어', flag: '🇰🇷' },
  { value: 'zh-TW', label: '繁體中文', flag: '🇹🇼' },
];

// 拓展模式选项
const EXPANSION_MODE_OPTIONS = [
  {
    value: 'multi-dimensional',
    label: '多维度拓展',
    description: '基于场景、载体、状态、目标、方法等多维度进行关键词拓展'
  },
  {
    value: 'semantic',
    label: '语义相似度',
    description: '基于近义词、同义词、反义词等语义相关的关键词拓展'
  },
  {
    value: 'hybrid',
    label: '混合模式',
    description: '结合多维度和语义相似度，覆盖更广的关键词范围'
  }
];

interface AffiliateLink {
  type: 'ref' | 'utm' | 'short' | 'keyword' | 'disclosure';
  value: string;
  fullUrl?: string;
  position: 'description' | 'comment';
  videoId?: string;
}

interface AffiliateVideoInfo {
  videoId: string;
  title: string;
  thumbnail?: string;
  publishedAt?: string;
  viewCount?: number;
  likeCount?: number;
  affiliateScore: number;
  affiliateEvidence: any;
  contactInfo?: {
    email?: string;
    socialLinks?: string[];
  };
}

interface InfluencerInfo {
  channelId: string;
  channelTitle: string;
  thumbnail?: string;
  subscriberCount?: number;
  totalVideos?: number;
  totalViews?: number;
  videos: AffiliateVideoInfo[];
  affiliateScore: number;
  affiliateEvidence: AffiliateLink[];
  contactInfo?: {
    email?: string;
    socialLinks?: string[];
  };
  recommendationScore: number;
  tags?: string[];
  language: string;
  affiliateStatus?: 'potential' | 'verified' | 'rejected';
  cooperationStatus?: 'available' | 'contacted' | 'collaborating' | 'blacklist';
}

export default function AffiliateExpansionPage() {
  const [keyword, setKeyword] = useState('');
  const [language, setLanguage] = useState('en');
  const [expansionMode, setExpansionMode] = useState('multi-dimensional');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [influencers, setInfluencers] = useState<InfluencerInfo[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [totalFound, setTotalFound] = useState(0);
  const [error, setError] = useState('');
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerInfo | null>(null);
  const [notes, setNotes] = useState('');
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [usedKeywords, setUsedKeywords] = useState<string[]>([]);

  const handleSearch = async (loadMore: boolean = false) => {
    if (!keyword.trim()) {
      setError('请输入关键词');
      return;
    }

    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError('');
      setInfluencers([]);
      setSelectedInfluencer(null);
      setCurrentKeyword(keyword);
    }

    try {
      const currentInfluencers = loadMore ? influencers.length : 0;
      const response = await fetch('/api/influencers/affiliate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: currentKeyword || keyword,
          language,
          expansionMode,
          maxVideos: 200, // 增加到 200 个视频
          maxResults: 100, // 增加到 100 个博主
          minAffiliateScore: 0,
          includeComments: false, // 为了更快返回结果，暂时禁用评论分析
          offset: loadMore ? currentInfluencers : 0,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const newInfluencers = result.data;

        if (loadMore) {
          setInfluencers([...influencers, ...newInfluencers]);
        } else {
          setInfluencers(newInfluencers);
          // 设置使用的关键词
          setUsedKeywords(result.meta?.keywordsUsed || [keyword]);
        }

        // 判断是否还有更多结果
        setHasMore(newInfluencers.length >= 20);
        setTotalFound(result.meta?.totalFound || newInfluencers.length);

        if (!loadMore && newInfluencers.length === 0) {
          setError('未找到符合条件的博主。\n\n可能的原因：\n• 该关键词没有相关的 affiliate 博主\n• YouTube API 响应超时或配额限制\n• 请尝试其他更具体的关键词');
        }
      } else {
        if (result.code === 'TIMEOUT') {
          setError('搜索超时，YouTube API 响应时间过长，请稍后重试');
        } else if (result.code === 'QUOTA_EXCEEDED') {
          setError('YouTube API 配额已用完，请稍后重试');
        } else {
          setError(result.error || '搜索失败，请稍后重试');
        }
      }
    } catch (err) {
      console.error('搜索失败:', err);
      setError('网络错误，请检查网络连接后重试');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-blue-100 text-blue-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getLinkTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ref: 'Ref 参数',
      utm: 'UTM 参数',
      short: '短链接',
      keyword: '关键词',
      disclosure: '声明'
    };
    return labels[type] || type;
  };

  const getLinkTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      ref: 'bg-purple-100 text-purple-800',
      utm: 'bg-blue-100 text-blue-800',
      short: 'bg-orange-100 text-orange-800',
      keyword: 'bg-green-100 text-green-800',
      disclosure: 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8" />
            Affiliate 拓展
          </h1>
          <p className="text-muted-foreground mt-2">
            通过关键词查找适合 affiliate 合作的 YouTube 博主
          </p>
        </div>
      </div>

      {/* 搜索区域 */}
      <Card>
        <CardHeader>
          <CardTitle>搜索博主</CardTitle>
          <CardDescription>
            输入关键词和语言，系统将自动分析 YouTube 视频，识别包含 affiliate 标识的博主
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-1">
              <Label htmlFor="keyword">关键词</Label>
              <Input
                id="keyword"
                placeholder="例如：PDF editor, VPN, software review..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="language">语言</Label>
              <Select value={language} onValueChange={setLanguage} disabled={loading}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="mr-2">{option.flag}</span>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="expansionMode">拓展模式</Label>
              <Select value={expansionMode} onValueChange={setExpansionMode} disabled={loading}>
                <SelectTrigger id="expansionMode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPANSION_MODE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-gray-500">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSearch} disabled={loading} className="px-8">
              {loading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  搜索中...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  搜索
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 错误提示 */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 text-red-800">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="whitespace-pre-line text-sm">
                {error}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 搜索结果 */}
      {influencers.length > 0 && (
        <div className="space-y-4">
          {/* 使用的关键词 */}
          {usedKeywords.length > 1 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    语义拓展：基于 "{currentKeyword}" 生成了 {usedKeywords.length - 1} 个相关关键词
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {usedKeywords.map((kw, index) => (
                    <Badge
                      key={kw}
                      variant={index === 0 ? "default" : "secondary"}
                      className={index === 0 ? "bg-blue-600 text-white" : "bg-white text-blue-800 border-blue-300"}
                    >
                      {index === 0 ? '原始词' : `相关词 ${index}`}
                      <span className="ml-1 font-medium">{kw}</span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              找到 <span className="text-blue-600">{influencers.length}</span> 个符合条件的博主
              {totalFound > influencers.length && (
                <span className="text-gray-500 text-sm ml-2">
                  （共找到 {totalFound} 个，继续加载以查看更多）
                </span>
              )}
            </h2>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-sm">
                按 Affiliate Score 排序
              </Badge>
            </div>
          </div>

          <div className="grid gap-4">
            {influencers.map((influencer, index) => (
              <Card key={influencer.channelId} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* 频道头像 */}
                      <img
                        src={influencer.thumbnail || '/placeholder-avatar.png'}
                        alt={influencer.channelTitle}
                        className="w-16 h-16 rounded-full object-cover"
                      />

                      {/* 频道信息 */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{influencer.channelTitle}</CardTitle>
                          <Badge className={getScoreBadge(influencer.affiliateScore)}>
                            Affiliate Score: {influencer.affiliateScore}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          {influencer.subscriberCount && (
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {formatNumber(influencer.subscriberCount)} 订阅
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {influencer.videos.length} 视频
                          </div>
                          {influencer.totalViews && influencer.totalViews > 0 && (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              {formatNumber(influencer.totalViews)} 总观看
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Globe className="w-4 h-4" />
                            {LANGUAGE_OPTIONS.find(l => l.value === influencer.language)?.label}
                          </div>
                        </div>

                        {/* 标签 */}
                        {influencer.tags && influencer.tags.length > 0 && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {influencer.tags.slice(0, 5).map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <Button
                      variant="outline"
                      onClick={() => setSelectedInfluencer(influencer)}
                    >
                      查看详情
                    </Button>
                  </div>

                  {/* Affiliate Score 进度条 */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Affiliate Score</span>
                      <span className={`font-semibold ${getScoreColor(influencer.affiliateScore)}`}>
                        {influencer.affiliateScore}/100
                      </span>
                    </div>
                    <Progress value={influencer.affiliateScore} className="h-2" />
                  </div>

                  {/* 快速统计 */}
                  <div className="grid grid-cols-5 gap-4 mt-4 text-center">
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {influencer.affiliateEvidence.filter(e => e.type === 'ref').length}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Ref 链接</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {influencer.affiliateEvidence.filter(e => e.type === 'utm').length}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">UTM 链接</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {influencer.affiliateEvidence.filter(e => e.type === 'short').length}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">短链接</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {influencer.affiliateEvidence.filter(e => e.type === 'keyword').length}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">关键词</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {influencer.affiliateEvidence.filter(e => e.type === 'disclosure').length}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">声明</div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* 加载更多按钮 */}
          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button
                onClick={() => handleSearch(true)}
                disabled={loadingMore}
                variant="outline"
                className="px-8"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    加载中...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    加载更多博主
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 详情弹窗 */}
      {selectedInfluencer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedInfluencer.thumbnail || '/placeholder-avatar.png'}
                    alt={selectedInfluencer.channelTitle}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <div>
                    <CardTitle className="text-2xl">{selectedInfluencer.channelTitle}</CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {formatNumber(selectedInfluencer.subscriberCount || 0)} 订阅
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {selectedInfluencer.videos.length} 视频
                      </div>
                      <Badge className={getScoreBadge(selectedInfluencer.affiliateScore)}>
                        Affiliate Score: {selectedInfluencer.affiliateScore}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" onClick={() => setSelectedInfluencer(null)}>
                  ✕
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="evidence">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="evidence">Affiliate 标识</TabsTrigger>
                  <TabsTrigger value="videos">视频列表</TabsTrigger>
                  <TabsTrigger value="contact">联系信息</TabsTrigger>
                  <TabsTrigger value="notes">备注</TabsTrigger>
                </TabsList>

                <TabsContent value="evidence" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold">检测到的 Affiliate 标识</h3>
                    {selectedInfluencer.affiliateEvidence.length === 0 ? (
                      <p className="text-muted-foreground">未检测到 affiliate 标识</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedInfluencer.affiliateEvidence.map((evidence, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Badge className={getLinkTypeColor(evidence.type)}>
                              {getLinkTypeLabel(evidence.type)}
                            </Badge>
                            <div className="flex-1">
                              <div className="font-medium">{evidence.value}</div>
                              {evidence.fullUrl && (
                                <div className="text-sm text-muted-foreground">{evidence.fullUrl}</div>
                              )}
                            </div>
                            <Badge variant="outline">{evidence.position}</Badge>
                            {evidence.videoId && (
                              <a
                                href={`https://youtube.com/watch?v=${evidence.videoId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="videos" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold">相关视频 ({selectedInfluencer.videos.length})</h3>
                    <div className="grid gap-3">
                      {selectedInfluencer.videos.map((video, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                          <img
                            src={video.thumbnail || '/placeholder-thumbnail.png'}
                            alt={video.title}
                            className="w-32 h-18 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{video.title}</h4>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <div>观看: {formatNumber(video.viewCount || 0)}</div>
                              <div>点赞: {formatNumber(video.likeCount || 0)}</div>
                              <Badge className={getScoreBadge(video.affiliateScore)}>
                                Score: {video.affiliateScore}
                              </Badge>
                            </div>
                          </div>
                          <a
                            href={`https://youtube.com/watch?v=${video.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold">联系信息</h3>
                    <div className="grid gap-4">
                      {selectedInfluencer.contactInfo?.email && (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                          <Mail className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="text-sm text-muted-foreground">邮箱</div>
                            <div className="font-medium">{selectedInfluencer.contactInfo.email}</div>
                          </div>
                        </div>
                      )}
                      {selectedInfluencer.contactInfo?.socialLinks &&
                        selectedInfluencer.contactInfo.socialLinks.length > 0 && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-2">社交媒体</div>
                          <div className="space-y-2">
                            {selectedInfluencer.contactInfo.socialLinks.map((link, index) => (
                              <a
                                key={index}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100"
                              >
                                <ExternalLink className="w-4 h-4" />
                                <span className="text-sm">{link}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold">备注</h3>
                    <div>
                      <Label htmlFor="notes">添加备注</Label>
                      <Textarea
                        id="notes"
                        placeholder="记录关于这个博主的信息..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={5}
                      />
                      <div className="flex justify-end mt-2">
                        <Button onClick={() => console.log('保存备注:', notes)}>
                          保存备注
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
