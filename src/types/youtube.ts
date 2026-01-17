// YouTube AI视频制作工具类型定义
// 与FastAPI后端接口对齐

// ============ 枚举类型 ============

// 项目状态枚举（与后端ProjectStatus对齐）
export type ProjectStatus =
  | 'created' // 刚创建，storyboards为空
  | 'prompts_ready' // 提示词已生成，storyboards已初始化
  | 'images_partial' // 部分分镜有图片
  | 'images_ready' // 所有分镜都有图片
  | 'videos_partial' // 部分分镜有视频
  | 'completed' // 所有分镜都有视频
  | 'failed'; // 失败

// 图片生成类型（与后端GenerationType对齐）
export type GenerationType = 'text_to_image' | 'image_text_to_image';

// 主体类型（V2新增）
export type SubjectType = 'character' | 'object' | 'scene';

// 图片比例（V2新增）
export type AspectRatio = '9:16' | '16:9';

// 分镜插入类型（V2新增）
export type InsertType = 'before' | 'after';

// ============ JSONB嵌套数据结构（与后端对齐）============

// 生成的图片
export interface GeneratedImage {
  url: string;
  generation_type: GenerationType;
}

// 生成的视频
export interface GeneratedVideo {
  url: string;
  source_image_index: number; // 记录使用的是哪张图片生成的
}

// 分镜数据（与后端Storyboard对齐）
export interface Storyboard {
  index: number;
  storyboard_summary?: string; // 分镜概述（简短描述该分镜的内容和目的）
  text_to_image: string; // 文生图提示词（详细的图片生成指令）
  image_to_video: string; // 图生视频提示词（详细的视频生成指令）
  character_refs?: string[] | null; // 角色引用标识
  ref_storyboard_indexes?: number[] | null; // 参考分镜索引列表，用于场景一致性
  is_prompt_edited: boolean; // 是否被手动编辑过
  images: GeneratedImage[]; // 生成的图片数组
  selected_image_index: number | null; // 选中的图片索引
  videos: GeneratedVideo[]; // 生成的视频数组
  selected_video_index: number | null; // 选中的视频索引
}

// 项目JSONB数据（与后端ProjectData对齐）
export interface ProjectData {
  name: string;
  youtube_url: string;
  status: ProjectStatus;
  prompt_version?: string | null;
  aspect_ratio?: AspectRatio; // V2新增：图片生成比例
  current_prompt_version?: string; // V2新增：当前提示词版本
  subject_mappings?: Record<string, string>; // V2新增：主体映射 {"角色A": "uuid", ...}
  prompt_history?: PromptHistoryVersion[]; // V2新增：提示词历史版本
  storyboards: Storyboard[];
}

// ============ API响应模型（与后端对齐）============

// 项目响应（与后端ProjectResponse对齐）
export interface ProjectResponse {
  id: string;
  data: ProjectData;
  created_at: string;
  updated_at: string;
}

// 项目列表项（用于列表页面显示）
export interface ProjectListItem {
  id: string;
  name: string;
  youtube_url: string;
  status: ProjectStatus;
  storyboard_count: number;
  cover_url?: string | null; // 封面图片URL（从viral_context.image_host_cover_url提取）
  created_at: string;
  updated_at: string;
}

// 分页响应（与后端PaginatedResponse对齐）
export interface PaginatedProjectResponse {
  items: ProjectListItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// 生成提示词响应（与后端GeneratePromptsResponse对齐）
export interface GeneratePromptsResponse {
  success: boolean;
  storyboard_count: number;
  prompt_version?: string;
  error?: string;
}

// 生成图片响应（与后端GenerateImageResponse对齐）
export interface GenerateImageResponse {
  success: boolean;
  storyboard_index: number;
  image?: GeneratedImage;
  image_index?: number;
  error?: string;
}

// 生成视频响应（与后端GenerateVideoResponse对齐）
export interface GenerateVideoResponse {
  success: boolean;
  storyboard_index: number;
  video?: GeneratedVideo;
  video_index?: number;
  error?: string;
}

// ============ 请求模型（与后端对齐）============

// 创建项目请求
export interface CreateProjectRequest {
  name: string;
  youtube_url: string;
}

// 更新项目请求
export interface UpdateProjectRequest {
  name?: string;
  storyboards?: Partial<Storyboard>[];
  aspect_ratio?: AspectRatio; // V2新增
  subject_mappings?: Record<string, string>; // V2新增
}

// 生成提示词请求
export interface GeneratePromptsRequest {
  instruction?: string;
  system_prompt?: string;
}

// 角色引用
export interface CharacterRef {
  identifier: string;
  image_url: string;
}

// 生成图片请求
export interface GenerateImageRequest {
  storyboard_index: number;
  character_images?: string[]; // 角色参考图片数组（支持base64或URL）
  aspect_ratio?: AspectRatio; // V2新增：图片比例
  // 注意：ref_storyboard_indexes 已移至 Storyboard 模型，由后端自动读取
}

// 生成视频请求
export interface GenerateVideoRequest {
  storyboard_index: number;
}

// ============ 兼容旧代码的类型别名 ============

// VideoProject 作为 ProjectResponse 的别名，方便旧代码迁移
export type VideoProject = ProjectResponse;

// 通用分页响应（兼容旧代码）
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// ============ 前端专用类型 ============

// 角色映射（前端Settings页面使用）
export interface CharacterMapping {
  id: string;
  identifier: string; // A, B, C, D 等标识
  reference_image_url?: string; // 角色参考图片URL
  name?: string; // 角色名称（可选）
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

// 结构化提示词JSON（导出用）
export interface StructuredPromptData {
  project_id: string;
  project_name: string;
  total_storyboards: number;
  character_mappings: CharacterMapping[];
  prompts: {
    storyboard_index: number;
    text_to_image: string;
    image_to_video: string;
    character_refs: string[];
    character_images: { [key: string]: string };
  }[];
}

// API错误响应
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ============ 媒体管理类型 ============

// 媒体统计信息
export interface MediaCategoryStats {
  total_count: number;
  selected_count: number;
  unselected_count: number;
  total_size: string;
  total_bytes: number;
}

// 项目媒体统计响应
export interface MediaStatsResponse {
  project_id: string;
  images: MediaCategoryStats;
  videos: MediaCategoryStats;
  total_size: string;
  total_bytes: number;
}

// 媒体清理类型
export type MediaCleanupType = 'all' | 'images' | 'videos';

// 媒体清理响应
export interface MediaCleanupResponse {
  success: boolean;
  deleted_images: number;
  deleted_videos: number;
  freed_size: string;
  freed_bytes: number;
  errors: string[];
}

// ============ 旧类型定义（保留兼容性）============

// 源视频分镜（仅供参考展示，不影响后续流程）
export interface SourceStoryboard {
  id: string;
  project_id: string;
  index: number;
  start_time: number;
  end_time: number;
  start_frame_url: string;
  end_frame_url: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// 提示词（旧版本，保留兼容性）
export interface Prompt {
  id: string;
  project_id: string;
  storyboard_id: string;
  storyboard_index: number;
  storyboard_summary?: string; // 分镜概述
  text_to_image: string;
  image_to_video: string;
  character_refs?: string[];
  version: 'v1' | 'v2';
  is_edited: boolean;
  edit_history?: PromptEditHistory[];
  created_at: string;
  updated_at: string;
}

// 提示词编辑历史
export interface PromptEditHistory {
  timestamp: string;
  text_to_image: string;
  image_to_video: string;
  edit_type: 'manual' | 'ai_regenerate';
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
  progress: number;
  total_items: number;
  completed_items: number;
  failed_items: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// 任务响应
export interface TaskResponse {
  task_id: string;
  status: string;
  message: string;
}

// 下载响应
export interface DownloadResponse {
  download_url: string;
  file_count: number;
  total_size: string;
}

// 更新分镜请求（旧版本）
export interface UpdateStoryboardRequest {
  description?: string;
  start_time?: number;
  end_time?: number;
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

// 视频生成请求（包含源图片和提示词）
export interface VideoGenerateRequestLegacy {
  items: {
    prompt_id: string;
    source_image_id: string;
    image_to_video_prompt: string;
  }[];
  parallel_count?: number;
}

// 结构化提示词中的单个提示词项
export interface StructuredPromptItem {
  storyboard_index: number;
  text_to_image: string;
  image_to_video: string;
  character_refs: string[];
  character_images: { [key: string]: string };
}

// ============ V2 新增类型定义 ============

// ============ 全局主体库类型 ============

// 全局主体（服务端存储）
export interface Subject {
  id: string; // UUID
  type: SubjectType;
  identifier?: string; // 已废弃，保留兼容
  name?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

// 主体列表响应
export interface SubjectListResponse {
  subjects: Subject[];
  total: number;
}

// 创建主体请求（FormData，这里定义字段）
export interface CreateSubjectFields {
  type: SubjectType;
  name?: string;
  // image 通过 FormData 传递
}

// 更新主体请求（FormData，这里定义字段）
export interface UpdateSubjectFields {
  name?: string;
  remove_image?: boolean;
  // image 通过 FormData 传递
}

// ============ 提示词历史版本类型 ============

// 对话消息
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

// 历史版本中的分镜（不含图片/视频）
export interface PromptHistoryStoryboard {
  index: number;
  storyboard_summary?: string; // 分镜概述
  text_to_image: string;
  image_to_video: string;
  character_refs?: string[] | null;
  is_prompt_edited: boolean;
}

// 提示词历史版本
export interface PromptHistoryVersion {
  version: string; // v1, v2, v3...
  created_at: string;
  parent_version?: string; // 父版本号（v1无此字段）
  instruction: string; // 生成时的用户指令
  conversation_history: ConversationMessage[]; // Gemini对话历史
  storyboards: PromptHistoryStoryboard[]; // 该版本的分镜提示词
}

// 历史版本摘要（用于列表展示）
export interface PromptHistorySummary {
  version: string;
  created_at: string;
  instruction: string;
  storyboard_count: number;
  parent_version?: string;
}

// 历史版本列表响应
export interface PromptHistoryListResponse {
  current_version: string;
  versions: PromptHistorySummary[];
}

// ============ 提示词生成请求/响应 ============

// 继续对话生成请求
export interface ContinuePromptsRequest {
  instruction: string;
}

// 继续对话生成响应
export interface ContinuePromptsResponse {
  success: boolean;
  version: string;
  storyboard_count: number;
  message: string;
  error?: string;
}

// 重新生成请求
export interface RegeneratePromptsFromVersionRequest {
  from_version: string;
  instruction: string;
}

// 重新生成响应
export interface RegeneratePromptsFromVersionResponse {
  success: boolean;
  version: string;
  deleted_versions: string[];
  storyboard_count: number;
  message: string;
  error?: string;
}

// 切换版本请求
export interface SwitchVersionRequest {
  version: string;
}

// 切换版本响应（后端返回简单字符串，前端包装）
export type SwitchVersionResponse = string;

// ============ 项目复制类型 ============

// 复制项目请求
export interface CopyProjectRequest {
  name: string;
}

// 复制项目响应
export interface CopyProjectResponse {
  success: boolean;
  source_project_id: string;
  new_project_id: string;
  message: string;
}

// ============ 分镜管理类型 ============

// 删除分镜响应
export interface DeleteStoryboardResponse {
  success: boolean;
  deleted_index: number;
  new_storyboard_count: number;
  message: string;
  error?: string;
}

// 新增分镜请求
export interface AddStoryboardRequest {
  position: number;
  insert_type: InsertType;
}

// 新增分镜响应
export interface AddStoryboardResponse {
  success: boolean;
  new_index: number;
  new_storyboard_count: number;
  storyboard: Storyboard;
  message?: string;
  error?: string;
}

// 交换分镜请求
export interface SwapStoryboardsRequest {
  index_a: number;
  index_b: number;
}

// 交换分镜响应
export interface SwapStoryboardsResponse {
  success: boolean;
  swapped: [number, number];
  message: string;
  error?: string;
}

// ============ 主体类型常量 ============

export const SUBJECT_TYPE_LABELS: Record<SubjectType, string> = {
  character: '角色',
  object: '物品',
  scene: '场景'
};

export const ASPECT_RATIO_LABELS: Record<AspectRatio, string> = {
  '9:16': '竖屏 9:16',
  '16:9': '横屏 16:9'
};
