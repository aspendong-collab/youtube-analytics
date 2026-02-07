"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function AIAssistantPage() {
  const [influencerName, setInfluencerName] = useState("");
  const [influencerCategory, setInfluencerCategory] = useState("");
  const [influencerLevel, setInfluencerLevel] = useState("C");
  const [campaignName, setCampaignName] = useState("");
  const [campaignDescription, setCampaignDescription] = useState("");
  const [campaignBudget, setCampaignBudget] = useState("");
  const [tone, setTone] = useState<"professional" | "friendly" | "casual" | "formal">("professional");
  const [includeOffer, setIncludeOffer] = useState(false);
  const [customRequirements, setCustomRequirements] = useState("");

  const [generatedMessage, setGeneratedMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!influencerName || !campaignName) {
      toast.error("请填写达人名称和活动名称");
      return;
    }

    setIsGenerating(true);
    setGeneratedMessage("");

    try {
      const response = await fetch("/api/v1/ai/generate-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          influencerName,
          influencerCategory,
          influencerLevel,
          campaignName,
          campaignDescription,
          campaignBudget: campaignBudget ? parseFloat(campaignBudget) : null,
          tone,
          includeOffer,
          customRequirements,
        }),
      });

      if (!response.ok) {
        throw new Error("生成消息失败");
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
        setGeneratedMessage((prev) => prev + text);
      }

      toast.success("消息生成成功");
    } catch (error) {
      console.error("生成消息失败:", error);
      toast.error(error instanceof Error ? error.message : "生成消息失败");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMessage);
    toast.success("已复制到剪贴板");
  };

  const handleClear = () => {
    setInfluencerName("");
    setInfluencerCategory("");
    setInfluencerLevel("C");
    setCampaignName("");
    setCampaignDescription("");
    setCampaignBudget("");
    setTone("professional");
    setIncludeOffer(false);
    setCustomRequirements("");
    setGeneratedMessage("");
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1D1D1F] mb-2">
          智能沟通助手
        </h1>
        <p className="text-sm text-[#86868B]">
          使用 AI 生成个性化的达人邀请消息
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

            <div>
              <Label htmlFor="influencerName">频道名称 *</Label>
              <Input
                id="influencerName"
                value={influencerName}
                onChange={(e) => setInfluencerName(e.target.value)}
                placeholder="例如：TechReviewer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="influencerCategory">频道分类</Label>
                <Input
                  id="influencerCategory"
                  value={influencerCategory}
                  onChange={(e) => setInfluencerCategory(e.target.value)}
                  placeholder="例如：科技评测"
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
          </div>

          {/* 活动信息 */}
          <div className="space-y-4 pt-4 border-t">
            <div className="text-sm font-medium text-[#86868B]">
              活动信息
            </div>

            <div>
              <Label htmlFor="campaignName">活动名称 *</Label>
              <Input
                id="campaignName"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="例如：2024新品推广"
              />
            </div>

            <div>
              <Label htmlFor="campaignDescription">活动描述</Label>
              <Textarea
                id="campaignDescription"
                value={campaignDescription}
                onChange={(e) => setCampaignDescription(e.target.value)}
                placeholder="描述活动的目标和背景..."
                rows={3}
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
          </div>

          {/* 沟通设置 */}
          <div className="space-y-4 pt-4 border-t">
            <div className="text-sm font-medium text-[#86868B]">
              沟通设置
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tone">语气风格</Label>
                <Select value={tone} onValueChange={(value: any) => setTone(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">专业正式</SelectItem>
                    <SelectItem value="friendly">友好亲切</SelectItem>
                    <SelectItem value="casual">轻松自然</SelectItem>
                    <SelectItem value="formal">非常正式</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center pt-6">
                <input
                  type="checkbox"
                  id="includeOffer"
                  checked={includeOffer}
                  onChange={(e) => setIncludeOffer(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="includeOffer" className="ml-2">
                  包含报价信息
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
              onClick={handleGenerate}
              disabled={isGenerating || !influencerName || !campaignName}
              className="flex-1"
            >
              {isGenerating ? "生成中..." : "生成消息"}
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
              生成的消息
            </h2>
            {generatedMessage && (
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
            {isGenerating && !generatedMessage ? (
              <div className="h-full flex items-center justify-center text-[#86868B]">
                <div className="text-center">
                  <div className="text-4xl mb-2">✨</div>
                  <p>AI 正在生成消息...</p>
                </div>
              </div>
            ) : generatedMessage ? (
              <Textarea
                value={generatedMessage}
                onChange={(e) => setGeneratedMessage(e.target.value)}
                className="min-h-[500px] resize-none"
                placeholder="生成的消息将显示在这里..."
              />
            ) : (
              <div className="h-full flex items-center justify-center text-[#86868B]">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <p>填写信息后点击"生成消息"</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
