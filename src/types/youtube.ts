// YouTube AI视频制作工具类型定义

// 项目状态枚举
export type ProjectStatus =
  | 'created' // 刚创建
  | 'downloading' // 下载中
  | 'downloaded' // 下载完成
  | 'parsing' // 解析分镜中
  | 'parsed' // 分镜解析完成
  | 'generating_prompts' // 生成提示词中
  | 'prompts_ready' // 提示词就绪
  | 'generating_images' // 生成图片中
  | 'images_ready' // 图片就绪
  | 'generating_videos' // 生成视频中
  | 'completed' // 全部完成
  | 'failed'; // 失败

// 视频项目
export interface VideoProject {
  id: string;
  name: string;
  youtube_url: string;
  status: ProjectStatus;
  video_path?: string;
  thumbnail_url?: string;
  duration?: number;
  created_at: string;
  updated_at: string;
  source_storyboard_count?: number; // 源视频分镜数量（来自分镜解析）
  innovation_storyboard_count?: number; // 微创新视频分镜数量（来自提示词生成）
  prompt_version?: 'v1' | 'v2';
}

// 源视频分镜（仅供参考展示，不影响后续流程）
export interface SourceStoryboard {
  id: string;
  project_id: string;
  index: number;
  start_time: number; // 秒
  end_time: number; // 秒
  start_frame_url: string; // 首帧图片URL
  end_frame_url: string; // 尾帧图片URL
  description?: string; // 用户输入的内容描述
  created_at: string;
  updated_at: string;
}

// 保留旧的 Storyboard 类型作为别名，兼容现有代码
export type Storyboard = SourceStoryboard;

// 提示词编辑历史
export interface PromptEditHistory {
  timestamp: string;
  text_to_image: string;
  image_to_video: string;
  edit_type: 'manual' | 'ai_regenerate';
}

// 提示词
export interface Prompt {
  id: string;
  project_id: string;
  storyboard_id: string;
  storyboard_index: number;
  text_to_image: string; // 文生图提示词
  image_to_video: string; // 图生视频提示词
  character_refs?: string[]; // 角色引用 ['A', 'B']
  version: 'v1' | 'v2';
  is_edited: boolean;
  edit_history?: PromptEditHistory[];
  created_at: string;
  updated_at: string;
}

// 角色映射
export interface CharacterMapping {
  id: string;
  project_id: string;
  number: number; // 1, 2, 3, 4
  identifier: string; // A, B, C, D
  reference_image_url?: string;
  name?: string;
}

// 生成的图片
export interface GeneratedImage {
  id: string;
  project_id: string;
  prompt_id: string;
  storyboard_index: number; // 微创新分镜序号
  image_url: string;
  generation_type: 'text_to_image' | 'image_text_to_image'; // 文生图 或 图文生图
  is_selected: boolean;
  created_at: string;
}

// 生成的视频
export interface GeneratedVideo {
  id: string;
  project_id: string;
  prompt_id: string;
  storyboard_index: number; // 微创新分镜序号
  source_image_id: string; // 用户选择的图片ID
  video_url: string;
  is_selected: boolean;
  created_at: string;
}

// 生成任务状态
export type TaskStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'paused'
  | 'cancelled';

// 生成任务
export interface GenerationTask {
  id: string;
  project_id: string;
  task_type: 'image' | 'video' | 'download' | 'parse' | 'prompt';
  status: TaskStatus;
  progress: number; // 0-100
  total_items: number;
  completed_items: number;
  failed_items: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// 结构化提示词JSON
export interface StructuredPromptData {
  project_id: string;
  project_name: string;
  total_innovation_storyboards: number; // 微创新分镜总数
  character_mappings: CharacterMapping[];
  prompts: {
    storyboard_index: number;
    text_to_image: string;
    image_to_video: string;
    character_refs: string[];
    character_images: { [key: string]: string }; // 角色标识 -> 图片URL
  }[];
}

// API响应类型
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface TaskResponse {
  task_id: string;
  status: string;
  message: string;
}

export interface DownloadResponse {
  download_url: string;
  file_count: number;
  total_size: string;
}

// 创建项目请求
export interface CreateProjectRequest {
  name: string;
  youtube_url: string;
}

// 更新分镜请求
export interface UpdateStoryboardRequest {
  description?: string;
  start_time?: number;
  end_time?: number;
}

// 生成提示词请求
export interface GeneratePromptsRequest {
  version: 'v1' | 'v2';
  include_storyboard_descriptions?: boolean;
}

// 重新生成提示词请求
export interface RegeneratePromptRequest {
  instruction: string;
  regenerate_type: 'text_to_image' | 'image_to_video' | 'both';
}

// 更新角色映射请求
export interface UpdateCharacterMappingsRequest {
  mappings: {
    number: number;
    identifier: string;
    name?: string;
  }[];
}

// 批量生成请求
export interface BatchGenerateRequest {
  storyboard_ids?: string[];
  parallel_count?: number;
}

// 更新项目请求
export interface UpdateProjectRequest {
  name?: string;
  youtube_url?: string;
  prompt_version?: 'v1' | 'v2';
}

// 更新提示词请求
export interface UpdatePromptRequest {
  text_to_image?: string;
  image_to_video?: string;
}

// 选择图片/视频请求
export interface SelectItemRequest {
  is_selected: boolean;
}

// 手动创建分镜请求
export interface CreateStoryboardRequest {
  start_time: number;
  end_time: number;
  description?: string;
}

// 提示词模板
export interface PromptTemplate {
  id: string;
  name: string;
  version: 'v1' | 'v2';
  description: string;
  text_to_image_template: string;
  image_to_video_template: string;
}

// API错误响应
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// 下载状态响应
export interface DownloadStatusResponse {
  task_id: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress: number;
  video_path?: string;
  error_message?: string;
}

// 项目列表查询参数
export interface ProjectListParams {
  page?: number;
  page_size?: number;
  status?: ProjectStatus;
  search?: string;
}

// 图片列表查询参数
export interface ImageListParams {
  storyboard_id?: string;
  is_selected?: boolean;
}

// 视频列表查询参数
export interface VideoListParams {
  storyboard_id?: string;
  is_selected?: boolean;
}

// 工作流步骤状态
export type WorkflowStepStatus =
  | 'completed'
  | 'in_progress'
  | 'pending'
  | 'failed';

// 工作流步骤
export interface WorkflowStep {
  id: string;
  name: string;
  status: WorkflowStepStatus;
  description?: string;
  action_url?: string;
  progress?: number;
}

// 结构化提示词中的单个提示词项
export interface StructuredPromptItem {
  storyboard_index: number;
  text_to_image: string;
  image_to_video: string;
  character_refs: string[];
  character_images: { [key: string]: string };
}
