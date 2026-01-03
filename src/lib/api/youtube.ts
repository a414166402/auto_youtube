/**
 * YouTube AI视频制作工具 - API客户端
 * 与FastAPI后端接口对接
 */

import type {
  ProjectResponse,
  ProjectListItem,
  PaginatedProjectResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
  GeneratePromptsRequest,
  GeneratePromptsResponse,
  GenerateImageRequest,
  GenerateImageResponse,
  GenerateVideoRequest,
  GenerateVideoResponse,
  Storyboard,
  CharacterMapping,
  StructuredPromptData,
  ProjectStatus
} from '@/types/youtube';
import { mockYoutubeApi, USE_MOCK_DATA } from './youtube-mock';

const API_BASE = '/api/youtube';

/**
 * 通用API请求函数
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || error.detail || error.message || '请求失败');
  }

  return response.json();
}

// ============ 项目管理 API ============

/**
 * 创建项目
 * POST /api/youtube/projects
 */
export async function createProject(
  data: CreateProjectRequest
): Promise<ProjectResponse> {
  if (USE_MOCK_DATA) {
    const result = await mockYoutubeApi.createProject(
      data.name,
      data.youtube_url
    );
    // 转换mock数据格式
    return {
      id: result.id,
      data: {
        name: result.name,
        youtube_url: result.youtube_url,
        status: result.status as ProjectStatus,
        prompt_version: result.prompt_version || null,
        storyboards: []
      },
      created_at: result.created_at,
      updated_at: result.updated_at
    };
  }
  return fetchApi<ProjectResponse>('/projects', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * 获取项目列表
 * GET /api/youtube/projects
 */
export async function getProjects(params?: {
  page?: number;
  page_size?: number;
  status?: string;
}): Promise<PaginatedProjectResponse> {
  if (USE_MOCK_DATA) {
    const result = await mockYoutubeApi.getProjects(
      params?.page,
      params?.page_size
    );
    // 转换mock数据格式
    return {
      items: result.data.map((p) => ({
        id: p.id,
        name: p.name,
        youtube_url: p.youtube_url,
        status: p.status as ProjectStatus,
        storyboard_count: p.innovation_storyboard_count || 0,
        created_at: p.created_at,
        updated_at: p.updated_at
      })),
      total: result.total,
      page: result.page,
      page_size: result.page_size,
      pages: Math.ceil(result.total / result.page_size)
    };
  }

  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.page_size)
    searchParams.set('page_size', params.page_size.toString());
  if (params?.status) searchParams.set('status', params.status);

  const query = searchParams.toString();
  return fetchApi<PaginatedProjectResponse>(
    `/projects${query ? `?${query}` : ''}`
  );
}

/**
 * 获取项目详情
 * GET /api/youtube/projects/{project_id}
 */
export async function getProject(projectId: string): Promise<ProjectResponse> {
  if (USE_MOCK_DATA) {
    const result = await mockYoutubeApi.getProject(projectId);
    return {
      id: result.id,
      data: {
        name: result.name,
        youtube_url: result.youtube_url,
        status: result.status as ProjectStatus,
        prompt_version: result.prompt_version || null,
        storyboards: []
      },
      created_at: result.created_at,
      updated_at: result.updated_at
    };
  }
  return fetchApi<ProjectResponse>(`/projects/${projectId}`);
}

/**
 * 更新项目
 * PUT /api/youtube/projects/{project_id}
 */
export async function updateProject(
  projectId: string,
  data: UpdateProjectRequest
): Promise<ProjectResponse> {
  if (USE_MOCK_DATA) {
    // Mock实现
    const existing = await mockYoutubeApi.getProject(projectId);
    return {
      id: existing.id,
      data: {
        name: data.name || existing.name,
        youtube_url: existing.youtube_url,
        status: existing.status as ProjectStatus,
        prompt_version: existing.prompt_version || null,
        storyboards: (data.storyboards as Storyboard[]) || []
      },
      created_at: existing.created_at,
      updated_at: new Date().toISOString()
    };
  }
  return fetchApi<ProjectResponse>(`/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

/**
 * 删除项目
 * DELETE /api/youtube/projects/{project_id}
 */
export async function deleteProject(
  projectId: string
): Promise<{ success: boolean; message: string }> {
  if (USE_MOCK_DATA) {
    await mockYoutubeApi.deleteProject(projectId);
    return { success: true, message: `项目 ${projectId} 已删除` };
  }
  return fetchApi<{ success: boolean; message: string }>(
    `/projects/${projectId}`,
    {
      method: 'DELETE'
    }
  );
}

// ============ 提示词生成 API ============

/**
 * 生成分镜提示词
 * POST /api/youtube/projects/{project_id}/generate/prompts
 */
export async function generatePrompts(
  projectId: string,
  data?: GeneratePromptsRequest
): Promise<GeneratePromptsResponse> {
  if (USE_MOCK_DATA) {
    const result = await mockYoutubeApi.generatePrompts(projectId, 'v1');
    return {
      success: result.status === 'completed',
      storyboard_count: 5,
      prompt_version: 'v1'
    };
  }
  return fetchApi<GeneratePromptsResponse>(
    `/projects/${projectId}/generate/prompts`,
    {
      method: 'POST',
      body: JSON.stringify(data || {})
    }
  );
}

// ============ 图片生成 API ============

/**
 * 生成单个分镜图片
 * POST /api/youtube/projects/{project_id}/generate/image
 * 根据 character_images 判断生成类型（text_to_image 或 image_text_to_image）
 * 支持多张角色参考图片
 */
export async function generateImage(
  projectId: string,
  data: GenerateImageRequest
): Promise<GenerateImageResponse> {
  if (USE_MOCK_DATA) {
    return {
      success: true,
      storyboard_index: data.storyboard_index,
      image: {
        url: `https://picsum.photos/seed/${Date.now()}/512/512`,
        generation_type: data.character_images?.length
          ? 'image_text_to_image'
          : 'text_to_image'
      },
      image_index: 0
    };
  }
  return fetchApi<GenerateImageResponse>(
    `/projects/${projectId}/generate/image`,
    {
      method: 'POST',
      body: JSON.stringify(data)
    }
  );
}

/**
 * 批量生成所有分镜图片
 * @param characterImages 角色参考图片数组（支持base64或URL）
 */
export async function generateAllImages(
  projectId: string,
  storyboardIndices: number[],
  characterImages?: string[]
): Promise<GenerateImageResponse[]> {
  const results: GenerateImageResponse[] = [];

  for (const index of storyboardIndices) {
    try {
      const result = await generateImage(projectId, {
        storyboard_index: index,
        character_images: characterImages
      });
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        storyboard_index: index,
        error: error instanceof Error ? error.message : '生成失败'
      });
    }
  }

  return results;
}

// ============ 视频生成 API ============

/**
 * 生成单个分镜视频
 * POST /api/youtube/projects/{project_id}/generate/video
 */
export async function generateVideo(
  projectId: string,
  data: GenerateVideoRequest
): Promise<GenerateVideoResponse> {
  if (USE_MOCK_DATA) {
    return {
      success: true,
      storyboard_index: data.storyboard_index,
      video: {
        url: `https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4`,
        source_image_index: 0
      },
      video_index: 0
    };
  }
  return fetchApi<GenerateVideoResponse>(
    `/projects/${projectId}/generate/video`,
    {
      method: 'POST',
      body: JSON.stringify(data)
    }
  );
}

/**
 * 批量生成所有分镜视频
 */
export async function generateAllVideos(
  projectId: string,
  storyboardIndices: number[]
): Promise<GenerateVideoResponse[]> {
  const results: GenerateVideoResponse[] = [];

  for (const index of storyboardIndices) {
    try {
      const result = await generateVideo(projectId, {
        storyboard_index: index
      });
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        storyboard_index: index,
        error: error instanceof Error ? error.message : '生成失败'
      });
    }
  }

  return results;
}

// ============ 分镜管理 API ============

/**
 * 更新单个分镜（选择图片/视频、编辑提示词）
 */
export async function updateStoryboard(
  projectId: string,
  storyboardIndex: number,
  updates: Partial<Storyboard>
): Promise<ProjectResponse> {
  // 先获取项目详情
  const project = await getProject(projectId);

  // 更新指定分镜
  const storyboards = [...project.data.storyboards];
  if (storyboardIndex < storyboards.length) {
    storyboards[storyboardIndex] = {
      ...storyboards[storyboardIndex],
      ...updates
    };
  }

  // 调用更新接口
  return updateProject(projectId, { storyboards });
}

/**
 * 选择分镜图片
 */
export async function selectStoryboardImage(
  projectId: string,
  storyboardIndex: number,
  imageIndex: number
): Promise<ProjectResponse> {
  return updateStoryboard(projectId, storyboardIndex, {
    selected_image_index: imageIndex
  });
}

/**
 * 选择分镜视频
 */
export async function selectStoryboardVideo(
  projectId: string,
  storyboardIndex: number,
  videoIndex: number
): Promise<ProjectResponse> {
  return updateStoryboard(projectId, storyboardIndex, {
    selected_video_index: videoIndex
  });
}

/**
 * 更新分镜提示词
 */
export async function updateStoryboardPrompts(
  projectId: string,
  storyboardIndex: number,
  textToImage: string,
  imageToVideo: string
): Promise<ProjectResponse> {
  return updateStoryboard(projectId, storyboardIndex, {
    text_to_image: textToImage,
    image_to_video: imageToVideo,
    is_prompt_edited: true
  });
}

/**
 * 更新分镜角色引用
 */
export async function updateStoryboardCharacterRefs(
  projectId: string,
  storyboardIndex: number,
  characterRefs: string[]
): Promise<ProjectResponse> {
  return updateStoryboard(projectId, storyboardIndex, {
    character_refs: characterRefs
  });
}

// ============ 角色映射 API（前端本地管理）============

/**
 * 获取角色映射配置
 * 从localStorage读取
 */
export function getCharacterMappings(projectId: string): CharacterMapping[] {
  if (typeof window === 'undefined') return [];

  const key = `youtube_characters_${projectId}`;
  const stored = localStorage.getItem(key);

  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  // 返回默认角色映射
  return [
    { id: '1', identifier: 'A', name: '', reference_image_url: '' },
    { id: '2', identifier: 'B', name: '', reference_image_url: '' },
    { id: '3', identifier: 'C', name: '', reference_image_url: '' },
    { id: '4', identifier: 'D', name: '', reference_image_url: '' }
  ];
}

/**
 * 保存角色映射配置
 * 保存到localStorage
 */
export function saveCharacterMappings(
  projectId: string,
  mappings: CharacterMapping[]
): void {
  if (typeof window === 'undefined') return;

  const key = `youtube_characters_${projectId}`;
  localStorage.setItem(key, JSON.stringify(mappings));
}

/**
 * 上传角色参考图片
 * 返回图片URL（实际项目中应上传到服务器）
 */
export async function uploadCharacterImage(
  _projectId: string,
  _identifier: string,
  file: File
): Promise<string> {
  // 简单实现：转换为base64 URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============ 导出功能 ============

/**
 * 导出结构化提示词JSON
 */
export async function exportPrompts(
  projectId: string
): Promise<StructuredPromptData> {
  const project = await getProject(projectId);
  const characterMappings = getCharacterMappings(projectId);

  return {
    project_id: project.id,
    project_name: project.data.name,
    total_storyboards: project.data.storyboards.length,
    character_mappings: characterMappings,
    prompts: project.data.storyboards.map((sb) => {
      const characterImages: { [key: string]: string } = {};

      // 填充角色图片映射
      if (sb.character_refs) {
        for (const ref of sb.character_refs) {
          const mapping = characterMappings.find((m) => m.identifier === ref);
          if (mapping?.reference_image_url) {
            characterImages[ref] = mapping.reference_image_url;
          }
        }
      }

      return {
        storyboard_index: sb.index,
        text_to_image: sb.text_to_image,
        image_to_video: sb.image_to_video,
        character_refs: sb.character_refs || [],
        character_images: characterImages
      };
    })
  };
}

/**
 * 下载JSON文件
 */
export function downloadJson(data: object, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============ 工具函数 ============

/**
 * 获取项目状态显示文本
 */
export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    created: '已创建',
    prompts_ready: '提示词就绪',
    images_partial: '图片生成中',
    images_ready: '图片就绪',
    videos_partial: '视频生成中',
    completed: '已完成',
    failed: '失败'
  };
  return statusMap[status] || status;
}

/**
 * 获取项目状态颜色
 */
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    created: 'bg-gray-500',
    prompts_ready: 'bg-blue-500',
    images_partial: 'bg-yellow-500',
    images_ready: 'bg-green-500',
    videos_partial: 'bg-orange-500',
    completed: 'bg-emerald-500',
    failed: 'bg-red-500'
  };
  return colorMap[status] || 'bg-gray-500';
}

/**
 * 检查是否可以生成图片
 */
export function canGenerateImages(project: ProjectResponse): boolean {
  return (
    project.data.status !== 'created' && project.data.storyboards.length > 0
  );
}

/**
 * 检查是否可以生成视频
 */
export function canGenerateVideos(project: ProjectResponse): boolean {
  if (project.data.storyboards.length === 0) return false;

  // 检查所有分镜是否都有选中的图片
  return project.data.storyboards.every(
    (sb) => sb.images.length > 0 && sb.selected_image_index !== null
  );
}

/**
 * 获取项目完成进度
 */
export function getProjectProgress(project: ProjectResponse): {
  promptsReady: boolean;
  imagesProgress: number;
  videosProgress: number;
} {
  const storyboards = project.data.storyboards;
  const total = storyboards.length;

  if (total === 0) {
    return {
      promptsReady: false,
      imagesProgress: 0,
      videosProgress: 0
    };
  }

  const withImages = storyboards.filter(
    (sb) => sb.selected_image_index !== null
  ).length;
  const withVideos = storyboards.filter(
    (sb) => sb.selected_video_index !== null
  ).length;

  return {
    promptsReady: project.data.status !== 'created',
    imagesProgress: Math.round((withImages / total) * 100),
    videosProgress: Math.round((withVideos / total) * 100)
  };
}
