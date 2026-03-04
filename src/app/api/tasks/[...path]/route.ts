import { NextRequest, NextResponse } from 'next/server';

const YOUTUBE_API_BASE_URL =
  process.env.YOUTUBE_API_BASE_URL || 'http://50.114.206.152:8000';
const API_TIMEOUT = 30000; // 30 seconds

async function proxyRequest(
  request: NextRequest,
  path: string[],
  method: string
) {
  const targetPath = path.join('/');
  const targetUrl = `${YOUTUBE_API_BASE_URL}/api/tasks/${targetPath}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    // Forward authorization header if present
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: controller.signal
    };

    // Add body for POST, PUT, PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const body = await request.text();
      if (body) {
        fetchOptions.body = body;
      }
    }

    // Forward query parameters
    const url = new URL(request.url);
    const targetUrlWithParams = new URL(targetUrl);
    url.searchParams.forEach((value, key) => {
      targetUrlWithParams.searchParams.append(key, value);
    });

    const response = await fetch(targetUrlWithParams.toString(), fetchOptions);

    clearTimeout(timeoutId);

    // Handle empty responses (e.g., 204 No Content)
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    // Try to parse as JSON, fallback to text
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else {
      const data = await response.text();
      return new NextResponse(data, {
        status: response.status,
        headers: {
          'Content-Type': contentType
        }
      });
    }
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          {
            error: '请求超时，请稍后重试',
            code: 'TIMEOUT_ERROR',
            timeout: API_TIMEOUT / 1000
          },
          { status: 504 }
        );
      }

      // Handle network errors
      if (
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('fetch failed')
      ) {
        return NextResponse.json(
          {
            error: '无法连接到后端服务，请确保服务已启动',
            code: 'CONNECTION_ERROR',
            message: error.message
          },
          { status: 502 }
        );
      }

      return NextResponse.json(
        {
          error: '服务器连接失败',
          code: 'SERVER_ERROR',
          message: error.message
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        error: '未知错误',
        code: 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}

// 路由参数类型
type RouteParams = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: RouteParams) {
  const { path } = await context.params;
  return proxyRequest(request, path, 'GET');
}

export async function POST(request: NextRequest, context: RouteParams) {
  const { path } = await context.params;
  return proxyRequest(request, path, 'POST');
}

export async function PUT(request: NextRequest, context: RouteParams) {
  const { path } = await context.params;
  return proxyRequest(request, path, 'PUT');
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  const { path } = await context.params;
  return proxyRequest(request, path, 'DELETE');
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  const { path } = await context.params;
  return proxyRequest(request, path, 'PATCH');
}
