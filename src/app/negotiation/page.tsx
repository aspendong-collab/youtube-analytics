"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function NegotiationPage() {
  const [influencerPrice, setInfluencerPrice] = useState("");
  const [influencerName, setInfluencerName] = useState("");
  const [influencerLevel, setInfluencerLevel] = useState("C");
  const [campaignBudget, setCampaignBudget] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [negotiationStyle, setNegotiationStyle] = useState<"flexible" | "firm" | "aggressive">("flexible");
  const [includeValueAdd, setIncludeValueAdd] = useState(false);
  const [customRequirements, setCustomRequirements] = useState("");

  const [generatedResponse, setGeneratedResponse] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleNegotiate = async () => {
    if (!influencerPrice || !influencerName) {
      toast.error("请填写达人报价和达人名称");
      return;
    }

    setIsGenerating(true);
    setGeneratedResponse("");

    try {
      const response = await fetch("/api/v1/ai/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          influencerPrice: parseFloat(influencerPrice),
          influencerName,
          influencerLevel,
          campaignBudget: campaignBudget ? parseFloat(campaignBudget) : null,
          campaignName,
          negotiationStyle,
          includeValueAdd,
          customRequirements,
        }),
      });

      if (!response.ok) {
        throw new Error("生成谈判回复失败");
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("无法读取响应流");
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const text = decoder.decode(value);
        setGeneratedResponse((prev) => prev + text);
      }

      toast.success("谈判回复生成成功");
    } catch (error) {
      console.error("生成谈判回复失败:", error);
      toast.error(error instanceof Error ? error.message : "生成谈判回复失败");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedResponse);
    toast.success("已复制到剪贴板");
  };

  const handleClear = () => {
    setInfluencerPrice("");
    setInfluencerName("");
    setInfluencerLevel("C");
    setCampaignBudget("");
    setCampaignName("");
    setNegotiationStyle("flexible");
    setIncludeValueAdd(false);
    setCustomRequirements("");
    setGeneratedResponse("");
  };

  // 计算价格差异
  const priceDifference = campaignBudget && influencerPrice
    ? parseFloat(influencerPrice) - parseFloat(campaignBudget)
    : null;
  const priceDifferencePercent = campaignBudget && influencerPrice
    ? ((parseFloat(influencerPrice) - parseFloat(campaignBudget)) / parseFloat(campaignBudget)) * 100
    : null;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1D1D1F] mb-2">
          自动谈判助手
        </h1>
        <p className="text-sm text-[#86868B]">
          使用 AI 生成智能的谈判策略和回复
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 输入区域 */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">
            填写信息
          </h2>

          {/* 达人信息 */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-[#86868B]">
              达人信息
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="influencerName">频道名称 *</Label>
                <Input
                  id="influencerName"
                  value={influencerName}
                  onChange={(e) => setInfluencerName(e.target.value)}
                  placeholder="例如：TechReviewer"
                />
              </div>
              <div>
                <Label htmlFor="influencerLevel">达人等级</Label>
                <Select
                  value={influencerLevel}
                  onValueChange={setInfluencerLevel}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S">S 级</SelectItem>
                    <SelectItem value="A">A 级</SelectItem>
                    <SelectItem value="B">B 级</SelectItem>
                    <SelectItem value="C">C 级</SelectItem>
                    <SelectItem value="D">D 级</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="influencerPrice">达人报价（USD）*</Label>
              <Input
                id="influencerPrice"
                type="number"
                value={influencerPrice}
                onChange={(e) => setInfluencerPrice(e.target.value)}
                placeholder="例如：8000"
              />
            </div>
          </div>

          {/* 活动信息 */}
          <div className="space-y-4 pt-4 border-t">
            <div className="text-sm font-medium text-[#86868B]">
              活动信息
            </div>

            <div>
              <Label htmlFor="campaignName">活动名称</Label>
              <Input
                id="campaignName"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="例如：2024新品推广"
              />
            </div>

            <div>
              <Label htmlFor="campaignBudget">活动预算（USD）</Label>
              <Input
                id="campaignBudget"
                type="number"
                value={campaignBudget}
                onChange={(e) => setCampaignBudget(e.target.value)}
                placeholder="例如：5000"
              />
            </div>

            {/* 价格差异提示 */}
            {priceDifference !== null && priceDifferencePercent !== null && (
              <div className="p-3 rounded-lg bg-[rgba(0,0,0,0.02)]">
                <div className="text-sm font-medium mb-1">价格分析</div>
                <div className="flex items-center gap-2">
                  <span className="text-[#86868B]">差异：</span>
                  <Badge
                    variant={priceDifference > 0 ? "destructive" : "default"}
                    className={priceDifference < 0 ? "bg-[#34C759]" : ""}
                  >
                    {priceDifference > 0 ? "+" : ""}{priceDifference.toFixed(0)} USD
                    ({priceDifferencePercent > 0 ? "+" : ""}{priceDifferencePercent.toFixed(1)}%)
                  </Badge>
                </div>
                <div className="text-xs text-[#86868B] mt-1">
                  {priceDifferencePercent > 50 && "⚠️ 报价严重超出预算，建议寻找其他达人"}
                  {priceDifferencePercent > 20 && priceDifferencePercent <= 50 && "⚠️ 报价超出预算较多，需要谨慎谈判"}
                  {priceDifferencePercent > 0 && priceDifferencePercent <= 20 && "✅ 报价略高于预算，可以尝试协商"}
                  {priceDifferencePercent <= 0 && "✅ 报价在预算范围内"}
                </div>
              </div>
            )}
          </div>

          {/* 谈判设置 */}
          <div className="space-y-4 pt-4 border-t">
            <div className="text-sm font-medium text-[#86868B]">
              谈判设置
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="negotiationStyle">谈判风格</Label>
                <Select
                  value={negotiationStyle}
                  onValueChange={(value: any) => setNegotiationStyle(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flexible">灵活开放</SelectItem>
                    <SelectItem value="firm">坚定明确</SelectItem>
                    <SelectItem value="aggressive">积极进取</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center pt-6">
                <input
                  type="checkbox"
                  id="includeValueAdd"
                  checked={includeValueAdd}
                  onChange={(e) => setIncludeValueAdd(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="includeValueAdd" className="ml-2">
                  包含增值服务
                </Label>
              </div>
            </div>

            <div>
              <Label htmlFor="customRequirements">特殊要求</Label>
              <Textarea
                id="customRequirements"
                value={customRequirements}
                onChange={(e) => setCustomRequirements(e.target.value)}
                placeholder="其他需要提及的内容..."
                rows={2}
              />
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleNegotiate}
              disabled={isGenerating || !influencerPrice || !influencerName}
              className="flex-1"
            >
              {isGenerating ? "生成中..." : "生成谈判回复"}
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
            >
              清空
            </Button>
          </div>
        </Card>

        {/* 输出区域 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#1D1D1F]">
              谈判回复
            </h2>
            {generatedResponse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
              >
                复制
              </Button>
            )}
          </div>

          <div className="min-h-[500px]">
            {isGenerating && !generatedResponse ? (
              <div className="h-full flex items-center justify-center text-[#86868B]">
                <div className="text-center">
                  <div className="text-4xl mb-2">💼</div>
                  <p>AI 正在分析并生成谈判策略...</p>
                </div>
              </div>
            ) : generatedResponse ? (
              <Textarea
                value={generatedResponse}
                onChange={(e) => setGeneratedResponse(e.target.value)}
                className="min-h-[500px] resize-none"
                placeholder="生成的谈判回复将显示在这里..."
              />
            ) : (
              <div className="h-full flex items-center justify-center text-[#86868B]">
                <div className="text-center">
                  <div className="text-6xl mb-4">🤝</div>
                  <p>填写信息后点击"生成谈判回复"</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
