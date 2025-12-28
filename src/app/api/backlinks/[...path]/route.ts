import { NextRequest, NextResponse } from 'next/server';

// 修改FastAPI的URL并添加超时配置
const FASTAPI_URL = 'http://50.114.206.152:8000/api/backlinks';
const FETCH_TIMEOUT = 30000; // 30秒超时

// 创建一个带超时的fetch函数
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// ✅ 正确的类型定义 - 添加 Promise 包装
type RouteParams = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: RouteParams) {
  // ✅ 正确的参数获取方式 - 使用 await
  const { path: pathSegments } = await context.params;

  if (!pathSegments) {
    return NextResponse.json(
      { error: 'Invalid path parameters' },
      { status: 400 }
    );
  }

  const path = pathSegments.join('/');
  const url = new URL(request.url);
  const queryString = url.search;

  try {
    console.log(`Proxying GET request to ${FASTAPI_URL}/${path}${queryString}`);

    const response = await fetchWithTimeout(
      `${FASTAPI_URL}/${path}${queryString}`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      },
      FETCH_TIMEOUT
    );

    if (!response.ok) {
      console.error(`FastAPI returned error status: ${response.status}`);
      return NextResponse.json(
        { error: `API returned status code ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error proxying GET request to ${path}:`, error);

    let errorMessage = 'Failed to fetch data from API';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout';
        statusCode = 504;
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Cannot connect to API server';
        statusCode = 503;
      } else if (error.message.includes('ECONNRESET')) {
        errorMessage = 'Connection was reset by server';
        statusCode = 502;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

export async function POST(request: NextRequest, context: RouteParams) {
  // ✅ 所有方法都需要这样修改
  const { path: pathSegments } = await context.params;

  if (!pathSegments) {
    return NextResponse.json(
      { error: 'Invalid path parameters' },
      { status: 400 }
    );
  }

  const path = pathSegments.join('/');
  const url = new URL(request.url);
  const queryString = url.search;

  try {
    let body = {};
    const contentType = request.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      try {
        body = await request.json();
      } catch (jsonError) {
        console.log('No JSON body or invalid JSON in request');
      }
    }

    console.log(
      `Proxying POST request to ${FASTAPI_URL}/${path}${queryString}`
    );

    const response = await fetchWithTimeout(
      `${FASTAPI_URL}/${path}${queryString}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      },
      FETCH_TIMEOUT
    );

    if (!response.ok) {
      console.error(`FastAPI returned error status: ${response.status}`);
      return NextResponse.json(
        { error: `API returned status code ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error proxying POST request to ${path}:`, error);

    let errorMessage = 'Failed to post data to API';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout';
        statusCode = 504;
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Cannot connect to API server';
        statusCode = 503;
      } else if (error.message.includes('ECONNRESET')) {
        errorMessage = 'Connection was reset by server';
        statusCode = 502;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

// 其他方法 (DELETE, PUT, PATCH) 的完整实现
export async function DELETE(request: NextRequest, context: RouteParams) {
  const { path: pathSegments } = await context.params;

  if (!pathSegments) {
    return NextResponse.json(
      { error: 'Invalid path parameters' },
      { status: 400 }
    );
  }

  const path = pathSegments.join('/');
  const url = new URL(request.url);
  const queryString = url.search;

  try {
    console.log(
      `Proxying DELETE request to ${FASTAPI_URL}/${path}${queryString}`
    );

    const response = await fetchWithTimeout(
      `${FASTAPI_URL}/${path}${queryString}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      },
      FETCH_TIMEOUT
    );

    if (!response.ok) {
      console.error(`FastAPI returned error status: ${response.status}`);
      return NextResponse.json(
        { error: `API returned status code ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error proxying DELETE request to ${path}:`, error);

    let errorMessage = 'Failed to delete data from API';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout';
        statusCode = 504;
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Cannot connect to API server';
        statusCode = 503;
      } else if (error.message.includes('ECONNRESET')) {
        errorMessage = 'Connection was reset by server';
        statusCode = 502;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

export async function PUT(request: NextRequest, context: RouteParams) {
  const { path: pathSegments } = await context.params;

  if (!pathSegments) {
    return NextResponse.json(
      { error: 'Invalid path parameters' },
      { status: 400 }
    );
  }

  const path = pathSegments.join('/');
  const url = new URL(request.url);
  const queryString = url.search;

  try {
    let body = {};
    const contentType = request.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      try {
        body = await request.json();
      } catch (jsonError) {
        console.log('No JSON body or invalid JSON in request');
      }
    }

    console.log(`Proxying PUT request to ${FASTAPI_URL}/${path}${queryString}`);

    const response = await fetchWithTimeout(
      `${FASTAPI_URL}/${path}${queryString}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      },
      FETCH_TIMEOUT
    );

    if (!response.ok) {
      console.error(`FastAPI returned error status: ${response.status}`);
      return NextResponse.json(
        { error: `API returned status code ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error proxying PUT request to ${path}:`, error);

    let errorMessage = 'Failed to update data in API';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout';
        statusCode = 504;
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Cannot connect to API server';
        statusCode = 503;
      } else if (error.message.includes('ECONNRESET')) {
        errorMessage = 'Connection was reset by server';
        statusCode = 502;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  const { path: pathSegments } = await context.params;

  if (!pathSegments) {
    return NextResponse.json(
      { error: 'Invalid path parameters' },
      { status: 400 }
    );
  }

  const path = pathSegments.join('/');
  const url = new URL(request.url);
  const queryString = url.search;

  try {
    let body = {};
    const contentType = request.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      try {
        body = await request.json();
      } catch (jsonError) {
        console.log('No JSON body or invalid JSON in request');
      }
    }

    console.log(
      `Proxying PATCH request to ${FASTAPI_URL}/${path}${queryString}`
    );

    const response = await fetchWithTimeout(
      `${FASTAPI_URL}/${path}${queryString}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      },
      FETCH_TIMEOUT
    );

    if (!response.ok) {
      console.error(`FastAPI returned error status: ${response.status}`);
      return NextResponse.json(
        { error: `API returned status code ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error proxying PATCH request to ${path}:`, error);

    let errorMessage = 'Failed to patch data in API';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout';
        statusCode = 504;
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Cannot connect to API server';
        statusCode = 503;
      } else if (error.message.includes('ECONNRESET')) {
        errorMessage = 'Connection was reset by server';
        statusCode = 502;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
