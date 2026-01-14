/**
 * 爆款库模块 API 客户端
 */

import type {
  ViralVideo,
  ViralVideoListResponse,
  ViralFilterParams,
  CreateViralVideoRequest,
  UpdateViralVideoRequest,
  DownloadMediaResponse,
  CreateProjectFromViralRequest,
  CreateProjectFromViralResponse,
  ViralTag,
  ViralTagListResponse,
  CreateTagRequest,
  UpdateTagRequest
} from '@/types/viral';

const API_BASE = '/api/youtube/viral';

// ============ 爆款视频 CRUD ============

/**
 * 获取爆款视频列表
 */
export async function getViralVideos(
  params: ViralFilterParams = {}
): Promise<ViralVideoListResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', params.page.toString());
  if (params.page_size)
    searchParams.set('page_size', params.page_size.toString());
  if (params.keyword) searchParams.set('keyword', params.keyword);
  if (params.tags && params.tags.length > 0)
    searchParams.set('tags', params.tags.join(','));
  if (params.start_date) searchParams.set('start_date', params.start_date);
  if (params.end_date) searchParams.set('end_date', params.end_date);

  const url = `${API_BASE}?${searchParams.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch viral videos: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 获取爆款视频详情
 */
export async function getViralVideo(id: string): Promise<ViralVideo> {
  const response = await fetch(`${API_BASE}/${id}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch viral video: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 创建爆款视频
 */
export async function createViralVideo(
  data: CreateViralVideoRequest
): Promise<ViralVideo> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`Failed to create viral video: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 更新爆款视频
 */
export async function updateViralVideo(
  id: string,
  data: UpdateViralVideoRequest
): Promise<ViralVideo> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`Failed to update viral video: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 删除爆款视频
 */
export async function deleteViralVideo(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    throw new Error(`Failed to delete viral video: ${response.statusText}`);
  }
}

// ============ 媒体下载 ============

/**
 * 下载媒体到图床
 */
export async function downloadViralMedia(
  id: string
): Promise<DownloadMediaResponse> {
  const response = await fetch(`${API_BASE}/${id}/download-media`, {
    method: 'POST'
  });

  if (!response.ok) {
    throw new Error(`Failed to download media: ${response.statusText}`);
  }

  return response.json();
}

// ============ 创建项目 ============

/**
 * 从爆款库创建项目
 */
export async function createProjectFromViral(
  id: string,
  instruction: string
): Promise<CreateProjectFromViralResponse> {
  const response = await fetch(`${API_BASE}/${id}/create-project`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ instruction } as CreateProjectFromViralRequest)
  });

  if (!response.ok) {
    throw new Error(`Failed to create project: ${response.statusText}`);
  }

  return response.json();
}

// ============ 标签管理 ============

/**
 * 获取所有标签
 */
export async function getViralTags(): Promise<ViralTagListResponse> {
  const response = await fetch(`${API_BASE}/tags`);

  if (!response.ok) {
    throw new Error(`Failed to fetch tags: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 创建标签
 */
export async function createViralTag(
  data: CreateTagRequest
): Promise<ViralTag> {
  const response = await fetch(`${API_BASE}/tags`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`Failed to create tag: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 更新标签
 */
export async function updateViralTag(
  id: string,
  data: UpdateTagRequest
): Promise<ViralTag> {
  const response = await fetch(`${API_BASE}/tags/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`Failed to update tag: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 删除标签
 */
export async function deleteViralTag(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/tags/${id}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    throw new Error(`Failed to delete tag: ${response.statusText}`);
  }
}
