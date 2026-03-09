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
  ProjectStatus,
  MediaStatsResponse,
  MediaCleanupResponse,
  MediaCleanupType,
  // V2 新增类型
  SubjectType,
  Subject,
  SubjectListResponse,
  PromptHistoryListResponse,
  ContinuePromptsRequest,
  ContinuePromptsResponse,
  RegeneratePromptsFromVersionRequest,
  RegeneratePromptsFromVersionResponse,
  SwitchVersionRequest,
  SwitchVersionResponse,
  CopyProjectRequest,
  CopyProjectResponse,
  DeleteStoryboardResponse,
  AddStoryboardRequest,
  AddStoryboardResponse,
  SwapStoryboardsRequest,
  SwapStoryboardsResponse,
  AspectRatio
} from '@/types/youtube';
import { mockYoutubeApi, USE_MOCK_DATA } from './youtube-mock';

const API_BASE = '/api/youtube';

// 图片上传大小限制（5MB）
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// ============ 409 冲突错误处理 ============

/**
 * 并发冲突错误类
 * 当后端返回 HTTP 409 时抛出此错误
 */
export class ConflictError extends Error {
  public readonly status = 409;
  public readonly detail: string;

  constructor(message: string, detail?: string) {
    super(message);
    this.name = 'ConflictError';
    this.detail = detail || message;
  }
}

/**
 * 检查是否为冲突错误
 */
export function isConflictError(error: unknown): error is ConflictError {
  return error instanceof ConflictError;
}

/**
 * 通用API请求函数
 * 支持 409 冲突错误检测
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

    // 检测 409 冲突错误
    if (response.status === 409) {
      throw new ConflictError(
        '数据已被修改，请刷新页面后重试',
        error.detail || error.error || error.message
      );
    }

    throw new Error(error.error || error.detail || error.message || '请求失败');
  }

  return response.json();
}

/**
 * FormData API请求函数（用于文件上传）
 * 支持 409 冲突错误检测
 */
async function fetchApiFormData<T>(
  endpoint: string,
  formData: FormData,
  method: 'POST' | 'PUT' = 'POST'
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    body: formData
    // 不设置 Content-Type，让浏览器自动设置 multipart/form-data
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));

    // 检测 409 冲突错误
    if (response.status === 409) {
      throw new ConflictError(
        '数据已被修改，请刷新页面后重试',
        error.detail || error.error || error.message
      );
    }

    throw new Error(error.error || error.detail || error.message || '请求失败');
  }

  return response.json();
}

/**
 * 验证图片文件大小
 */
export function validateImageSize(file: File): boolean {
  return file.size <= MAX_IMAGE_SIZE;
}

/**
 * 获取图片大小限制的友好显示文本
 */
export function getMaxImageSizeText(): string {
  return `${MAX_IMAGE_SIZE / 1024 / 1024}MB`;
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
      data.youtube_url || ''
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
 * @param projectId 项目ID
 * @param options.fullHistory 是否获取完整提示词历史（默认false，只返回当前版本历史）
 */
export async function getProject(
  projectId: string,
  options?: { fullHistory?: boolean }
): Promise<ProjectResponse> {
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
  const queryParams = options?.fullHistory ? '?full_history=true' : '';
  return fetchApi<ProjectResponse>(`/projects/${projectId}${queryParams}`);
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

// ============ 异步任务队列 API ============

/**
 * 任务状态类型
 */
export type TaskStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * 任务信息接口
 */
export interface TaskInfo {
  task_id: string;
  module_name: string;
  task_type: string;
  status: TaskStatus;
  progress: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  has_result: boolean;
}

/**
 * 批量任务状态查询响应
 */
export interface BatchTaskStatusResponse {
  success: boolean;
  tasks: TaskInfo[];
  not_found: string[];
}

/**
 * 创建图片生成任务
 * POST /api/tasks/create
 */
export async function createImageTask(
  projectId: string,
  storyboardIndex: number,
  prompt: string,
  options: {
    characterImages?: string[];
    aspectRatio?: string;
    aiChannel?: string;
    subjectMappings?: Record<string, string>;
    refIndexes?: number[];
  } = {}
): Promise<string> {
  const response = await fetch('/api/tasks/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      module_name: 'image_generation',
      task_type: 'generate_storyboard_image',
      execution_mode: 'sequential',
      data: {
        project_id: projectId,
        storyboard_index: storyboardIndex,
        prompt: prompt,
        character_images: options.characterImages || [],
        aspect_ratio: options.aspectRatio || '9:16',
        ai_channel: options.aiChannel || 'business',
        subject_mappings: options.subjectMappings || {},
        ref_storyboard_indexes: options.refIndexes || []
      }
    })
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: '任务创建失败' }));

    // 409错误特殊处理
    if (response.status === 409) {
      throw new ConflictError('模块正在执行任务，请稍后重试', error.detail);
    }

    throw new Error(error.detail || '任务创建失败');
  }

  const result = await response.json();
  return result.task_id;
}

/**
 * 创建视频生成任务
 * POST /api/tasks/create
 */
export async function createVideoTask(
  projectId: string,
  storyboardIndex: number,
  imageData: string,
  prompt: string,
  options: {
    subjectMappings?: Record<string, string>;
    sourceImageIndex?: number;
  } = {}
): Promise<string> {
  const response = await fetch('/api/tasks/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      module_name: 'video_generation',
      task_type: 'generate_storyboard_video',
      execution_mode: 'sequential',
      data: {
        project_id: projectId,
        storyboard_index: storyboardIndex,
        image_data: imageData,
        prompt: prompt,
        subject_mappings: options.subjectMappings || {},
        source_image_index: options.sourceImageIndex
      }
    })
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: '任务创建失败' }));

    // 409错误特殊处理
    if (response.status === 409) {
      throw new ConflictError('模块正在执行任务，请稍后重试', error.detail);
    }

    throw new Error(error.detail || '任务创建失败');
  }

  const result = await response.json();
  return result.task_id;
}

/**
 * 批量查询任务状态
 * POST /api/tasks/batch-status
 */
export async function getBatchTaskStatus(
  taskIds: string[]
): Promise<BatchTaskStatusResponse> {
  if (taskIds.length === 0) {
    return { success: true, tasks: [], not_found: [] };
  }

  if (taskIds.length > 100) {
    throw new Error('批量查询最多支持100个任务');
  }

  const response = await fetch('/api/tasks/batch-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_ids: taskIds })
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: '批量查询失败' }));
    throw new Error(error.error || '批量查询失败');
  }

  return response.json();
}

/**
 * 获取项目的所有生成任务
 * GET /api/youtube/projects/{project_id}/generation-tasks
 */
export async function getProjectTasks(
  projectId: string,
  params?: {
    taskType?: string;
    status?: TaskStatus;
    limit?: number;
    offset?: number;
  }
): Promise<{
  project_id: string;
  tasks: TaskInfo[];
  total: number;
  limit: number;
  offset: number;
}> {
  const searchParams = new URLSearchParams();
  if (params?.taskType) searchParams.set('task_type', params.taskType);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());

  const query = searchParams.toString();
  return fetchApi(
    `/projects/${projectId}/generation-tasks${query ? `?${query}` : ''}`
  );
}

/**
 * 查询模块状态
 * GET /api/tasks/modules/{module_name}/status
 */
export async function getModuleStatus(
  moduleName: 'image_generation' | 'video_generation'
): Promise<{
  status: string;
  queue_processing: boolean;
  queue_size: number;
  message: string;
  module_name: string;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  pending_tasks: number;
  running_tasks: number;
  completion_percentage: number;
  automation_info: {
    is_busy: boolean;
    can_add_new_tasks: boolean;
    auto_reset_enabled: boolean;
  };
}> {
  const response = await fetch(`/api/tasks/modules/${moduleName}/status`);

  if (!response.ok) {
    throw new Error('查询模块状态失败');
  }

  return response.json();
}

// ============ 视频生成 API（已废弃 - 使用异步任务接口）============

// 注意：以下同步接口已废弃，请使用 createVideoTask() 异步接口

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

// ============ 媒体管理 API ============

/**
 * 获取项目媒体统计信息
 * GET /api/youtube/projects/{project_id}/media/stats
 */
export async function getMediaStats(
  projectId: string
): Promise<MediaStatsResponse> {
  if (USE_MOCK_DATA) {
    // Mock实现
    return {
      project_id: projectId,
      images: {
        total_count: 10,
        selected_count: 5,
        unselected_count: 5,
        total_size: '15.2 MB',
        total_bytes: 15938560
      },
      videos: {
        total_count: 5,
        selected_count: 3,
        unselected_count: 2,
        total_size: '45.8 MB',
        total_bytes: 48023552
      },
      total_size: '61.0 MB',
      total_bytes: 63962112
    };
  }
  return fetchApi<MediaStatsResponse>(`/projects/${projectId}/media/stats`);
}

/**
 * 清理项目中未选中的媒体文件
 * POST /api/youtube/projects/{project_id}/media/cleanup
 */
export async function cleanupMedia(
  projectId: string,
  mediaType: MediaCleanupType = 'all'
): Promise<MediaCleanupResponse> {
  if (USE_MOCK_DATA) {
    // Mock实现
    return {
      success: true,
      deleted_images: mediaType === 'videos' ? 0 : 5,
      deleted_videos: mediaType === 'images' ? 0 : 2,
      freed_size: '25.3 MB',
      freed_bytes: 26542080,
      errors: []
    };
  }
  return fetchApi<MediaCleanupResponse>(
    `/projects/${projectId}/media/cleanup?media_type=${mediaType}`,
    {
      method: 'POST'
    }
  );
}

// ============ V2 新增：全局主体库 API ============

/**
 * 获取全局主体列表
 * GET /api/youtube/subjects?type=character
 */
export async function getSubjects(
  type?: SubjectType
): Promise<SubjectListResponse> {
  const params = type ? `?type=${type}` : '';
  return fetchApi<SubjectListResponse>(`/subjects${params}`);
}

/**
 * 创建主体
 * POST /api/youtube/subjects
 * @param type 主体类型
 * @param name 名称（可选）
 * @param description 描述（可选）
 * @param image 图片文件（可选）
 */
export async function createSubject(
  type: SubjectType,
  name?: string,
  description?: string,
  image?: File
): Promise<Subject> {
  const formData = new FormData();
  formData.append('type', type);
  if (name) formData.append('name', name);
  if (description) formData.append('description', description);
  if (image) {
    if (!validateImageSize(image)) {
      throw new Error(`图片大小不能超过 ${getMaxImageSizeText()}`);
    }
    formData.append('image', image);
  }
  return fetchApiFormData<Subject>('/subjects', formData, 'POST');
}

/**
 * 更新主体
 * PUT /api/youtube/subjects/{id}
 * @param id 主体UUID
 * @param name 名称（可选）
 * @param description 描述（可选，传空字符串可清空）
 * @param image 新图片文件（可选）
 * @param removeImage 是否删除图片
 */
export async function updateSubject(
  id: string,
  name?: string,
  description?: string,
  image?: File,
  removeImage?: boolean
): Promise<Subject> {
  const formData = new FormData();
  if (name !== undefined) formData.append('name', name);
  if (description !== undefined) {
    // 传空字符串表示清空描述
    formData.append('description', description);
  }
  if (removeImage) formData.append('remove_image', 'true');
  if (image) {
    if (!validateImageSize(image)) {
      throw new Error(`图片大小不能超过 ${getMaxImageSizeText()}`);
    }
    formData.append('image', image);
  }
  return fetchApiFormData<Subject>(`/subjects/${id}`, formData, 'PUT');
}

/**
 * 删除主体
 * DELETE /api/youtube/subjects/{id}
 * 后端返回简单字符串消息
 */
export async function deleteSubject(id: string): Promise<string> {
  return fetchApi<string>(`/subjects/${id}`, {
    method: 'DELETE'
  });
}

// ============ V2 新增：提示词版本管理 API ============

/**
 * 获取提示词历史版本列表
 * GET /api/youtube/projects/{project_id}/prompt-history
 */
export async function getPromptHistory(
  projectId: string
): Promise<PromptHistoryListResponse> {
  return fetchApi<PromptHistoryListResponse>(
    `/projects/${projectId}/prompt-history`
  );
}

/**
 * 继续对话生成提示词
 * POST /api/youtube/projects/{project_id}/generate/prompts/continue
 */
export async function continuePrompts(
  projectId: string,
  data: ContinuePromptsRequest
): Promise<ContinuePromptsResponse> {
  return fetchApi<ContinuePromptsResponse>(
    `/projects/${projectId}/generate/prompts/continue`,
    {
      method: 'POST',
      body: JSON.stringify(data)
    }
  );
}

/**
 * 从历史版本重新生成提示词
 * POST /api/youtube/projects/{project_id}/generate/prompts/regenerate
 */
export async function regeneratePromptsFromVersion(
  projectId: string,
  data: RegeneratePromptsFromVersionRequest
): Promise<RegeneratePromptsFromVersionResponse> {
  return fetchApi<RegeneratePromptsFromVersionResponse>(
    `/projects/${projectId}/generate/prompts/regenerate`,
    {
      method: 'POST',
      body: JSON.stringify(data)
    }
  );
}

/**
 * 切换提示词版本
 * PUT /api/youtube/projects/{project_id}/prompt-version
 * 后端返回简单字符串消息
 */
export async function switchPromptVersion(
  projectId: string,
  data: SwitchVersionRequest
): Promise<{ success: boolean; message: string }> {
  const message = await fetchApi<string>(
    `/projects/${projectId}/prompt-version`,
    {
      method: 'PUT',
      body: JSON.stringify(data)
    }
  );
  return { success: true, message };
}

// ============ V2 新增：项目复制 API ============

/**
 * 复制项目
 * POST /api/youtube/projects/{project_id}/copy
 */
export async function copyProject(
  projectId: string,
  data: CopyProjectRequest
): Promise<CopyProjectResponse> {
  return fetchApi<CopyProjectResponse>(`/projects/${projectId}/copy`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// ============ V2 新增：分镜管理 API ============

/**
 * 删除分镜
 * DELETE /api/youtube/projects/{project_id}/storyboards/{index}
 */
export async function deleteStoryboardByIndex(
  projectId: string,
  index: number
): Promise<DeleteStoryboardResponse> {
  return fetchApi<DeleteStoryboardResponse>(
    `/projects/${projectId}/storyboards/${index}`,
    {
      method: 'DELETE'
    }
  );
}

/**
 * 新增分镜
 * POST /api/youtube/projects/{project_id}/storyboards
 */
export async function addStoryboard(
  projectId: string,
  data: AddStoryboardRequest
): Promise<AddStoryboardResponse> {
  return fetchApi<AddStoryboardResponse>(`/projects/${projectId}/storyboards`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * 交换分镜位置
 * PUT /api/youtube/projects/{project_id}/storyboards/swap
 */
export async function swapStoryboards(
  projectId: string,
  data: SwapStoryboardsRequest
): Promise<SwapStoryboardsResponse> {
  return fetchApi<SwapStoryboardsResponse>(
    `/projects/${projectId}/storyboards/swap`,
    {
      method: 'PUT',
      body: JSON.stringify(data)
    }
  );
}

// ============ V2 新增：项目比例设置 ============

/**
 * 更新项目图片比例
 */
export async function updateProjectAspectRatio(
  projectId: string,
  aspectRatio: AspectRatio
): Promise<ProjectResponse> {
  return updateProject(projectId, { aspect_ratio: aspectRatio });
}

/**
 * 更新项目主体映射
 */
export async function updateProjectSubjectMappings(
  projectId: string,
  subjectMappings: Record<string, string>
): Promise<ProjectResponse> {
  return updateProject(projectId, { subject_mappings: subjectMappings });
}
