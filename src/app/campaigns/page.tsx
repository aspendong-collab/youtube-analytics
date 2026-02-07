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
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  budget: number | null;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  category: string | null;
  targetAudience: string | null;
  goals: string[] | null;
  requirements: string | null;
  invitedInfluencerCount: number;
  acceptedInfluencerCount: number;
  completedInfluencerCount: number;
}

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

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [availableInfluencers, setAvailableInfluencers] = useState<Influencer[]>([]);
  const [selectedInfluencers, setSelectedInfluencers] = useState<Set<string>>(new Set());
  const [inviteLoading, setInviteLoading] = useState(false);
  const [influencerSearch, setInfluencerSearch] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    budget: "",
    currency: "USD",
    startDate: "",
    endDate: "",
    status: "planned",
    category: "",
    targetAudience: "",
    goals: "",
    requirements: "",
  });

  // 加载活动列表
  useEffect(() => {
    loadCampaigns();
  }, [statusFilter, search]);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", "1");
      params.append("pageSize", "100");
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (search) params.append("search", search);

      const response = await fetch(`/api/v1/campaigns?${params.toString()}`);

      if (!response.ok) {
        throw new Error("获取活动列表失败");
      }

      const result: ApiResponse<PaginatedResponse<Campaign>> = await response.json();

      if (result.success && result.data) {
        setCampaigns(result.data.items);
      } else {
        throw new Error(result.error || "获取活动列表失败");
      }
    } catch (error) {
      console.error("加载活动列表失败:", error);
      toast.error(error instanceof Error ? error.message : "加载活动列表失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!formData.name) {
      toast.error("活动名称不能为空");
      return;
    }

    try {
      const response = await fetch("/api/v1/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          currency: formData.currency,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          status: formData.status,
          category: formData.category || null,
          targetAudience: formData.targetAudience || null,
          goals: formData.goals ? formData.goals.split(",").map(g => g.trim()) : [],
          requirements: formData.requirements || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "创建活动失败");
      }

      const result: ApiResponse<Campaign> = await response.json();

      if (result.success) {
        toast.success("活动创建成功");
        setIsCreateDialogOpen(false);
        resetForm();
        loadCampaigns();
      } else {
        throw new Error(result.error || "创建活动失败");
      }
    } catch (error) {
      console.error("创建活动失败:", error);
      toast.error(error instanceof Error ? error.message : "创建活动失败");
    }
  };

  const handleUpdateCampaign = async () => {
    if (!selectedCampaign) return;

    try {
      const response = await fetch(`/api/v1/campaigns/${selectedCampaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          currency: formData.currency,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          status: formData.status,
          category: formData.category || null,
          targetAudience: formData.targetAudience || null,
          goals: formData.goals ? formData.goals.split(",").map(g => g.trim()) : [],
          requirements: formData.requirements || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "更新活动失败");
      }

      const result: ApiResponse<Campaign> = await response.json();

      if (result.success) {
        toast.success("活动更新成功");
        setIsEditDialogOpen(false);
        resetForm();
        loadCampaigns();
      } else {
        throw new Error(result.error || "更新活动失败");
      }
    } catch (error) {
      console.error("更新活动失败:", error);
      toast.error(error instanceof Error ? error.message : "更新活动失败");
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("确定要删除这个活动吗？")) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/campaigns/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "删除活动失败");
      }

      const result: ApiResponse<{ id: string }> = await response.json();

      if (result.success) {
        toast.success("活动删除成功");
        loadCampaigns();
      } else {
        throw new Error(result.error || "删除活动失败");
      }
    } catch (error) {
      console.error("删除活动失败:", error);
      toast.error(error instanceof Error ? error.message : "删除活动失败");
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description || "",
      budget: campaign.budget?.toString() || "",
      currency: campaign.currency,
      startDate: campaign.startDate || "",
      endDate: campaign.endDate || "",
      status: campaign.status,
      category: campaign.category || "",
      targetAudience: campaign.targetAudience || "",
      goals: campaign.goals?.join(", ") || "",
      requirements: campaign.requirements || "",
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      budget: "",
      currency: "USD",
      startDate: "",
      endDate: "",
      status: "planned",
      category: "",
      targetAudience: "",
      goals: "",
      requirements: "",
    });
    setSelectedCampaign(null);
  };

  // 打开邀请对话框
  const handleOpenInviteDialog = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setSelectedInfluencers(new Set());
    setInfluencerSearch("");
    setIsInviteDialogOpen(true);
    await loadAvailableInfluencers();
  };

  // 加载可用的达人列表
  const loadAvailableInfluencers = async () => {
    try {
      const params = new URLSearchParams();
      params.append("page", "1");
      params.append("pageSize", "100");
      params.append("status", "available");
      if (influencerSearch) params.append("search", influencerSearch);

      const response = await fetch(`/api/v1/influencers?${params.toString()}`);

      if (!response.ok) {
        throw new Error("获取达人列表失败");
      }

      const result: ApiResponse<PaginatedResponse<Influencer>> = await response.json();

      if (result.success && result.data) {
        setAvailableInfluencers(result.data.items);
      } else {
        throw new Error(result.error || "获取达人列表失败");
      }
    } catch (error) {
      console.error("加载达人列表失败:", error);
      toast.error(error instanceof Error ? error.message : "加载达人列表失败");
    }
  };

  // 处理达人搜索
  useEffect(() => {
    if (isInviteDialogOpen) {
      loadAvailableInfluencers();
    }
  }, [influencerSearch]);

  // 切换达人选择
  const toggleInfluencerSelection = (influencerId: string) => {
    const newSelected = new Set(selectedInfluencers);
    if (newSelected.has(influencerId)) {
      newSelected.delete(influencerId);
    } else {
      newSelected.add(influencerId);
    }
    setSelectedInfluencers(newSelected);
  };

  // 批量邀请达人
  const handleBatchInvite = async () => {
    if (!selectedCampaign || selectedInfluencers.size === 0) {
      toast.error("请至少选择一个达人");
      return;
    }

    setInviteLoading(true);
    try {
      const response = await fetch(`/api/v1/campaigns/${selectedCampaign.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          influencerIds: Array.from(selectedInfluencers),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "邀请达人失败");
      }

      const result: ApiResponse<{ invited: number; failed: number }> = await response.json();

      if (result.success) {
        toast.success(`成功邀请 ${result.data.invited} 个达人${result.data.failed > 0 ? `，失败 ${result.data.failed} 个` : ""}`);
        setIsInviteDialogOpen(false);
        loadCampaigns();
      } else {
        throw new Error(result.error || "邀请达人失败");
      }
    } catch (error) {
      console.error("邀请达人失败:", error);
      toast.error(error instanceof Error ? error.message : "邀请达人失败");
    } finally {
      setInviteLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      planned: { color: "bg-[#86868B]", label: "计划中" },
      active: { color: "bg-[#34C759]", label: "进行中" },
      paused: { color: "bg-[#FF9500]", label: "已暂停" },
      completed: { color: "bg-[#007AFF]", label: "已完成" },
      cancelled: { color: "bg-[#FF3B30]", label: "已取消" },
    };
    const statusInfo = statusMap[status] || { color: "bg-[#86868B]", label: status };
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("zh-CN");
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1D1D1F] mb-2">
            营销活动管理
          </h1>
          <p className="text-sm text-[#86868B]">
            管理和组织达人营销活动
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>创建活动</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>创建营销活动</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">活动名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：2024年新品推广活动"
                />
              </div>

              <div>
                <Label htmlFor="description">活动描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="描述活动的目标和背景..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="budget">预算</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="10000"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">货币</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="CNY">CNY</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">开始日期</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">结束日期</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">分类</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="产品推广、品牌建设"
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
                      <SelectItem value="planned">计划中</SelectItem>
                      <SelectItem value="active">进行中</SelectItem>
                      <SelectItem value="paused">已暂停</SelectItem>
                      <SelectItem value="completed">已完成</SelectItem>
                      <SelectItem value="cancelled">已取消</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="targetAudience">目标受众</Label>
                <Input
                  id="targetAudience"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  placeholder="例如：18-35岁科技爱好者"
                />
              </div>

              <div>
                <Label htmlFor="goals">目标（逗号分隔）</Label>
                <Input
                  id="goals"
                  value={formData.goals}
                  onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                  placeholder="提高品牌知名度, 增加产品销量"
                />
              </div>

              <div>
                <Label htmlFor="requirements">需求说明</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="详细说明对达人的要求和期望..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button onClick={handleCreateCampaign}>创建活动</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 筛选和搜索 */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            type="text"
            placeholder="搜索活动名称..."
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
              <SelectItem value="planned">计划中</SelectItem>
              <SelectItem value="active">进行中</SelectItem>
              <SelectItem value="paused">已暂停</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
              <SelectItem value="cancelled">已取消</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* 活动列表 */}
      <Card>
        {loading ? (
          <div className="p-12 text-center text-[#86868B]">加载中...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center text-[#86868B]">
            <div className="text-6xl mb-4">📢</div>
            <h3 className="text-lg font-medium text-[#1D1D1F] mb-2">
              暂无活动
            </h3>
            <p className="text-sm">
              点击"创建活动"按钮开始创建你的第一个营销活动
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[rgba(0,0,0,0.08)]">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="p-6 hover:bg-[rgba(0,122,255,0.02)] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* 活动信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2">
                      <h3 className="font-medium text-[#1D1D1F]">
                        {campaign.name}
                      </h3>
                      {getStatusBadge(campaign.status)}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-[#86868B] mb-2">
                      <span>预算: {campaign.budget ? `${campaign.budget} ${campaign.currency}` : "-"}</span>
                      <span>开始: {formatDate(campaign.startDate)}</span>
                      <span>结束: {formatDate(campaign.endDate)}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-2">
                      {campaign.category && (
                        <Badge variant="secondary">{campaign.category}</Badge>
                      )}
                      {campaign.targetAudience && (
                        <Badge variant="outline">{campaign.targetAudience}</Badge>
                      )}
                    </div>

                    {campaign.description && (
                      <p className="text-sm text-[#86868B] line-clamp-2">
                        {campaign.description}
                      </p>
                    )}

                    <div className="flex gap-6 mt-3 text-sm">
                      <span className="text-[#86868B]">
                        已邀请: <span className="text-[#1D1D1F] font-medium">{campaign.invitedInfluencerCount}</span>
                      </span>
                      <span className="text-[#86868B]">
                        已接受: <span className="text-[#34C759] font-medium">{campaign.acceptedInfluencerCount}</span>
                      </span>
                      <span className="text-[#86868B]">
                        已完成: <span className="text-[#007AFF] font-medium">{campaign.completedInfluencerCount}</span>
                      </span>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenInviteDialog(campaign)}
                    >
                      邀请达人
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(campaign)}
                    >
                      编辑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCampaign(campaign.id)}
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

      {/* 编辑活动对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑营销活动</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">活动名称</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-description">活动描述</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="edit-budget">预算</Label>
                <Input
                  id="edit-budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-currency">货币</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="CNY">CNY</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-startDate">开始日期</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-endDate">结束日期</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
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
                <Label htmlFor="edit-status">状态</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">计划中</SelectItem>
                    <SelectItem value="active">进行中</SelectItem>
                    <SelectItem value="paused">已暂停</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-targetAudience">目标受众</Label>
              <Input
                id="edit-targetAudience"
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-goals">目标（逗号分隔）</Label>
              <Input
                id="edit-goals"
                value={formData.goals}
                onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-requirements">需求说明</Label>
              <Textarea
                id="edit-requirements"
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button onClick={handleUpdateCampaign}>更新活动</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* 邀请达人对话框 */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              邀请达人 - {selectedCampaign?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="搜索达人..."
                value={influencerSearch}
                onChange={(e) => setInfluencerSearch(e.target.value)}
              />
            </div>

            <div className="border rounded-lg max-h-[400px] overflow-y-auto">
              {availableInfluencers.length === 0 ? (
                <div className="p-8 text-center text-[#86868B]">
                  暂无可用达人
                </div>
              ) : (
                <div className="divide-y">
                  {availableInfluencers.map((influencer) => (
                    <div
                      key={influencer.id}
                      className="flex items-center gap-4 p-4 hover:bg-[rgba(0,122,255,0.02)]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedInfluencers.has(influencer.id)}
                        onChange={() => toggleInfluencerSelection(influencer.id)}
                        className="w-4 h-4"
                      />
                      <img
                        src={influencer.thumbnail || "/placeholder-avatar.png"}
                        alt={influencer.channelTitle}
                        className="w-12 h-12 rounded-full object-cover bg-[#F5F5F7]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[#1D1D1F]">
                          {influencer.channelTitle}
                        </div>
                        <div className="text-sm text-[#86868B]">
                          订阅: {(influencer.subscriberCount / 1000).toFixed(0)}K | 
                          等级: {influencer.level}级
                        </div>
                        {influencer.averagePrice && (
                          <div className="text-sm text-[#007AFF]">
                            平均报价: {influencer.averagePrice} USD
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary">{influencer.category}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-[#86868B]">
                已选择 {selectedInfluencers.size} 个达人
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsInviteDialogOpen(false)}
                >
                  取消
                </Button>
                <Button
                  onClick={handleBatchInvite}
                  disabled={selectedInfluencers.size === 0 || inviteLoading}
                >
                  {inviteLoading ? "邀请中..." : "发送邀请"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
