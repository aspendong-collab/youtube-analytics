"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Influencer {
  id: string;
  channelId: string;
  channelTitle: string;
  thumbnail: string | null;
  subscriberCount: number;
  totalVideos: number;
  totalViews: number;
  email: string | null;
  phone: string | null;
  wechat: string | null;
  description: string | null;
  tags: string[] | null;
  category: string | null;
  niche: string | null;
  level: string;
  priceRange: string | null;
  averagePrice: number | null;
  qualityScore: number | null;
  cooperationScore: number | null;
  engagementRate: number | null;
  status: string;
  isFavorite: boolean;
  cooperationCount: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function InfluencersPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [favoriteFilter, setFavoriteFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);

  const [formData, setFormData] = useState({
    channelId: "",
    channelTitle: "",
    email: "",
    phone: "",
    wechat: "",
    description: "",
    tags: "",
    category: "",
    niche: "",
    level: "C",
    priceRange: "",
    averagePrice: "",
    qualityScore: "",
    cooperationScore: "",
    status: "available",
  });

  // 加载达人列表
  useEffect(() => {
    loadInfluencers();
  }, [statusFilter, levelFilter, categoryFilter, favoriteFilter, search]);

  const loadInfluencers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", "1");
      params.append("pageSize", "100");
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (levelFilter !== "all") params.append("level", levelFilter);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (favoriteFilter === "true") params.append("favorite", "true");
      if (search) params.append("search", search);

      const response = await fetch(`/api/v1/influencers?${params.toString()}`);

      if (!response.ok) {
        throw new Error("获取达人列表失败");
      }

      const result: ApiResponse<PaginatedResponse<Influencer>> = await response.json();

      if (result.success && result.data) {
        setInfluencers(result.data.items);
      } else {
        throw new Error(result.error || "获取达人列表失败");
      }
    } catch (error) {
      console.error("加载达人列表失败:", error);
      toast.error(error instanceof Error ? error.message : "加载达人列表失败");
    } finally {
      setLoading(false);
    }
  };

  const handleAddInfluencer = async () => {
    if (!formData.channelId || !formData.channelTitle) {
      toast.error("频道ID和频道标题不能为空");
      return;
    }

    try {
      const response = await fetch("/api/v1/influencers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: formData.channelId,
          channelTitle: formData.channelTitle,
          thumbnail: null,
          subscriberCount: 0,
          totalVideos: 0,
          totalViews: 0,
          email: formData.email || null,
          phone: formData.phone || null,
          wechat: formData.wechat || null,
          description: formData.description || null,
          tags: formData.tags ? formData.tags.split(",").map(tag => tag.trim()) : [],
          category: formData.category || null,
          niche: formData.niche || null,
          level: formData.level,
          priceRange: formData.priceRange || null,
          averagePrice: formData.averagePrice ? parseFloat(formData.averagePrice) : null,
          qualityScore: formData.qualityScore ? parseFloat(formData.qualityScore) : null,
          cooperationScore: formData.cooperationScore ? parseFloat(formData.cooperationScore) : null,
          engagementRate: null,
          status: formData.status,
          isFavorite: false,
          cooperationCount: 0,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "添加达人失败");
      }

      const result: ApiResponse<Influencer> = await response.json();

      if (result.success) {
        toast.success("达人添加成功");
        setIsAddDialogOpen(false);
        resetForm();
        loadInfluencers();
      } else {
        throw new Error(result.error || "添加达人失败");
      }
    } catch (error) {
      console.error("添加达人失败:", error);
      toast.error(error instanceof Error ? error.message : "添加达人失败");
    }
  };

  const handleUpdateInfluencer = async () => {
    if (!selectedInfluencer) return;

    try {
      const response = await fetch(`/api/v1/influencers/${selectedInfluencer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelTitle: formData.channelTitle,
          email: formData.email || null,
          phone: formData.phone || null,
          wechat: formData.wechat || null,
          description: formData.description || null,
          tags: formData.tags ? formData.tags.split(",").map(tag => tag.trim()) : [],
          category: formData.category || null,
          niche: formData.niche || null,
          level: formData.level,
          priceRange: formData.priceRange || null,
          averagePrice: formData.averagePrice ? parseFloat(formData.averagePrice) : null,
          qualityScore: formData.qualityScore ? parseFloat(formData.qualityScore) : null,
          cooperationScore: formData.cooperationScore ? parseFloat(formData.cooperationScore) : null,
          status: formData.status,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "更新达人失败");
      }

      const result: ApiResponse<Influencer> = await response.json();

      if (result.success) {
        toast.success("达人更新成功");
        setIsEditDialogOpen(false);
        resetForm();
        loadInfluencers();
      } else {
        throw new Error(result.error || "更新达人失败");
      }
    } catch (error) {
      console.error("更新达人失败:", error);
      toast.error(error instanceof Error ? error.message : "更新达人失败");
    }
  };

  const handleDeleteInfluencer = async (id: string) => {
    if (!confirm("确定要删除这个达人吗？")) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/influencers/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "删除达人失败");
      }

      const result: ApiResponse<{ id: string }> = await response.json();

      if (result.success) {
        toast.success("达人删除成功");
        loadInfluencers();
      } else {
        throw new Error(result.error || "删除达人失败");
      }
    } catch (error) {
      console.error("删除达人失败:", error);
      toast.error(error instanceof Error ? error.message : "删除达人失败");
    }
  };

  const handleToggleFavorite = async (id: string, currentState: boolean) => {
    try {
      const response = await fetch(`/api/v1/influencers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isFavorite: !currentState,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "操作失败");
      }

      const result: ApiResponse<Influencer> = await response.json();

      if (result.success) {
        toast.success(result.data.isFavorite ? "已收藏" : "已取消收藏");
        loadInfluencers();
      } else {
        throw new Error(result.error || "操作失败");
      }
    } catch (error) {
      console.error("操作失败:", error);
      toast.error(error instanceof Error ? error.message : "操作失败");
    }
  };

  const handleEdit = (influencer: Influencer) => {
    setSelectedInfluencer(influencer);
    setFormData({
      channelId: influencer.channelId,
      channelTitle: influencer.channelTitle,
      email: influencer.email || "",
      phone: influencer.phone || "",
      wechat: influencer.wechat || "",
      description: influencer.description || "",
      tags: influencer.tags?.join(", ") || "",
      category: influencer.category || "",
      niche: influencer.niche || "",
      level: influencer.level,
      priceRange: influencer.priceRange || "",
      averagePrice: influencer.averagePrice?.toString() || "",
      qualityScore: influencer.qualityScore?.toString() || "",
      cooperationScore: influencer.cooperationScore?.toString() || "",
      status: influencer.status,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      channelId: "",
      channelTitle: "",
      email: "",
      phone: "",
      wechat: "",
      description: "",
      tags: "",
      category: "",
      niche: "",
      level: "C",
      priceRange: "",
      averagePrice: "",
      qualityScore: "",
      cooperationScore: "",
      status: "available",
    });
    setSelectedInfluencer(null);
  };

  const formatNumber = (num: number | null): string => {
    if (!num) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      available: { color: "bg-[#34C759]", label: "可合作" },
      contacted: { color: "bg-[#FF9500]", label: "沟通中" },
      collaborating: { color: "bg-[#007AFF]", label: "合作中" },
      blacklist: { color: "bg-[#FF3B30]", label: "黑名单" },
    };
    const statusInfo = statusMap[status] || { color: "bg-[#86868B]", label: status };
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getLevelBadge = (level: string) => {
    const levelColors: Record<string, string> = {
      S: "bg-[#FF3B30]",
      A: "bg-[#FF9500]",
      B: "bg-[#007AFF]",
      C: "bg-[#34C759]",
      D: "bg-[#86868B]",
    };
    return (
      <Badge className={levelColors[level] || "bg-[#86868B]"}>
        {level}级
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1D1D1F] mb-2">
            达人管理
          </h1>
          <p className="text-sm text-[#86868B]">
            管理和跟踪合作的 YouTube 达人
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>添加达人</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>添加达人</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="channelId">频道ID *</Label>
                  <Input
                    id="channelId"
                    value={formData.channelId}
                    onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
                    placeholder="UCxxxxxx"
                  />
                </div>
                <div>
                  <Label htmlFor="channelTitle">频道标题 *</Label>
                  <Input
                    id="channelTitle"
                    value={formData.channelTitle}
                    onChange={(e) => setFormData({ ...formData, channelTitle: e.target.value })}
                    placeholder="达人名称"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">电话</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+86 13800000000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="wechat">微信号</Label>
                <Input
                  id="wechat"
                  value={formData.wechat}
                  onChange={(e) => setFormData({ ...formData, wechat: e.target.value })}
                  placeholder="wxid_xxxxx"
                />
              </div>

              <div>
                <Label htmlFor="description">简介</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="达人简介..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">分类</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="科技、美妆、游戏"
                  />
                </div>
                <div>
                  <Label htmlFor="niche">细分领域</Label>
                  <Input
                    id="niche"
                    value={formData.niche}
                    onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                    placeholder="产品评测、开箱视频"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tags">标签（逗号分隔）</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="科技, 数码, 评测"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="level">等级</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) => setFormData({ ...formData, level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["S", "A", "B", "C", "D"].map((level) => (
                        <SelectItem key={level} value={level}>{level}级</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priceRange">价格区间</Label>
                  <Input
                    id="priceRange"
                    value={formData.priceRange}
                    onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
                    placeholder="1000-5000"
                  />
                </div>
                <div>
                  <Label htmlFor="averagePrice">平均报价</Label>
                  <Input
                    id="averagePrice"
                    type="number"
                    value={formData.averagePrice}
                    onChange={(e) => setFormData({ ...formData, averagePrice: e.target.value })}
                    placeholder="3000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="qualityScore">质量评分 (0-100)</Label>
                  <Input
                    id="qualityScore"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.qualityScore}
                    onChange={(e) => setFormData({ ...formData, qualityScore: e.target.value })}
                    placeholder="80"
                  />
                </div>
                <div>
                  <Label htmlFor="cooperationScore">配合度 (0-100)</Label>
                  <Input
                    id="cooperationScore"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.cooperationScore}
                    onChange={(e) => setFormData({ ...formData, cooperationScore: e.target.value })}
                    placeholder="85"
                  />
                </div>
                <div>
                  <Label htmlFor="status">状态</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">可合作</SelectItem>
                      <SelectItem value="contacted">沟通中</SelectItem>
                      <SelectItem value="collaborating">合作中</SelectItem>
                      <SelectItem value="blacklist">黑名单</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleAddInfluencer} className="w-full">
                添加达人
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 筛选和搜索 */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Input
            type="text"
            placeholder="搜索达人名称、邮箱..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:col-span-2"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="available">可合作</SelectItem>
              <SelectItem value="contacted">沟通中</SelectItem>
              <SelectItem value="collaborating">合作中</SelectItem>
              <SelectItem value="blacklist">黑名单</SelectItem>
            </SelectContent>
          </Select>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger>
              <SelectValue placeholder="等级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部等级</SelectItem>
              <SelectItem value="S">S级</SelectItem>
              <SelectItem value="A">A级</SelectItem>
              <SelectItem value="B">B级</SelectItem>
              <SelectItem value="C">C级</SelectItem>
              <SelectItem value="D">D级</SelectItem>
            </SelectContent>
          </Select>
          <Select value={favoriteFilter} onValueChange={setFavoriteFilter}>
            <SelectTrigger>
              <SelectValue placeholder="收藏" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="true">已收藏</SelectItem>
              <SelectItem value="false">未收藏</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* 达人列表 */}
      <Card>
        {loading ? (
          <div className="p-12 text-center text-[#86868B]">加载中...</div>
        ) : influencers.length === 0 ? (
          <div className="p-12 text-center text-[#86868B]">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-[#1D1D1F] mb-2">
              暂无达人
            </h3>
            <p className="text-sm">
              点击"添加达人"按钮开始添加你的第一个达人
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[rgba(0,0,0,0.08)]">
            {influencers.map((influencer) => (
              <div
                key={influencer.id}
                className="p-6 hover:bg-[rgba(0,122,255,0.02)] transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* 达人头像 */}
                  <img
                    src={influencer.thumbnail || "/placeholder-avatar.png"}
                    alt={influencer.channelTitle}
                    className="w-16 h-16 rounded-full object-cover bg-[#F5F5F7]"
                  />

                  {/* 达人信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2">
                      <h3 className="font-medium text-[#1D1D1F]">
                        {influencer.channelTitle}
                      </h3>
                      {getLevelBadge(influencer.level)}
                      {getStatusBadge(influencer.status)}
                      {influencer.isFavorite && (
                        <span className="text-[#FF9500]">⭐</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-[#86868B] mb-2">
                      <span>订阅: {formatNumber(influencer.subscriberCount)}</span>
                      <span>视频: {influencer.totalVideos}</span>
                      <span>总观看: {formatNumber(influencer.totalViews)}</span>
                      {influencer.cooperationCount > 0 && (
                        <span>合作次数: {influencer.cooperationCount}</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-2">
                      {influencer.category && (
                        <Badge variant="secondary">{influencer.category}</Badge>
                      )}
                      {influencer.niche && (
                        <Badge variant="secondary">{influencer.niche}</Badge>
                      )}
                      {influencer.tags?.map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm mb-2">
                      {influencer.email && <span>📧 {influencer.email}</span>}
                      {influencer.phone && <span>📱 {influencer.phone}</span>}
                      {influencer.wechat && <span>💬 {influencer.wechat}</span>}
                    </div>

                    {influencer.description && (
                      <p className="text-sm text-[#86868B] line-clamp-2">
                        {influencer.description}
                      </p>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleFavorite(influencer.id, influencer.isFavorite)}
                    >
                      {influencer.isFavorite ? "⭐ 已收藏" : "☆ 收藏"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(influencer)}
                    >
                      编辑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteInfluencer(influencer.id)}
                      className="text-[#FF3B30] hover:text-[#FF3B30]"
                    >
                      删除
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 编辑达人对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑达人</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-channelId">频道ID</Label>
                <Input
                  id="edit-channelId"
                  value={formData.channelId}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="edit-channelTitle">频道标题</Label>
                <Input
                  id="edit-channelTitle"
                  value={formData.channelTitle}
                  onChange={(e) => setFormData({ ...formData, channelTitle: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-email">邮箱</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">电话</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-wechat">微信号</Label>
              <Input
                id="edit-wechat"
                value={formData.wechat}
                onChange={(e) => setFormData({ ...formData, wechat: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-description">简介</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category">分类</Label>
                <Input
                  id="edit-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-niche">细分领域</Label>
                <Input
                  id="edit-niche"
                  value={formData.niche}
                  onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-tags">标签（逗号分隔）</Label>
              <Input
                id="edit-tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-level">等级</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => setFormData({ ...formData, level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["S", "A", "B", "C", "D"].map((level) => (
                      <SelectItem key={level} value={level}>{level}级</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-priceRange">价格区间</Label>
                <Input
                  id="edit-priceRange"
                  value={formData.priceRange}
                  onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-averagePrice">平均报价</Label>
                <Input
                  id="edit-averagePrice"
                  type="number"
                  value={formData.averagePrice}
                  onChange={(e) => setFormData({ ...formData, averagePrice: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-qualityScore">质量评分 (0-100)</Label>
                <Input
                  id="edit-qualityScore"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.qualityScore}
                  onChange={(e) => setFormData({ ...formData, qualityScore: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-cooperationScore">配合度 (0-100)</Label>
                <Input
                  id="edit-cooperationScore"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.cooperationScore}
                  onChange={(e) => setFormData({ ...formData, cooperationScore: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-status">状态</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">可合作</SelectItem>
                    <SelectItem value="contacted">沟通中</SelectItem>
                    <SelectItem value="collaborating">合作中</SelectItem>
                    <SelectItem value="blacklist">黑名单</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleUpdateInfluencer} className="w-full">
              更新达人
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
