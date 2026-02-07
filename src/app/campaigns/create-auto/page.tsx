"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

export default function CreateAutoCampaignPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    budget: "",
    budgetPerInfluencer: "",
    targetInfluencerCount: "20",
    startDate: "",
    endDate: "",
    categories: [] as string[],
    regions: [] as string[],
    languages: [] as string[],
    minSubscriberCount: "10000",
    maxSubscriberCount: "100000",
    minEngagementRate: "5",
    maxPrice: "",
    negotiationStrategy: "moderate",
    autoMatching: true,
    autoNegotiation: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  const categoryOptions = [
    { value: "tech", label: "科技" },
    { value: "gaming", label: "游戏" },
    { value: "beauty", label: "美妆" },
    { value: "lifestyle", label: "生活" },
    { value: "education", label: "教育" },
    { value: "entertainment", label: "娱乐" },
  ];

  const regionOptions = [
    { value: "US", label: "美国" },
    { value: "CA", label: "加拿大" },
    { value: "UK", label: "英国" },
    { value: "AU", label: "澳大利亚" },
    { value: "DE", label: "德国" },
  ];

  const languageOptions = [
    { value: "en", label: "英语" },
    { value: "es", label: "西班牙语" },
    { value: "fr", label: "法语" },
    { value: "de", label: "德语" },
  ];

  const handleCheckboxChange = (field: string, value: string) => {
    const current = formData[field as keyof typeof formData] as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFormData({ ...formData, [field]: updated });
  };

  const calculatePreview = () => {
    const budget = parseFloat(formData.budget) || 0;
    const budgetPerInfluencer = parseFloat(formData.budgetPerInfluencer) || 0;
    const targetCount = parseInt(formData.targetInfluencerCount) || 0;

    const estimatedTotalCost = budgetPerInfluencer * targetCount;
    const estimatedInfluencers = Math.floor(budget / budgetPerInfluencer);

    setPreview({
      estimatedTotalCost,
      estimatedInfluencers,
      withinBudget: estimatedTotalCost <= budget,
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.budget || !formData.budgetPerInfluencer) {
      toast.error("请填写必填字段");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/campaigns/auto-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          criteria: {
            categories: formData.categories,
            regions: formData.regions,
            languages: formData.languages,
            minSubscriberCount: parseInt(formData.minSubscriberCount),
            maxSubscriberCount: parseInt(formData.maxSubscriberCount),
            minEngagementRate: parseFloat(formData.minEngagementRate),
            maxPrice: formData.maxPrice ? parseFloat(formData.maxPrice) : undefined,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("自动化推广项目创建成功！");
        
        // 自动处理邮件队列
        if (formData.autoMatching && result.data.matchResult) {
          toast.info(`已匹配 ${result.data.matchResult.totalMatched} 位达人，正在发送邮件...`);
          
          // 触发邮件队列处理
          await fetch("/api/v1/jobs/process-email-queue", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ limit: 50 }),
          });
        }
        
        // 跳转到进度页面
        window.location.href = `/campaigns/${result.data.campaign.id}/progress`;
      } else {
        throw new Error(result.error || "创建失败");
      }
    } catch (error: any) {
      console.error("Create auto campaign error:", error);
      toast.error(error.message || "创建失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-[#1D1D1F]">创建自动化推广项目</h1>
        <p className="text-sm text-[#86868B]">
          设置推广参数，系统将自动匹配达人、发送邮件并进行谈判
        </p>
      </div>

      <div className="grid gap-6">
        {/* 基本信息 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">基本信息</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">项目名称 *</Label>
              <Input
                id="name"
                placeholder="例如：2024年春季新品推广"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="description">项目描述</Label>
              <Textarea
                id="description"
                placeholder="描述您的推广目标和要求..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget">总预算 (USD) *</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="2000"
                  value={formData.budget}
                  onChange={(e) => {
                    setFormData({ ...formData, budget: e.target.value });
                    calculatePreview();
                  }}
                />
              </div>

              <div>
                <Label htmlFor="budgetPerInfluencer">单个博主预算 (USD) *</Label>
                <Input
                  id="budgetPerInfluencer"
                  type="number"
                  placeholder="100"
                  value={formData.budgetPerInfluencer}
                  onChange={(e) => {
                    setFormData({ ...formData, budgetPerInfluencer: e.target.value });
                    calculatePreview();
                  }}
                />
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
          </div>
        </Card>

        {/* 筛选条件 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">达人筛选条件</h2>
          
          <div className="space-y-6">
            <div>
              <Label>博主分类</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {categoryOptions.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cat-${opt.value}`}
                      checked={formData.categories.includes(opt.value)}
                      onCheckedChange={() => handleCheckboxChange("categories", opt.value)}
                    />
                    <Label htmlFor={`cat-${opt.value}`}>{opt.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label>粉丝数范围</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder="最小"
                    value={formData.minSubscriberCount}
                    onChange={(e) => setFormData({ ...formData, minSubscriberCount: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="最大"
                    value={formData.maxSubscriberCount}
                    onChange={(e) => setFormData({ ...formData, maxSubscriberCount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="minEngagementRate">最低互动率 (%)</Label>
                <Input
                  id="minEngagementRate"
                  type="number"
                  placeholder="5"
                  value={formData.minEngagementRate}
                  onChange={(e) => setFormData({ ...formData, minEngagementRate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="maxPrice">最高报价上限 (USD)</Label>
              <Input
                id="maxPrice"
                type="number"
                placeholder="150"
                value={formData.maxPrice}
                onChange={(e) => setFormData({ ...formData, maxPrice: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* 自动化设置 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">自动化设置</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoMatching">启用自动匹配</Label>
                <p className="text-sm text-[#86868B]">系统将自动筛选符合条件的达人</p>
              </div>
              <Checkbox
                id="autoMatching"
                checked={formData.autoMatching}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, autoMatching: !!checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoNegotiation">启用自动谈判</Label>
                <p className="text-sm text-[#86868B]">AI 将自动进行价格谈判</p>
              </div>
              <Checkbox
                id="autoNegotiation"
                checked={formData.autoNegotiation}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, autoNegotiation: !!checked })
                }
              />
            </div>

            <div>
              <Label htmlFor="negotiationStrategy">谈判策略</Label>
              <Select
                value={formData.negotiationStrategy}
                onValueChange={(value) =>
                  setFormData({ ...formData, negotiationStrategy: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">保守策略（降价慢，成功率低）</SelectItem>
                  <SelectItem value="moderate">温和策略（平衡）</SelectItem>
                  <SelectItem value="aggressive">进取策略（降价快，可能谈崩）</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* 预览 */}
        {preview && (
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              项目预览
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>预计匹配达人</Label>
                <p className="text-2xl font-semibold">{preview.estimatedInfluencers} 位</p>
              </div>
              <div>
                <Label>预估总成本</Label>
                <p className={`text-2xl font-semibold ${preview.withinBudget ? "text-green-600" : "text-red-600"}`}>
                  ${preview.estimatedTotalCost}
                </p>
              </div>
            </div>

            {!preview.withinBudget && (
              <p className="text-sm text-red-600 mt-2">
                ⚠️ 预估成本超出预算！请调整参数。
              </p>
            )}
          </Card>
        )}

        {/* 提交按钮 */}
        <div className="flex gap-4">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                创建中...
              </>
            ) : (
              <>
                创建并启动自动化流程
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
