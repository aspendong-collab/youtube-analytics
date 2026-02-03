import { NextRequest, NextResponse } from "next/server";
import { analyzeCompetitors, getChannelVideos } from "@/lib/youtube-api";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const type = searchParams.get("type") || "search";
    const channelId = searchParams.get("channelId");
    const maxResults = parseInt(searchParams.get("maxResults") || "50");

    // 验证 YouTube API Key
    if (!process.env.YOUTUBE_API_KEY) {
      return NextResponse.json(
        { error: "YouTube API Key 未配置" },
        { status: 500 }
      );
    }

    // 竞品分析
    if (type === "search" && query) {
      const result = await analyzeCompetitors(query, maxResults);
      return NextResponse.json(result);
    }

    // 获取频道视频
    if (type === "channel" && channelId) {
      const videos = await getChannelVideos(channelId, maxResults);
      return NextResponse.json({ videos });
    }

    return NextResponse.json(
      { error: "无效的请求参数" },
      { status: 400 }
    );
  } catch (error) {
    console.error("竞品检测 API 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "分析失败，请稍后重试" },
      { status: 500 }
    );
  }
}
