import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ScanResponse {
  success: boolean;
  message: string;
  taskId: string;
  stats: {
    competitorsScanned: number;
    videosFound: number;
    apiCalls: number;
  };
  timestamp: string;
}

/**
 * 手动触发竞品监控扫描
 *
 * 支持的参数：
 * - competitorSlug: 竞品标识符（可选，不指定则扫描所有竞品）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const competitorSlug = body.competitorSlug || '';

    console.log('[竞品监控扫描] 触发扫描任务:', { competitorSlug });

    // 生成任务ID
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 调用监控API获取数据
    const apiUrl = competitorSlug
      ? `/api/competitor-monitoring/pdf?competitorSlug=${competitorSlug}`
      : '/api/competitor-monitoring/pdf';

    // 构建完整的URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
    const fullUrl = `${baseUrl}${apiUrl}`;

    console.log('[竞品监控扫描] 调用监控API:', fullUrl);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`监控API调用失败: ${response.status}`);
    }

    const data = await response.json();

    console.log('[竞品监控扫描] 监控结果:', {
      videosFound: data.total || 0,
      competitors: data.competitors?.length || 0,
    });

    const scanResponse: ScanResponse = {
      success: true,
      message: '扫描完成',
      taskId,
      stats: {
        competitorsScanned: data.competitors?.length || 0,
        videosFound: data.total || 0,
        apiCalls: 1, // 简化处理
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(scanResponse);

  } catch (error) {
    console.error('[竞品监控扫描] 错误:', error);
    return NextResponse.json(
      {
        success: false,
        message: '扫描失败',
        error: error instanceof Error ? error.message : '未知错误',
        taskId: '',
        stats: {
          competitorsScanned: 0,
          videosFound: 0,
          apiCalls: 0,
        },
        timestamp: new Date().toISOString(),
      } as ScanResponse,
      { status: 500 }
    );
  }
}
