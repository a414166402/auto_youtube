import type {
  VideoProject,
  Storyboard,
  Prompt,
  CharacterMapping,
  GeneratedImage,
  GeneratedVideo,
  GenerationTask,
  StructuredPromptData,
  PaginatedResponse,
  TaskResponse,
  DownloadResponse,
  CreateProjectRequest,
  UpdateStoryboardRequest,
  GeneratePromptsRequest,
  RegeneratePromptRequest,
  UpdateCharacterMappingsRequest,
  BatchGenerateRequest
} from '@/types/youtube';
import { mockYoutubeApi, USE_MOCK_DATA } from './youtube-mock';

const API_BASE = '/api/youtube';

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
    throw new Error(error.error || error.message || '请求失败');
  }

  return response.json();
}

// ============ 项目管理 API ============

export async function createProject(
  data: CreateProjectRequest
): Promise<VideoProject> {
  if (USE_MOCK_DATA) {
    return mockYoutubeApi.createProject(data.name, data.youtube_url);
  }
  return fetchApi<VideoProject>('/projects', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function getProjects(params?: {
  page?: number;
  page_size?: number;
  status?: string;
}): Promise<PaginatedResponse<VideoProject>> {
  if (USE_MOCK_DATA) {
    return mockYoutubeApi.getProjects(params?.page, params?.page_size);
  }
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.page_size)
    searchParams.set('page_size', params.page_size.toString());
  if (params?.status) searchParams.set('status', params.status);

  const query = searchParams.toString();
  return fetchApi<PaginatedResponse<VideoProject>>(
    `/projects${query ? `?${query}` : ''}`
  );
}

export async function getProject(projectId: string): Promise<VideoProject> {
  if (USE_MOCK_DATA) {
    return mockYoutubeApi.getProject(projectId);
  }
  return fetchApi<VideoProject>(`/projects/${projectId}`);
}

export async function updateProject(
  projectId: string,
  data: Partial<VideoProject>
): Promise<VideoProject> {
  return fetchApi<VideoProject>(`/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteProject(projectId: string): Promise<void> {
  if (USE_MOCK_DATA) {
    await mockYoutubeApi.deleteProject(projectId);
    return;
  }
  return fetchApi<void>(`/projects/${projectId}`, {
    method: 'DELETE'
  });
}

// ============ 视频下载 API ============

export async function startDownload(projectId: string): Promise<TaskResponse> {
  if (USE_MOCK_DATA) {
    return mockYoutubeApi.startDownload(projectId);
  }
  return fetchApi<TaskResponse>(`/projects/${projectId}/download`, {
    method: 'POST'
  });
}

export async function getDownloadStatus(
  projectId: string
): Promise<GenerationTask> {
  if (USE_MOCK_DATA) {
    return mockYoutubeApi.getTaskStatus(`download_${projectId}`);
  }
  return fetchApi<GenerationTask>(`/projects/${projectId}/download/status`);
}

// ============ 分镜管理 API ============

export async function parseStoryboards(
  projectId: string
): Promise<TaskResponse> {
  return fetchApi<TaskResponse>(`/projects/${projectId}/storyboards/parse`, {
    method: 'POST'
  });
}

export async function getStoryboards(
  projectId: string
): Promise<PaginatedResponse<Storyboard>> {
  if (USE_MOCK_DATA) {
    return mockYoutubeApi.getStoryboards(projectId);
  }
  return fetchApi<PaginatedResponse<Storyboard>>(
    `/projects/${projectId}/storyboards`
  );
}

export async function updateStoryboard(
  storyboardId: string,
  data: UpdateStoryboardRequest
): Promise<Storyboard> {
  if (USE_MOCK_DATA) {
    const result = await mockYoutubeApi.updateStoryboard(storyboardId, data);
    return result as Storyboard;
  }
  return fetchApi<Storyboard>(`/storyboards/${storyboardId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteStoryboard(storyboardId: string): Promise<void> {
  return fetchApi<void>(`/storyboards/${storyboardId}`, {
    method: 'DELETE'
  });
}

export async function addStoryboard(
  projectId: string,
  data: Partial<Storyboard>
): Promise<Storyboard> {
  return fetchApi<Storyboard>(`/projects/${projectId}/storyboards`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// ============ 提示词生成 API ============

export async function generatePrompts(
  projectId: string,
  data: GeneratePromptsRequest
): Promise<TaskResponse> {
  if (USE_MOCK_DATA) {
    return mockYoutubeApi.generatePrompts(projectId, data.version);
  }
  return fetchApi<TaskResponse>(`/projects/${projectId}/prompts/generate`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function getPrompts(
  projectId: string
): Promise<PaginatedResponse<Prompt>> {
  if (USE_MOCK_DATA) {
    return mockYoutubeApi.getPrompts(projectId);
  }
  return fetchApi<PaginatedResponse<Prompt>>(`/projects/${projectId}/prompts`);
}

export async function updatePrompt(
  promptId: string,
  data: Partial<Prompt>
): Promise<Prompt> {
  if (USE_MOCK_DATA) {
    const result = await mockYoutubeApi.updatePrompt(promptId, data);
    return result as Prompt;
  }
  return fetchApi<Prompt>(`/prompts/${promptId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function regeneratePrompt(
  promptId: string,
  data: RegeneratePromptRequest
): Promise<TaskResponse> {
  if (USE_MOCK_DATA) {
    await mockYoutubeApi.regeneratePrompt(promptId, data.instruction);
    return {
      task_id: `regen_${promptId}`,
      status: 'completed',
      message: '重新生成完成'
    };
  }
  return fetchApi<TaskResponse>(`/prompts/${promptId}/regenerate`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function getPromptTemplates(): Promise<
  { id: string; name: string; version: string }[]
> {
  return fetchApi<{ id: string; name: string; version: string }[]>(
    '/prompts/templates'
  );
}

// ============ 角色映射 API ============

export async function getCharacterMappings(
  projectId: string
): Promise<CharacterMapping[]> {
  if (USE_MOCK_DATA) {
    return mockYoutubeApi.getCharacterMappings(projectId);
  }
  return fetchApi<CharacterMapping[]>(`/projects/${projectId}/characters`);
}

export async function updateCharacterMappings(
  projectId: string,
  data: UpdateCharacterMappingsRequest
): Promise<CharacterMapping[]> {
  if (USE_MOCK_DATA) {
    await mockYoutubeApi.updateCharacterMappings(projectId, data.mappings);
    return mockYoutubeApi.getCharacterMappings(projectId);
  }
  return fetchApi<CharacterMapping[]>(`/projects/${projectId}/characters`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function uploadCharacterImage(
  projectId: string,
  identifier: string,
  file: File
): Promise<CharacterMapping> {
  const formData = new FormData();
  formData.append('identifier', identifier);
  formData.append('file', file);

  const response = await fetch(
    `${API_BASE}/projects/${projectId}/characters/upload`,
    {
      method: 'POST',
      body: formData
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '上传失败' }));
    throw new Error(error.error || error.message || '上传失败');
  }

  return response.json();
}

// ============ 提示词结构化 API ============

export async function structurePrompts(
  projectId: string
): Promise<TaskResponse> {
  return fetchApi<TaskResponse>(`/projects/${projectId}/prompts/structure`, {
    method: 'POST'
  });
}

export async function exportPrompts(
  projectId: string
): Promise<StructuredPromptData> {
  if (USE_MOCK_DATA) {
    return mockYoutubeApi.exportPrompts(projectId);
  }
  return fetchApi<StructuredPromptData>(
    `/projects/${projectId}/prompts/export`
  );
}

// ============ 图片生成 API ============

export async function generateImages(
  projectId: string,
  data?: BatchGenerateRequest
): Promise<TaskResponse> {
  if (USE_MOCK_DATA) {
    return mockYoutubeApi.generateImages(projectId, data?.storyboard_ids);
  }
  return fetchApi<TaskResponse>(`/projects/${projectId}/images/generate`, {
    method: 'POST',
    body: JSON.stringify(data || {})
  });
}

export async function getGeneratedImages(
  projectId: string,
  params?: { storyboard_index?: number; is_selected?: boolean }
): Promise<PaginatedResponse<GeneratedImage>> {
  if (USE_MOCK_DATA) {
    return mockYoutubeApi.getGeneratedImages(
      projectId,
      params?.storyboard_index
    );
  }
  const searchParams = new URLSearchParams();
  if (params?.storyboard_index !== undefined)
    searchParams.set('storyboard_index', params.storyboard_index.toString());
  if (params?.is_selected !== undefined)
    searchParams.set('is_selected', params.is_selected.toString());

  const query = searchParams.toString();
  return fetchApi<PaginatedResponse<GeneratedImage>>(
    `/projects/${projectId}/images${query ? `?${query}` : ''}`
  );
}

export async function regenerateImage(imageId: string): Promise<TaskResponse> {
  return fetchApi<TaskResponse>(`/images/${imageId}/regenerate`, {
    method: 'POST'
  });
}

export async function selectImage(
  imageId: string,
  isSelected: boolean
): Promise<GeneratedImage> {
  if (USE_MOCK_DATA) {
    const result = await mockYoutubeApi.selectImage(imageId, isSelected);
    return result as GeneratedImage;
  }
  return fetchApi<GeneratedImage>(`/images/${imageId}/select`, {
    method: 'PUT',
    body: JSON.stringify({ is_selected: isSelected })
  });
}

export async function getImageGenerationTask(
  projectId: string,
  taskId: string
): Promise<GenerationTask> {
  if (USE_MOCK_DATA) {
    return mockYoutubeApi.getTaskStatus(taskId);
  }
  return fetchApi<GenerationTask>(
    `/projects/${projectId}/images/task/${taskId}`
  );
}

// ============ 视频生成 API ============

export async function generateVideos(
  projectId: string,
  data?: BatchGenerateRequest
): Promise<TaskResponse> {
  if (USE_MOCK_DATA) {
    return mockYoutubeApi.generateVideos(projectId, data?.storyboard_ids);
  }
  return fetchApi<TaskResponse>(`/projects/${projectId}/videos/generate`, {
    method: 'POST',
    body: JSON.stringify(data || {})
  });
}

export async function getGeneratedVideos(
  projectId: string,
  params?: { storyboard_index?: number; is_selected?: boolean }
): Promise<PaginatedResponse<GeneratedVideo>> {
  if (USE_MOCK_DATA) {
    return mockYoutubeApi.getGeneratedVideos(
      projectId,
      params?.storyboard_index
    );
  }
  const searchParams = new URLSearchParams();
  if (params?.storyboard_index !== undefined)
    searchParams.set('storyboard_index', params.storyboard_index.toString());
  if (params?.is_selected !== undefined)
    searchParams.set('is_selected', params.is_selected.toString());

  const query = searchParams.toString();
  return fetchApi<PaginatedResponse<GeneratedVideo>>(
    `/projects/${projectId}/videos${query ? `?${query}` : ''}`
  );
}

export async function regenerateVideo(videoId: string): Promise<TaskResponse> {
  return fetchApi<TaskResponse>(`/videos/${videoId}/regenerate`, {
    method: 'POST'
  });
}

export async function selectVideo(
  videoId: string,
  isSelected: boolean
): Promise<GeneratedVideo> {
  if (USE_MOCK_DATA) {
    const result = await mockYoutubeApi.selectVideo(videoId, isSelected);
    return result as GeneratedVideo;
  }
  return fetchApi<GeneratedVideo>(`/videos/${videoId}/select`, {
    method: 'PUT',
    body: JSON.stringify({ is_selected: isSelected })
  });
}

export async function getVideoGenerationTask(
  projectId: string,
  taskId: string
): Promise<GenerationTask> {
  if (USE_MOCK_DATA) {
    return mockYoutubeApi.getTaskStatus(taskId);
  }
  return fetchApi<GenerationTask>(
    `/projects/${projectId}/videos/task/${taskId}`
  );
}

export async function downloadVideos(
  projectId: string
): Promise<DownloadResponse> {
  return fetchApi<DownloadResponse>(`/projects/${projectId}/videos/download`, {
    method: 'POST'
  });
}

// ============ 任务状态 API ============

export async function getTask(taskId: string): Promise<GenerationTask> {
  if (USE_MOCK_DATA) {
    return mockYoutubeApi.getTaskStatus(taskId);
  }
  return fetchApi<GenerationTask>(`/tasks/${taskId}`);
}

export async function getProjectTasks(
  projectId: string
): Promise<GenerationTask[]> {
  if (USE_MOCK_DATA) {
    const task = await mockYoutubeApi.getTaskStatus(`task_${projectId}`);
    return [task];
  }
  return fetchApi<GenerationTask[]>(`/projects/${projectId}/tasks`);
}

export async function pauseTask(taskId: string): Promise<TaskResponse> {
  return fetchApi<TaskResponse>(`/tasks/${taskId}/pause`, {
    method: 'POST'
  });
}

export async function resumeTask(taskId: string): Promise<TaskResponse> {
  return fetchApi<TaskResponse>(`/tasks/${taskId}/resume`, {
    method: 'POST'
  });
}

export async function cancelTask(taskId: string): Promise<TaskResponse> {
  return fetchApi<TaskResponse>(`/tasks/${taskId}/cancel`, {
    method: 'POST'
  });
}
