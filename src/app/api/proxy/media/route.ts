import { NextRequest, NextResponse } from 'next/server';

/**
 * 媒体代理路由
 * 用于解决外部图片/视频的CORS问题
 *
 * 使用方式: /api/proxy/media?url=<encoded_url>
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: '缺少url参数' }, { status: 400 });
  }

  try {
    const decodedUrl = decodeURIComponent(url);

    // 验证URL格式
    const parsedUrl = new URL(decodedUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: '不支持的URL协议' }, { status: 400 });
    }

    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `获取资源失败: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType =
      response.headers.get('content-type') || 'application/octet-stream';
    const data = await response.arrayBuffer();

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Media proxy error:', error);
    return NextResponse.json({ error: '代理请求失败' }, { status: 500 });
  }
}
