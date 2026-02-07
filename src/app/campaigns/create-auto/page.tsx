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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { ArrowRight, Loader2, CheckCircle2, ChevronDown } from "lucide-react";

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
    languages: [] as string[],
    minSubscriberCount: "10000",
    maxSubscriberCount: "100000",
    minEngagementRate: "5",
    maxPrice: "",
    negotiationStrategy: "moderate",
    autoMatching: true,
    autoNegotiation: true,
    // 邮件配置
    senderName: "",
    senderEmail: "",
    companyName: "",
    websiteUrl: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [languagePopoverOpen, setLanguagePopoverOpen] = useState(false);

  // YouTube 标准分类
  const categoryOptions = [
    { value: "1", label: "Film & Animation（影视与动画）" },
    { value: "2", label: "Autos & Vehicles（汽车与交通）" },
    { value: "10", label: "Music（音乐）" },
    { value: "15", label: "Pets & Animals（宠物与动物）" },
    { value: "17", label: "Sports（体育）" },
    { value: "19", label: "Travel & Events（旅行与活动）" },
    { value: "20", label: "Gaming（游戏）" },
    { value: "22", label: "People & Blogs（人物与博客）" },
    { value: "23", label: "Comedy（喜剧）" },
    { value: "24", label: "Entertainment（娱乐）" },
    { value: "25", label: "News & Politics（新闻与政治）" },
    { value: "26", label: "Howto & Style（教程与时尚）" },
    { value: "27", label: "Education（教育）" },
    { value: "28", label: "Science & Technology（科学与技术）" },
    { value: "29", label: "Nonprofits & Activism（非营利与活动）" },
  ];

  // 语言选项
  const languageOptions = [
    { value: "zh-CN", label: "简体中文" },
    { value: "zh-TW", label: "繁体中文" },
    { value: "en", label: "英语" },
    { value: "fr", label: "法语" },
    { value: "de", label: "德语" },
    { value: "ja", label: "日语" },
    { value: "it", label: "意大利语" },
    { value: "es", label: "西班牙语" },
    { value: "pt", label: "葡萄牙语" },
  ];

  const handleCheckboxChange = (field: string, value: string) => {
    const current = formData[field as keyof typeof formData] as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFormData({ ...formData, [field]: updated });
  };

  const getSelectedLabels = (field: string, options: { value: string; label: string }[]) => {
    const selected = formData[field as keyof typeof formData] as string[];
    return options
      .filter((opt) => selected.includes(opt.value))
      .map((opt) => opt.label.split("（")[0])
      .join("、");
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

    if (!formData.senderName || !formData.senderEmail || !formData.companyName) {
      toast.error("请填写邮件配置信息");
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

        {/* 邮件配置 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">邮件配置</h2>
          <p className="text-sm text-[#86868B] mb-4">
            配置邀请邮件的发送者信息，专业可信的邮件内容能显著提高邀约成功率
          </p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="senderName">发件人姓名 *</Label>
              <Input
                id="senderName"
                placeholder="例如：张三 / Marketing Team"
                value={formData.senderName}
                onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
              />
              <p className="text-xs text-[#86868B] mt-1">建议使用真实姓名或团队名称，增加可信度</p>
            </div>

            <div>
              <Label htmlFor="senderEmail">发件人邮箱 *</Label>
              <Input
                id="senderEmail"
                type="email"
                placeholder="例如：marketing@yourcompany.com"
                value={formData.senderEmail}
                onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
              />
              <p className="text-xs text-[#86868B] mt-1">建议使用公司域名的邮箱，避免使用免费邮箱</p>
            </div>

            <div>
              <Label htmlFor="companyName">公司/品牌名称 *</Label>
              <Input
                id="companyName"
                placeholder="例如：您的品牌名称"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="websiteUrl">官网地址</Label>
              <Input
                id="websiteUrl"
                type="url"
                placeholder="https://yourwebsite.com"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
              />
              <p className="text-xs text-[#86868B] mt-1">添加官网可以增加博主对您的信任度</p>
            </div>
          </div>

          {/* 提高邀约成功率的提示 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">💡 提高邀约成功率的小技巧</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ <strong>个性化称呼</strong>：系统会自动使用博主的频道名称</li>
              <li>✓ <strong>展示诚意</strong>：提供合理的预算范围，展示了解博主的内容</li>
              <li>✓ <strong>专业形象</strong>：使用公司邮箱和真实姓名，避免免费邮箱</li>
              <li>✓ <strong>清晰诉求</strong>：详细说明项目目标和合作内容</li>
              <li>✓ <strong>及时响应</strong>：系统会自动处理邮件发送和后续跟进</li>
            </ul>
          </div>
        </Card>

        {/* 筛选条件 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">达人筛选条件</h2>

          <div className="space-y-6">
            {/* 博主分类 - 多选下拉框 */}
            <div>
              <Label>博主分类（YouTube标准分类）</Label>
              <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between mt-2"
                  >
                    <span className="truncate">
                      {formData.categories.length > 0
                        ? getSelectedLabels("categories", categoryOptions)
                        : "请选择分类（可多选）"}
                    </span>
                    <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4">
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {categoryOptions.map((opt) => (
                      <div key={opt.value} className="flex items-start space-x-2">
                        <Checkbox
                          id={`cat-${opt.value}`}
                          checked={formData.categories.includes(opt.value)}
                          onCheckedChange={() => handleCheckboxChange("categories", opt.value)}
                        />
                        <Label
                          htmlFor={`cat-${opt.value}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t text-sm text-[#86868B]">
                    已选择 {formData.categories.length} 个分类
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* 语言 - 多选下拉框 */}
            <div>
              <Label>视频语言</Label>
              <Popover open={languagePopoverOpen} onOpenChange={setLanguagePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between mt-2"
                  >
                    <span className="truncate">
                      {formData.languages.length > 0
                        ? getSelectedLabels("languages", languageOptions)
                        : "请选择语言（可多选）"}
                    </span>
                    <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4">
                  <div className="space-y-2">
                    {languageOptions.map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`lang-${opt.value}`}
                          checked={formData.languages.includes(opt.value)}
                          onCheckedChange={() => handleCheckboxChange("languages", opt.value)}
                        />
                        <Label
                          htmlFor={`lang-${opt.value}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t text-sm text-[#86868B]">
                    已选择 {formData.languages.length} 种语言
                  </div>
                </PopoverContent>
              </Popover>
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
