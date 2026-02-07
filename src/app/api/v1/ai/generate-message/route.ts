import { NextRequest, NextResponse } from "next/server";
import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";

interface GenerateMessageRequest {
  influencerName: string;
  influencerCategory: string;
  influencerLevel: string;
  campaignName: string;
  campaignDescription: string;
  campaignBudget: number | null;
  tone?: "professional" | "friendly" | "casual" | "formal";
  includeOffer?: boolean;
  customRequirements?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateMessageRequest = await request.json();

    const {
      influencerName,
      influencerCategory,
      influencerLevel,
      campaignName,
      campaignDescription,
      campaignBudget,
      tone = "professional",
      includeOffer = false,
      customRequirements = "",
    } = body;

    // 验证必需字段
    if (!influencerName || !campaignName) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少必需字段：influencerName 和 campaignName",
        },
        { status: 400 }
      );
    }

    // 构建系统提示词
    const systemPrompt = `你是一位专业的达人营销顾问，擅长与 YouTube 达人沟通。你的任务是帮助品牌方生成邀请达人的营销消息。

你的沟通风格应该：${getToneDescription(tone)}

生成的消息应该：
1. 开头要个性化，提及达人的频道和特色
2. 清楚说明合作项目的背景和目标
3. 解释为什么选择这位达人（与内容的匹配度）
4. 提供有吸引力的合作提案
5. 表达真诚的意愿，而不是模板化的广告
6. 长度适中（200-400字），简洁有力

请用中文生成消息。${includeOffer ? "最后要提及合作报价或预算范围。" : ""}`;

    // 构建用户消息
    let userMessage = `请为以下合作生成一条邀请消息：

达人信息：
- 频道名称：${influencerName}
- 频道分类：${influencerCategory || "未知"}
- 达人等级：${influencerLevel || "C"}

活动信息：
- 活动名称：${campaignName}
- 活动描述：${campaignDescription || "暂无"}
- 活动预算：${campaignBudget ? `${campaignBudget} USD` : "面议"}`;

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
      temperature: 0.8,
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
    console.error("生成消息失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "生成消息失败",
      },
      { status: 500 }
    );
  }
}

function getToneDescription(tone: string): string {
  const toneDescriptions: Record<string, string> = {
    professional: "专业、正式、尊重，适合商务合作。",
    friendly: "友好、亲切、温暖，拉近与达人的距离。",
    casual: "轻松、自然、不做作，适合年轻化的沟通。",
    formal: "非常正式、礼貌，适合高端品牌。",
  };
  return toneDescriptions[tone] || toneDescriptions.professional;
}
