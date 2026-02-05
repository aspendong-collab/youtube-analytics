"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Star,
  StarOff,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Users,
} from "lucide-react";

interface UserInfluencer {
  id: string;
  influencerId: string;
  channelId: string;
  status: string;
  priority: string;
  notes: string | null;
  lastContactDate: string | null;
  nextFollowUpDate: string | null;
  contactCount: number;
  estimatedBudget: number | null;
  actualBudget: number | null;
  contractStatus: string;
  cooperationStartDate: string | null;
  cooperationEndDate: string | null;
  cooperationCount: number;
  tags: string[] | null;
  category: string | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  // AI 达人信息
  channelTitle: string;
  channelThumbnail: string | null;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  engagementRate: number | null;
  totalScore: number | null;
  scoreTier: string | null;
  description: string | null;
  keywords: string[] | null;
}

const STATUS_LABELS = {
  interested: { label: "感兴趣", color: "blue" },
  contacted: { label: "已联系", color: "yellow" },
  negotiating: { label: "洽谈中", color: "purple" },
  collaborating: { label: "合作中", color: "green" },
  completed: { label: "已完成", color: "gray" },
  rejected: { label: "已拒绝", color: "red" },
};

const PRIORITY_LABELS = {
  high: { label: "高", color: "red" },
  medium: { label: "中", color: "yellow" },
  low: { label: "低", color: "gray" },
};

const CONTRACT_STATUS_LABELS = {
  none: "无",
  pending: "待签",
  signed: "已签",
};

export default function MyInfluencersPage() {
  const [influencers, setInfluencers] = useState<UserInfluencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [favoriteFilter, setFavoriteFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<UserInfluencer | null>(null);

  const [formData, setFormData] = useState({
    status: "",
    priority: "",
    notes: "",
    nextFollowUpDate: "",
    estimatedBudget: "",
    actualBudget: "",
    contractStatus: "",
    category: "",
  });

  // 加载达人列表
  useEffect(() => {
    loadInfluencers();
  }, [statusFilter, priorityFilter, favoriteFilter, search, sortBy, sortOrder, currentPage]);

  const loadInfluencers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);
      if (favoriteFilter === "true") params.append("isFavorite", "true");
      if (search) params.append("search", search);
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);
      params.append("page", currentPage.toString());
      params.append("limit", "20");

      const response = await fetch(`/api/user-influencers?${params.toString()}`);

      if (!response.ok) {
        throw new Error("获取达人列表失败");
      }

      const data = await response.json();
      setInfluencers(data.data);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("加载达人列表失败:", error);
      toast.error("加载达人列表失败");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (influencer: UserInfluencer) => {
    setSelectedInfluencer(influencer);
    setFormData({
      status: influencer.status,
      priority: influencer.priority,
      notes: influencer.notes || "",
      nextFollowUpDate: influencer.nextFollowUpDate ? influencer.nextFollowUpDate.split("T")[0] : "",
      estimatedBudget: influencer.estimatedBudget?.toString() || "",
      actualBudget: influencer.actualBudget?.toString() || "",
      contractStatus: influencer.contractStatus,
      category: influencer.category || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedInfluencer) return;

    try {
      const response = await fetch(`/api/user-influencers/${selectedInfluencer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: formData.status,
          priority: formData.priority,
          notes: formData.notes,
          nextFollowUpDate: formData.nextFollowUpDate ? new Date(formData.nextFollowUpDate).toISOString() : null,
          estimatedBudget: formData.estimatedBudget ? parseFloat(formData.estimatedBudget) : null,
          actualBudget: formData.actualBudget ? parseFloat(formData.actualBudget) : null,
          contractStatus: formData.contractStatus,
          category: formData.category,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "更新达人失败");
      }

      toast.success("达人更新成功");
      setIsEditDialogOpen(false);
      loadInfluencers();
    } catch (error) {
      console.error("更新达人失败:", error);
      toast.error(error instanceof Error ? error.message : "更新达人失败");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要从我的列表中删除这个达人吗？")) {
      return;
    }

    try {
      const response = await fetch(`/api/user-influencers/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("删除达人失败");
      }

      toast.success("达人删除成功");
      loadInfluencers();
    } catch (error) {
      console.error("删除达人失败:", error);
      toast.error("删除达人失败");
    }
  };

  const handleToggleFavorite = async (influencer: UserInfluencer) => {
    try {
      const response = await fetch(`/api/user-influencers/${influencer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isFavorite: !influencer.isFavorite,
        }),
      });

      if (!response.ok) {
        throw new Error("更新收藏状态失败");
      }

      toast.success(influencer.isFavorite ? "已取消收藏" : "已添加收藏");
      loadInfluencers();
    } catch (error) {
      console.error("更新收藏状态失败:", error);
      toast.error("更新收藏状态失败");
    }
  };

  const handleUpdateContact = async (influencer: UserInfluencer) => {
    try {
      const response = await fetch(`/api/user-influencers/${influencer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lastContactDate: new Date().toISOString(),
          contactCount: influencer.contactCount + 1,
        }),
      });

      if (!response.ok) {
        throw new Error("更新联系记录失败");
      }

      toast.success("已记录联系");
      loadInfluencers();
    } catch (error) {
      console.error("更新联系记录失败:", error);
      toast.error("更新联系记录失败");
    }
  };

  const formatNumber = (num: number | null): string => {
    if (!num) return "0";
    if (num >= 10000) return (num / 10000).toFixed(1) + "万";
    return num.toString();
  };

  const formatDate = (date: string | null): string => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("zh-CN");
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">我的达人管理</h1>
          <p className="text-gray-500 mt-2">管理你收藏和跟进的达人，追踪合作进度</p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.location.href = "/discovery"}
        >
          <Plus className="w-4 h-4 mr-2" />
          添加达人
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总数</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">合作中</p>
                <p className="text-2xl font-bold">
                  {influencers.filter(i => i.status === "collaborating").length}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">洽谈中</p>
                <p className="text-2xl font-bold">
                  {influencers.filter(i => i.status === "negotiating").length}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Mail className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">收藏</p>
                <p className="text-2xl font-bold">
                  {influencers.filter(i => i.isFavorite).length}
                </p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="搜索达人名称或备注..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="优先级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部优先级</SelectItem>
                {Object.entries(PRIORITY_LABELS).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={favoriteFilter} onValueChange={setFavoriteFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="收藏" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="true">已收藏</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="排序" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">添加时间</SelectItem>
                <SelectItem value="updatedAt">更新时间</SelectItem>
                <SelectItem value="priority">优先级</SelectItem>
                <SelectItem value="status">状态</SelectItem>
                <SelectItem value="lastContactDate">最后联系</SelectItem>
                <SelectItem value="nextFollowUpDate">下次跟进</SelectItem>
                <SelectItem value="subscriberCount">订阅数</SelectItem>
                <SelectItem value="totalScore">评分</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">降序</SelectItem>
                <SelectItem value="asc">升序</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadInfluencers}>
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 达人列表 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>达人</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>优先级</TableHead>
                <TableHead>订阅数</TableHead>
                <TableHead>互动率</TableHead>
                <TableHead>最后联系</TableHead>
                <TableHead>下次跟进</TableHead>
                <TableHead>预算</TableHead>
                <TableHead>合同</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : influencers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    暂无达人，去{" "}
                    <Button
                      variant="link"
                      className="p-0"
                      onClick={() => window.location.href = "/discovery"}
                    >
                      发现
                    </Button>
                    更多达人
                  </TableCell>
                </TableRow>
              ) : (
                influencers.map((influencer) => (
                  <TableRow key={influencer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={influencer.channelThumbnail || "/placeholder-avatar.png"}
                          alt={influencer.channelTitle}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <div className="font-medium">{influencer.channelTitle}</div>
                          <div className="text-sm text-gray-500">
                            {formatNumber(influencer.subscriberCount)} 订阅 · {formatNumber(influencer.videoCount)} 视频
                          </div>
                        </div>
                        {influencer.isFavorite && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`bg-${STATUS_LABELS[influencer.status as keyof typeof STATUS_LABELS]?.color}-100 text-${STATUS_LABELS[influencer.status as keyof typeof STATUS_LABELS]?.color}-700`}
                      >
                        {STATUS_LABELS[influencer.status as keyof typeof STATUS_LABELS]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`border-${PRIORITY_LABELS[influencer.priority as keyof typeof PRIORITY_LABELS]?.color}-300`}
                      >
                        {PRIORITY_LABELS[influencer.priority as keyof typeof PRIORITY_LABELS]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatNumber(influencer.subscriberCount)}</TableCell>
                    <TableCell>
                      {influencer.engagementRate ? `${influencer.engagementRate}%` : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {formatDate(influencer.lastContactDate)}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateContact(influencer)}
                          title="记录联系"
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(influencer.nextFollowUpDate)}</TableCell>
                    <TableCell>
                      {influencer.actualBudget ? `¥${formatNumber(Number(influencer.actualBudget))}` : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {CONTRACT_STATUS_LABELS[influencer.contractStatus as keyof typeof CONTRACT_STATUS_LABELS]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>操作</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEdit(influencer)}>
                            <Edit className="w-4 h-4 mr-2" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleFavorite(influencer)}>
                            {influencer.isFavorite ? (
                              <>
                                <StarOff className="w-4 h-4 mr-2" />
                                取消收藏
                              </>
                            ) : (
                              <>
                                <Star className="w-4 h-4 mr-2" />
                                收藏
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(influencer.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-gray-500">
                显示 {(currentPage - 1) * 20 + 1}-{Math.min(currentPage * 20, total)} / 共 {total} 个
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  上一页
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  下一页
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑达人跟进信息</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">跟进状态</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">优先级</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABELS).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimatedBudget">预估预算</Label>
                <Input
                  id="estimatedBudget"
                  type="number"
                  placeholder="0"
                  value={formData.estimatedBudget}
                  onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="actualBudget">实际预算</Label>
                <Input
                  id="actualBudget"
                  type="number"
                  placeholder="0"
                  value={formData.actualBudget}
                  onChange={(e) => setFormData({ ...formData, actualBudget: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contractStatus">合同状态</Label>
                <Select value={formData.contractStatus} onValueChange={(v) => setFormData({ ...formData, contractStatus: v })}>
                  <SelectTrigger id="contractStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONTRACT_STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">分类</Label>
                <Input
                  id="category"
                  placeholder="分类"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="nextFollowUpDate">下次跟进日期</Label>
              <Input
                id="nextFollowUpDate"
                type="date"
                value={formData.nextFollowUpDate}
                onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="notes">跟进备注</Label>
              <Textarea
                id="notes"
                placeholder="记录跟进过程中的重要信息..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdate}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
