import { NextRequest, NextResponse } from 'next/server';

const YOUTUBE_API_BASE_URL =
  process.env.YOUTUBE_API_BASE_URL || 'http://50.114.206.152:8000/api/youtube';
const API_TIMEOUT = 30000; // 30 seconds
const LONG_RUNNING_TIMEOUT = 120000; // 2 minutes for long-running operations

// Paths that may take longer (video download, generation tasks)
const LONG_RUNNING_PATHS = [
  'download',
  'generate',
  'parse',
  'regenerate',
  'structure'
];

function getTimeout(path: string[]): number {
  const pathStr = path.join('/').toLowerCase();
  for (const longPath of LONG_RUNNING_PATHS) {
    if (pathStr.includes(longPath)) {
      return LONG_RUNNING_TIMEOUT;
    }
  }
  return API_TIMEOUT;
}

function isMultipartRequest(request: NextRequest): boolean {
  const contentType = request.headers.get('content-type') || '';
  return contentType.includes('multipart/form-data');
}

async function proxyRequest(
  request: NextRequest,
  path: string[],
  method: string
) {
  const targetPath = path.join('/');
  const targetUrl = `${YOUTUBE_API_BASE_URL}/${targetPath}`;

  const timeout = getTimeout(path);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const headers: HeadersInit = {};
    const isMultipart = isMultipartRequest(request);

    // Don't set Content-Type for multipart requests (browser will set it with boundary)
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }

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
      if (isMultipart) {
        // For multipart/form-data, pass the body as-is
        fetchOptions.body = await request.arrayBuffer();
        // Copy the content-type header with boundary
        const contentType = request.headers.get('content-type');
        if (contentType) {
          headers['Content-Type'] = contentType;
        }
      } else {
        const body = await request.text();
        if (body) {
          fetchOptions.body = body;
        }
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
      // For non-JSON responses (e.g., file downloads)
      const data = await response.arrayBuffer();
      return new NextResponse(data, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition':
            response.headers.get('content-disposition') || ''
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
            timeout: timeout / 1000
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
