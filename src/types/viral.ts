/**
 * 爆款库模块类型定义
 */

// ============ 爆款视频数据结构 ============

export interface ViralVideoData {
  name: string;
  youtube_url: string;
  image_host_video_url?: string;
  image_host_cover_url?: string;
  view_count?: number;
  tags?: string[];
  analysis_text?: string;
  storyboard_descriptions?: string[];
}

export interface ViralVideo {
  id: string;
  data: ViralVideoData;
  created_at: string;
  updated_at: string;
}

export interface ViralVideoListResponse {
  data: ViralVideo[];
  total: number;
  page: number;
  page_size: number;
}

// ============ 筛选参数 ============

export interface ViralFilterParams {
  page?: number;
  page_size?: number;
  keyword?: string;
  tags?: string[];
  start_date?: string;
  end_date?: string;
}

// ============ 请求类型 ============

export interface CreateViralVideoRequest {
  name: string;
  youtube_url: string;
  view_count?: number;
  tags?: string[];
  analysis_text?: string;
  storyboard_descriptions?: string[];
}

export interface UpdateViralVideoRequest {
  name?: string;
  view_count?: number;
  tags?: string[];
  analysis_text?: string;
  storyboard_descriptions?: string[];
}

// ============ 媒体下载响应 ============

export interface DownloadMediaResponse {
  success: boolean;
  video_url: string | null;
  cover_url: string | null;
  message: string;
}

// ============ 创建项目请求和响应 ============

export interface CreateProjectFromViralRequest {
  instruction: string;
}

export interface CreateProjectFromViralResponse {
  success: boolean;
  project_id: string;
  message: string;
}

// ============ 标签 ============

export interface ViralTag {
  id: string;
  name: string;
  color?: string;
  created_at: string;
}

export interface ViralTagListResponse {
  tags: ViralTag[];
  total: number;
}

export interface CreateTagRequest {
  name: string;
  color?: string;
}

export interface UpdateTagRequest {
  name?: string;
  color?: string;
}
