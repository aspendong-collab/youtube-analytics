import { NextRequest, NextResponse } from 'next/server';
import { commentManager } from '@/storage/database';

export const dynamic = 'force-dynamic';

/**
 * GET /api/comments
 * 获取视频评论
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get('videoId');
  const type = searchParams.get('type') || 'all'; // all | highQuality | sentiment

  if (!videoId) {
    return NextResponse.json(
      { error: '视频ID不能为空' },
      { status: 400 }
    );
  }

  try {
    if (type === 'highQuality') {
      const comments = await commentManager.getHighQualityComments(videoId);
      return NextResponse.json({ comments });
    } else if (type === 'sentiment') {
      const stats = await commentManager.getSentimentStats(videoId);
      return NextResponse.json(stats);
    } else {
      const comments = await commentManager.getCommentsByVideoId(videoId);
      return NextResponse.json({ comments });
    }
  } catch (error) {
    console.error('获取评论失败:', error);
    return NextResponse.json(
      {
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/comments/fetch
 * 从YouTube获取视频评论并进行情感分析
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { videoId, maxResults = 100 } = body;

  if (!videoId) {
    return NextResponse.json(
      { error: '视频ID不能为空' },
      { status: 400 }
    );
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: '未配置 YouTube API Key' },
      { status: 500 }
    );
  }

  try {
    // 从YouTube获取评论
    const commentsUrl = new URL('https://www.googleapis.com/youtube/v3/commentThreads');
    commentsUrl.searchParams.append('part', 'snippet,replies');
    commentsUrl.searchParams.append('videoId', videoId);
    commentsUrl.searchParams.append('maxResults', String(Math.min(maxResults, 100)));
    commentsUrl.searchParams.append('key', apiKey);
    commentsUrl.searchParams.append('order', 'relevance');

    console.log(`[API /api/comments/fetch] 调用 YouTube CommentThreads API:`, {
      videoId,
      url: commentsUrl.toString().replace(/key=[^&]+/, 'key=***'),
    });

    const response = await fetch(commentsUrl.toString());
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[API /api/comments/fetch] YouTube API 错误:', errorData);

      return NextResponse.json(
        { error: '获取评论失败', statusCode: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return NextResponse.json({
        message: '该视频暂无评论',
        comments: [],
      });
    }

    // 处理评论数据
    const commentsToInsert = [];
    let fetched = 0;
    let skipped = 0;

    for (const item of data.items) {
      const snippet = item.snippet.topLevelComment.snippet;
      const commentId = snippet.videoId || item.id;

      // 检查评论是否已存在
      const exists = await commentManager.commentExists(commentId);
      if (exists) {
        skipped++;
        continue;
      }

      // 简单的情感分析（基于关键词）
      const text = snippet.textDisplay.toLowerCase();
      let sentiment = 'neutral';
      let qualityScore = 0;

      // 积极关键词
      const positiveKeywords = ['good', 'great', 'awesome', 'love', 'amazing', 'excellent', '好', '棒', '太棒了', '喜欢', '爱', '优秀', '精彩', '不错', '厉害'];
      // 消极关键词
      const negativeKeywords = ['bad', 'terrible', 'hate', 'worst', 'awful', 'disappointing', '差', '糟糕', '讨厌', '失望', '垃圾', '无聊', '不好'];

      const positiveCount = positiveKeywords.filter(kw => text.includes(kw)).length;
      const negativeCount = negativeKeywords.filter(kw => text.includes(kw)).length;

      if (positiveCount > negativeCount) {
        sentiment = 'positive';
      } else if (negativeCount > positiveCount) {
        sentiment = 'negative';
      }

      // 质量评分（基于点赞数、长度、情感）
      const likeCount = parseInt(snippet.likeCount) || 0;
      const lengthScore = Math.min(snippet.textDisplay.length / 500, 1); // 长度评分，最高1分
      const likeScore = Math.min(likeCount / 100, 1); // 点赞评分，最高1分
      const sentimentBonus = sentiment === 'positive' ? 0.5 : 0; // 积极情感加分

      qualityScore = (lengthScore * 0.3 + likeScore * 0.5 + sentimentBonus) * 10;
      qualityScore = Math.min(Math.max(qualityScore, 0), 10); // 确保在0-10之间

      const commentData = {
        commentId,
        videoId,
        authorName: snippet.authorDisplayName,
        authorChannelId: snippet.authorChannelId?.value,
        textDisplay: snippet.textDisplay,
        likeCount: parseInt(snippet.likeCount) || 0,
        publishedAt: new Date(snippet.publishedAt),
        updatedAt: new Date(snippet.updatedAt),
        sentiment,
        qualityScore: String(qualityScore.toFixed(2)),
        isHighQuality: qualityScore >= 6, // 6分以上为高质量评论
      };

      commentsToInsert.push(commentData);
      fetched++;
    }

    // 批量插入评论
    if (commentsToInsert.length > 0) {
      await commentManager.bulkCreateComments(commentsToInsert);
    }

    return NextResponse.json({
      message: `成功获取 ${fetched} 条评论，跳过 ${skipped} 条已存在的评论`,
      comments: commentsToInsert.length,
      total: fetched + skipped,
      sentimentStats: {
        positive: commentsToInsert.filter(c => c.sentiment === 'positive').length,
        neutral: commentsToInsert.filter(c => c.sentiment === 'neutral').length,
        negative: commentsToInsert.filter(c => c.sentiment === 'negative').length,
      },
    });

  } catch (error) {
    console.error('获取评论失败:', error);
    return NextResponse.json(
      {
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
