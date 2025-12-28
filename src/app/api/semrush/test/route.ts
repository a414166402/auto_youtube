import { NextRequest, NextResponse } from 'next/server';

// FastAPI服务器地址配置
const FASTAPI_URL = 'http://50.114.206.152:8000/api';
const FETCH_TIMEOUT = 30000; // 30秒超时

// 带超时的fetch函数
const fetchWithTimeout = (
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> => {
  return new Promise((resolve, reject) => {
    // 创建AbortController用于超时处理
    const controller = new AbortController();
    const { signal } = controller;

    // 设置超时定时器
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error('Request timeout'));
    }, timeout);

    // 添加signal到options
    const fetchOptions = { ...options, signal };

    fetch(url, fetchOptions)
      .then((response) => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
};

// GET 测试Semrush连接
export async function GET(request: NextRequest) {
  try {
    console.log(`Proxying GET request to ${FASTAPI_URL}/semrush/test`);

    const response = await fetchWithTimeout(
      `${FASTAPI_URL}/semrush/test`,
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
    console.error(`Error proxying GET request to /semrush/test:`, error);

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
