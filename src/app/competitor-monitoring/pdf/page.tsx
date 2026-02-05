'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Target, Play, Eye, Heart, MessageCircle, TrendingUp, Clock, User, RefreshCw, Video, ChevronDown, Plus, X, Check, Trash2 } from 'lucide-react';

interface CompetitorVideo {
  id: string;
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  competitorName: string;
  competitorId: string;
  mentionType: string;
  relevanceScore: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  viewsAtDetection: number;
  viewsGrowth: number;
  growthRate: number;
  firstDetectedAt: string;
  lastDetectedAt: string;
  engagementRate: number;
  daysSincePublished: number;
}

interface CompetitorInfo {
  id: string;
  name: string;
  slug: string;
  keywords: string[];
}

interface MonitoringData {
  videos: CompetitorVideo[];
  total: number;
  timestamp: string;
}

export default function CompetitorMonitoringPDFPage() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<{ name: string; slug: string; keywords: string[] } | null>(null);
  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d'>('7d');
  const [sortBy, setSortBy] = useState<'views' | 'growth' | 'engagement' | 'relevance'>('views');
  
  // 下拉框状态
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [newCompetitorName, setNewCompetitorName] = useState('');
  const [isAddingCompetitor, setIsAddingCompetitor] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 竞品列表
  const [competitors, setCompetitors] = useState<CompetitorInfo[]>([
    { id: '1', name: 'PDFelement', slug: 'pdfelement', keywords: ['PDFelement', 'Wondershare PDFelement'] },
    { id: '2', name: 'Foxit PDF', slug: 'foxit-pdf', keywords: ['Foxit PDF', 'Foxit Editor', 'Foxit Phantom'] },
    { id: '3', name: 'PDFgear', slug: 'pdfgear', keywords: ['PDFgear', 'PDFgear Desktop'] },
    { id: '4', name: 'UPDF', slug: 'updf', keywords: ['UPDF', 'Superace UPDF'] },
  ]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 获取监控数据
  const fetchMonitoringData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCompetitor) params.append('competitorSlug', selectedCompetitor.slug);
      params.append('timeRange', timeRange);
      params.append('sortBy', sortBy);
      params.append('limit', '50');

      const response = await fetch(`/api/competitor-monitoring/pdf?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`获取监控数据失败: ${response.status}`);
      }

      const result: MonitoringData = await response.json();
      setData(result);
      toast.success(`获取到 ${result.total} 个相关视频`);
    } catch (error) {
      console.error('[竞品监控] 获取数据失败:', error);
      toast.error(error instanceof Error ? error.message : '获取监控数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 添加竞品
  const handleAddCompetitor = () => {
    if (!newCompetitorName.trim()) {
      toast.error('请输入竞品名称');
      return;
    }

    // 创建新竞品
    const slug = newCompetitorName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const newCompetitor: CompetitorInfo = {
      id: Date.now().toString(),
      name: newCompetitorName,
      slug: slug,
      keywords: [newCompetitorName],
    };

    setCompetitors([...competitors, newCompetitor]);
    setSelectedCompetitor(newCompetitor);
    setNewCompetitorName('');
    setIsAddingCompetitor(false);
    setIsDropdownOpen(false);
    
    toast.success(`已添加竞品 "${newCompetitorName}"，点击"开始监控"查看相关视频`);
  };

  // 选择竞品
  const handleSelectCompetitor = (competitor: CompetitorInfo | null) => {
    setSelectedCompetitor(competitor);
    setIsDropdownOpen(false);
  };

  // 删除竞品
  const handleDeleteCompetitor = (e: React.MouseEvent, competitorId: string) => {
    e.stopPropagation(); // 防止触发选择竞品
    
    // 至少保留一个竞品
    if (competitors.length <= 1) {
      toast.error('至少需要保留一个竞品');
      return;
    }

    const competitorToDelete = competitors.find(c => c.id === competitorId);
    if (!competitorToDelete) return;

    // 如果删除的是当前选中的竞品，清除选中状态
    if (selectedCompetitor?.slug === competitorToDelete.slug) {
      setSelectedCompetitor(null);
    }

    // 删除竞品
    setCompetitors(competitors.filter(c => c.id !== competitorId));
    toast.success(`已删除竞品 "${competitorToDelete.name}"`);
  };

  // 格式化数字
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days} 天前`;
    return date.toLocaleDateString('zh-CN');
  };

  // 获取提及类型标签样式
  const getMentionTypeBadge = (mentionType: string) => {
    switch (mentionType) {
      case 'title':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">标题</Badge>;
      case 'description':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">描述</Badge>;
      case 'tag':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">标签</Badge>;
      case 'all':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">全部</Badge>;
      default:
        return <Badge variant="secondary">未知</Badge>;
    }
  };

  // 获取竞品颜色
  const getCompetitorColor = (competitorName: string) => {
    switch (competitorName) {
      case 'PDFelement':
        return 'bg-blue-500';
      case 'Foxit PDF':
        return 'bg-red-500';
      case 'PDFgear':
        return 'bg-green-500';
      case 'UPDF':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-semibold text-[#1D1D1F] mb-2 flex items-center gap-2">
          <Target className="w-8 h-8" />
          PDF软件竞品监控
        </h1>
        <p className="text-sm text-[#86868B]">
          监控PDF软件在YouTube上的热门内容和表现
        </p>
      </div>

      {/* 控制面板 */}
      <Card className="p-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* 竞品选择 - 下拉框 */}
          <div className="flex-1 min-w-[240px]" ref={dropdownRef}>
            <label className="block text-sm font-medium text-[#1D1D1F] mb-2">
              竞品筛选
            </label>
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full justify-between font-normal h-10"
              >
                <span className="truncate">
                  {selectedCompetitor ? selectedCompetitor.name : '全部竞品'}
                </span>
                <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
              </Button>

              {/* 下拉框 */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  {/* 全部选项 */}
                  <div
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => handleSelectCompetitor(null)}
                  >
                    <div className="flex items-center gap-2">
                      {!selectedCompetitor && <Check className="w-4 h-4 text-[#007AFF]" />}
                      <span>全部竞品</span>
                    </div>
                  </div>

                  {/* 竞品列表 */}
                  {competitors.map((competitor) => (
                    <div
                      key={competitor.id}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-t border-gray-100 group"
                      onClick={() => handleSelectCompetitor(competitor)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          {selectedCompetitor?.slug === competitor.slug && (
                            <Check className="w-4 h-4 text-[#007AFF]" />
                          )}
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getCompetitorColor(competitor.name)}`} />
                            <span>{competitor.name}</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteCompetitor(e, competitor.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded text-red-500"
                          title="删除竞品"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* 分隔线 */}
                  <div className="border-t border-gray-200 my-2"></div>

                  {/* 添加竞品 */}
                  {isAddingCompetitor ? (
                    <div className="px-3 py-2 border-t border-gray-100">
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="输入竞品名称"
                          value={newCompetitorName}
                          onChange={(e) => setNewCompetitorName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddCompetitor()}
                          className="flex-1 h-8 text-sm"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={handleAddCompetitor}
                          className="h-8 px-2"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setIsAddingCompetitor(false);
                            setNewCompetitorName('');
                          }}
                          className="h-8 px-2"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-t border-gray-100 text-[#007AFF]"
                      onClick={() => setIsAddingCompetitor(true)}
                    >
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span>添加竞品</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 时间范围选择 */}
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-[#1D1D1F] mb-2">
              时间范围
            </label>
            <div className="flex gap-2">
              {(['1d', '7d', '30d'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  onClick={() => setTimeRange(range)}
                  className="flex-1"
                >
                  {range === '1d' && '24小时'}
                  {range === '7d' && '7天'}
                  {range === '30d' && '30天'}
                </Button>
              ))}
            </div>
          </div>

          {/* 排序方式 */}
          <div className="min-w-[180px]">
            <label className="block text-sm font-medium text-[#1D1D1F] mb-2">
              排序方式
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            >
              <option value="views">按播放量</option>
              <option value="growth">按增长量</option>
              <option value="engagement">按互动率</option>
              <option value="relevance">按相关性</option>
            </select>
          </div>

          {/* 获取按钮 */}
          <div>
            <Button
              onClick={fetchMonitoringData}
              disabled={isLoading}
              size="lg"
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  加载中
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  开始监控
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* 视频列表 */}
      {data && data.videos.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-[#1D1D1F]">
              相关视频列表 ({data.total} 个)
            </h3>
            <div className="text-sm text-[#86868B]">
              最后更新: {new Date(data.timestamp).toLocaleString('zh-CN')}
            </div>
          </div>

          <div className="space-y-4">
            {data.videos.map((video, index) => (
              <div
                key={video.id}
                className="flex gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                {/* 缩略图 */}
                <div className="relative flex-shrink-0">
                  <a
                    href={`https://www.youtube.com/watch?v=${video.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-48 h-28 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-30 rounded-lg">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                  </a>
                  <div className="absolute top-2 left-2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-bold shadow">
                    {index + 1}
                  </div>
                </div>

                {/* 视频信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getCompetitorColor(video.competitorName)}`} />
                      <span className="text-sm font-medium text-[#1D1D1F]">
                        {video.competitorName}
                      </span>
                      {getMentionTypeBadge(video.mentionType)}
                    </div>
                  </div>

                  <a
                    href={`https://www.youtube.com/watch?v=${video.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-medium text-[#1D1D1F] hover:text-[#007AFF] transition-colors mb-1 line-clamp-2"
                  >
                    {video.title}
                  </a>

                  <div className="flex items-center gap-3 text-xs text-[#86868B] mb-2">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {video.channelTitle}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(video.publishedAt)}
                    </span>
                  </div>

                  {/* 统计数据 */}
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-[#1D1D1F]">
                      <Eye className="w-3 h-3" />
                      {formatNumber(video.viewCount)}
                    </span>
                    <span className="flex items-center gap-1 text-[#1D1D1F]">
                      <Heart className="w-3 h-3" />
                      {formatNumber(video.likeCount)}
                    </span>
                    <span className="flex items-center gap-1 text-[#1D1D1F]">
                      <MessageCircle className="w-3 h-3" />
                      {formatNumber(video.commentCount)}
                    </span>
                    <span className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="w-3 h-3" />
                      {video.engagementRate.toFixed(2)}% 互动率
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 空状态 */}
      {!data && !isLoading && (
        <Card className="p-8 text-center bg-gradient-to-r from-blue-50 to-purple-50">
          <Target className="w-16 h-16 mx-auto mb-4 text-[#007AFF]" />
          <h3 className="text-lg font-medium text-[#1D1D1F] mb-2">
            开始竞品监控
          </h3>
          <p className="text-sm text-[#86868B] mb-4">
            选择竞品、时间范围和排序方式，点击"开始监控"查看相关视频
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-[#86868B] mb-4">
            <span>当前竞品:</span>
            {competitors.map((c) => (
              <Badge key={c.id} variant="outline">
                {c.name}
              </Badge>
            ))}
          </div>
          <Button onClick={fetchMonitoringData} size="lg">
            <Target className="w-4 h-4 mr-2" />
            开始监控
          </Button>
        </Card>
      )}
    </div>
  );
}
