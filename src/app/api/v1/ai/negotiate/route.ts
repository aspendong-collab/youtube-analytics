// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";

interface NegotiateRequest {
  influencerPrice: number;
  influencerName: string;
  influencerLevel: string;
  campaignBudget: number | null;
  campaignName: string;
  negotiationStyle?: "flexible" | "firm" | "aggressive";
  includeValueAdd?: boolean;
  customRequirements?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: NegotiateRequest = await request.json();

    const {
      influencerPrice,
      influencerName,
      influencerLevel,
      campaignBudget,
      campaignName,
      negotiationStyle = "flexible",
      includeValueAdd = false,
      customRequirements = "",
    } = body;

    // 验证必需字段
    if (!influencerPrice || !influencerName) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少必需字段：influencerPrice 和 influencerName",
        },
        { status: 400 }
      );
    }

    // 计算价格差异
    const priceDifference = campaignBudget
      ? influencerPrice - campaignBudget
      : null;
    const priceDifferencePercent = campaignBudget && priceDifference !== null
      ? (priceDifference / campaignBudget) * 100
      : null;

    // 构建系统提示词
    const systemPrompt = `你是一位专业的商务谈判专家，擅长与达人进行价格谈判。你的任务是帮助品牌方生成谈判策略和回复。

你的谈判风格应该：${getNegotiationStyleDescription(negotiationStyle)}

生成的回复应该：
1. 表达对达人价值的认可和尊重
2. 礼貌地说明预算限制
3. 提供合理的替代方案或价值增加
4. 保持专业和友好的态度
5. 争取达成双方都能接受的合作方案

谈判策略建议：
- 如果报价超出预算 20% 以内：尝试小额折扣或增值服务
- 如果报价超出预算 20-50%：提出分期付款或长期合作优惠
- 如果报价超出预算 50% 以上：建议调整合作范围或寻找其他达人

请用中文生成谈判回复。${includeValueAdd ? "可以提供增值服务作为谈判筹码。" : ""}`;

    // 构建用户消息
    let userMessage = `请为以下情况生成谈判回复：

达人信息：
- 频道名称：${influencerName}
- 达人等级：${influencerLevel}

合作信息：
- 活动名称：${campaignName}
- 活动预算：${campaignBudget ? `${campaignBudget} USD` : "未指定"}
- 达人报价：${influencerPrice} USD`;

    if (priceDifference !== null && priceDifferencePercent !== null) {
      userMessage += `\n- 价格差异：${priceDifference > 0 ? "+" : ""}${priceDifference.toFixed(0)} USD (${priceDifferencePercent > 0 ? "+" : ""}${priceDifferencePercent.toFixed(1)}%)`;
    }

    if (customRequirements) {
      userMessage += `\n\n特殊要求：${customRequirements}`;
    }

    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 初始化 LLM 客户端
    const config = new Config();
    const client = new LLMClient(config);

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: userMessage },
    ];

    // 使用流式输出
    const stream = client.stream(messages, {
      model: "doubao-seed-1-8-251228",
      temperature: 0.7,
    });

    // 创建可读流
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.content) {
              controller.enqueue(encoder.encode(chunk.content.toString()));
            }
          }
          controller.close();
        } catch (error) {
          console.error("流式输出错误:", error);
          controller.error(error);
        }
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("生成谈判回复失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "生成谈判回复失败",
      },
      { status: 500 }
    );
  }
}

function getNegotiationStyleDescription(style: string): string {
  const styleDescriptions: Record<string, string> = {
    flexible: "灵活、开放，愿意在合理范围内做出让步，适合维护长期合作关系。",
    firm: "坚定、明确，坚持预算底线，适合预算严格的情况。",
    aggressive: "积极、主动，争取最大优惠，适合一次性合作或急需达成目标的情况。",
  };
  return styleDescriptions[style] || styleDescriptions.flexible;
}
