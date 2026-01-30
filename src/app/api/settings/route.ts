import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// 获取配置
export async function GET() {
  try {
    const cookieStore = await cookies();
    const settings = cookieStore.get('app_settings');

    if (settings) {
      return NextResponse.json(JSON.parse(settings.value));
    }

    // 默认配置
    const defaultSettings = {
      apiKeys: {
        youtubeApiKey: '',
        googleClientId: '',
      },
      collection: {
        autoCollect: true,
        collectInterval: 24,
        collectMetrics: true,
        collectComments: false,
        collectAnalytics: true,
      },
    };

    return NextResponse.json(defaultSettings);
  } catch (error) {
    console.error('获取配置失败:', error);
    return NextResponse.json(
      { error: '获取配置失败' },
      { status: 500 }
    );
  }
}

// 保存配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cookieStore = await cookies();

    // 保存到 cookie（有效期 30 天）
    cookieStore.set('app_settings', JSON.stringify(body), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 天
    });

    // 注意：这里只是保存到 cookie，实际项目中应该保存到数据库
    // 如果需要在服务端使用 API Key，还需要更新环境变量

    return NextResponse.json({ success: true, message: '配置保存成功' });
  } catch (error) {
    console.error('保存配置失败:', error);
    return NextResponse.json(
      { error: '保存配置失败' },
      { status: 500 }
    );
  }
}
