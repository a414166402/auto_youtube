import { NextRequest, NextResponse } from 'next/server';

// 后端API基础URL
const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_YOUTUBE_API_URL || 'https://api.gamestick4k.com';

/**
 * 媒体代理路由
 * 用于解决外部图片/视频的CORS问题
 *
 * 使用方式: /api/proxy/media?url=<encoded_url>
 * 支持:
 * - 相对路径: /media/youtube/... (会自动拼接后端基础URL)
 * - 完整URL: https://example.com/image.png
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: '缺少url参数' }, { status: 400 });
  }

  try {
    const decodedUrl = decodeURIComponent(url);

    // 构建完整URL
    let targetUrl: string;

    if (decodedUrl.startsWith('/')) {
      // 相对路径，拼接后端基础URL
      targetUrl = `${BACKEND_BASE_URL}${decodedUrl}`;
    } else if (
      decodedUrl.startsWith('http://') ||
      decodedUrl.startsWith('https://')
    ) {
      // 完整URL，直接使用
      targetUrl = decodedUrl;
    } else {
      return NextResponse.json({ error: '不支持的URL格式' }, { status: 400 });
    }

    const response = await fetch(targetUrl, {
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

    // 生成简单的 ETag 基于 URL
    const etag = `"${Buffer.from(targetUrl).toString('base64').slice(0, 32)}"`;

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
        ETag: etag,
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Media proxy error:', error);
    return NextResponse.json({ error: '代理请求失败' }, { status: 500 });
  }
}
