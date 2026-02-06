/**
 * Affiliate 拓展诊断 API
 * GET /api/influencers/affiliate/diagnose?keyword=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  runAllDiagnosis
} from '@/lib/services/diagnose-affiliate';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword') || 'wireless earbuds';

    console.log(`[API] 开始 Affiliate 拓展诊断: ${keyword}`);

    // 运行诊断
    const result = await runAllDiagnosis(keyword);

    return NextResponse.json({
      success: true,
      keyword,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[API] 诊断失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'DIAGNOSIS_FAILED'
      },
      { status: 500 }
    );
  }
}
