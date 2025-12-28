// Semrush API 相关的客户端函数

// 定义Semrush配置更新接口
export interface SemrushConfigUpdate {
  token?: string;
  uname?: string;
  param?: string;
  key?: string;
  config?: string;
  lang?: string;
  base_url?: string;
}

const API_CONFIG_BASE = '/api/config/semrush';
const API_SEMRUSH_BASE = '/api/semrush';

/**
 * 获取Semrush配置
 */
export async function getSemrushConfig(): Promise<any> {
  const response = await fetch(API_CONFIG_BASE, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('获取Semrush配置失败');
  }

  return response.json();
}

/**
 * 更新Semrush配置
 */
export async function updateSemrushConfig(
  configUpdate: SemrushConfigUpdate
): Promise<any> {
  const response = await fetch(API_CONFIG_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(configUpdate)
  });

  if (!response.ok) {
    throw new Error('更新Semrush配置失败');
  }

  return response.json();
}

/**
 * 测试Semrush连接
 */
export async function testSemrushConnection(): Promise<any> {
  const response = await fetch(`${API_SEMRUSH_BASE}/test`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('测试Semrush连接失败');
  }

  return response.json();
}
