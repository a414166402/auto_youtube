import {
  BacklinkRecord,
  BacklinkTask,
  BacklinkTaskCreate,
  BacklinkTypeUpdate,
  AutomationJsonUpload,
  AutomationPreviewResponse,
  FetchBacklinksParams,
  ListBacklinksParams,
  ListTasksParams,
  RescheduleRequest
} from '@/types/backlinks';

// 使用相对路径，API请求将由Next.js通过API路由代理到FastAPI服务器
// 这样可以避免浏览器直接调用外部API时遇到的CORS问题
const API_BASE = '/api/backlinks';

export async function fetchBacklinks(
  params: FetchBacklinksParams
): Promise<any> {
  const response = await fetch(
    `${API_BASE}/fetch?url=${encodeURIComponent(params.url)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch backlinks');
  }

  return response.json();
}

export async function listBacklinks(params: ListBacklinksParams): Promise<any> {
  const queryParams = new URLSearchParams();

  // Add required parameters
  queryParams.append('domain', params.domain);

  // Add optional parameters
  if (params.iframe_exclude !== undefined)
    queryParams.append('iframe_exclude', params.iframe_exclude.toString());
  if (params.start_date) queryParams.append('start_date', params.start_date);
  if (params.end_date) queryParams.append('end_date', params.end_date);
  if (params.only_dofollow !== undefined)
    queryParams.append('only_dofollow', params.only_dofollow.toString());
  if (params.min_weight !== undefined)
    queryParams.append('min_weight', params.min_weight.toString());
  if (params.max_weight !== undefined)
    queryParams.append('max_weight', params.max_weight.toString());
  if (params.only_automation !== undefined)
    queryParams.append('only_automation', params.only_automation.toString());
  if (params.type_filter) queryParams.append('type_filter', params.type_filter);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.page_size)
    queryParams.append('page_size', params.page_size.toString());
  if (params.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params.tree_format !== undefined)
    queryParams.append('tree_format', params.tree_format.toString());
  if (params.collapse_by) queryParams.append('collapse_by', params.collapse_by);

  const response = await fetch(`${API_BASE}/list?${queryParams.toString()}`, {
    method: 'GET'
  });

  if (!response.ok) {
    throw new Error('Failed to list backlinks');
  }

  return response.json();
}

export async function createBacklinkTask(
  task: BacklinkTaskCreate
): Promise<any> {
  const response = await fetch(`${API_BASE}/task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(task)
  });

  if (!response.ok) {
    throw new Error('Failed to create backlink task');
  }

  return response.json();
}

export async function getTaskStatus(taskId: number): Promise<any> {
  const response = await fetch(`${API_BASE}/task/status?task_id=${taskId}`, {
    method: 'GET'
  });

  if (!response.ok) {
    throw new Error('Failed to get task status');
  }

  return response.json();
}

export async function rescheduleTask(
  taskId: number,
  newTime: RescheduleRequest
): Promise<any> {
  const response = await fetch(`${API_BASE}/task/${taskId}/reschedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newTime)
  });

  if (!response.ok) {
    throw new Error('Failed to reschedule task');
  }

  return response.json();
}

export async function listBacklinkTasks(
  params?: ListTasksParams
): Promise<any> {
  const queryParams = new URLSearchParams();

  if (params?.status) queryParams.append('status', params.status);
  if (params?.user_id) queryParams.append('user_id', params.user_id.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const response = await fetch(
    `${API_BASE}/tasks${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
    {
      method: 'GET'
    }
  );

  if (!response.ok) {
    throw new Error('Failed to list backlink tasks');
  }

  return response.json();
}

export async function deleteBacklinkTask(taskId: number): Promise<any> {
  const response = await fetch(`${API_BASE}/task/${taskId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    throw new Error('Failed to delete backlink task');
  }

  return response.json();
}

export async function setBacklinkType(
  update: BacklinkTypeUpdate
): Promise<any> {
  const response = await fetch(`${API_BASE}/type`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(update)
  });

  if (!response.ok) {
    throw new Error('Failed to set backlink type');
  }

  return response.json();
}

export async function uploadAutomationJson(
  data: AutomationJsonUpload
): Promise<any> {
  const response = await fetch(`${API_BASE}/automation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error('Failed to upload automation JSON');
  }

  return response.json();
}

export async function previewAutomationTemplate(
  backlinkUrl: string
): Promise<AutomationPreviewResponse> {
  const response = await fetch(
    `${API_BASE}/automation/preview?backlink_url=${encodeURIComponent(backlinkUrl)}`,
    {
      method: 'GET'
    }
  );

  if (!response.ok) {
    throw new Error('Failed to preview automation template');
  }

  return response.json();
}

export async function getAllAutomationConfigs(): Promise<any> {
  const response = await fetch(`${API_BASE}/automation/all`, {
    method: 'GET'
  });

  if (!response.ok) {
    throw new Error('获取自动化配置列表失败');
  }

  return response.json();
}

export async function getAllBacklinkDomains(): Promise<any> {
  const response = await fetch(`${API_BASE}/domains`, {
    method: 'GET'
  });

  if (!response.ok) {
    throw new Error('获取反向链接域名列表失败');
  }

  return response.json();
}

export async function createTaskFromAutomation(
  task: BacklinkTaskCreate
): Promise<any> {
  const response = await fetch(`${API_BASE}/automation/create-task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(task)
  });

  if (!response.ok) {
    throw new Error('Failed to create task from automation');
  }

  return response.json();
}

export async function getAutomationReadyUrls(
  domain: string
): Promise<{ domain: string; count: number; urls: string[] }> {
  const response = await fetch(
    `${API_BASE}/automation-ready?domain=${encodeURIComponent(domain)}`,
    {
      method: 'GET'
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get automation ready URLs');
  }

  return response.json();
}

export interface GenerateAutomationJsonParams {
  backlink_url: string;
  curl_command: string;
}

export async function generateAutomationJson(
  params: GenerateAutomationJsonParams
): Promise<any> {
  const response = await fetch(`${API_BASE}/generate-automation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    throw new Error('Failed to generate automation JSON');
  }

  return response.json();
}
