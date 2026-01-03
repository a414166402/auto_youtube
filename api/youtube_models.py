"""
YouTube AI视频制作工具 - Pydantic数据模型（简化版）

设计原则：
1. 单表JSONB - 一个project_id对应一条记录，所有数据存在JSONB字段
2. storyboards初始化 - 生成提示词时创建，images/videos初始为空数组
3. 追加而非覆盖 - 每次生成图片/视频都追加到数组
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


# ============ 枚举 ============

class ProjectStatus(str, Enum):
    """项目状态"""
    CREATED = "created"              # 刚创建，storyboards为空
    PROMPTS_READY = "prompts_ready"  # 提示词已生成，storyboards已初始化
    IMAGES_PARTIAL = "images_partial"  # 部分分镜有图片
    IMAGES_READY = "images_ready"    # 所有分镜都有图片
    VIDEOS_PARTIAL = "videos_partial"  # 部分分镜有视频
    COMPLETED = "completed"          # 所有分镜都有视频
    FAILED = "failed"


class GenerationType(str, Enum):
    """图片生成类型"""
    TEXT_TO_IMAGE = "text_to_image"           # 纯文生图（无角色引用）
    IMAGE_TEXT_TO_IMAGE = "image_text_to_image"  # 图文生图（有角色引用）


# ============ JSONB嵌套数据结构 ============

class GeneratedImage(BaseModel):
    """生成的图片，追加到storyboard.images数组"""
    url: str
    generation_type: GenerationType


class GeneratedVideo(BaseModel):
    """生成的视频，追加到storyboard.videos数组"""
    url: str
    source_image_index: int  # 记录使用的是哪张图片生成的


class Storyboard(BaseModel):
    """分镜数据，生成提示词时初始化"""
    index: int
    text_to_image: str                              # 文生图提示词（生成提示词时填充）
    image_to_video: str                             # 图生视频提示词（生成提示词时填充）
    character_refs: Optional[List[str]] = None      # 角色引用标识（用户编辑时设置）
    is_prompt_edited: bool = False                  # 是否被手动编辑过
    images: List[GeneratedImage] = []               # 生成的图片数组（初始为空，生成后追加）
    selected_image_index: Optional[int] = None      # 选中的图片索引
    videos: List[GeneratedVideo] = []               # 生成的视频数组（初始为空，生成后追加）
    selected_video_index: Optional[int] = None      # 选中的视频索引


class ProjectData(BaseModel):
    """项目JSONB数据"""
    name: str
    youtube_url: str
    status: ProjectStatus = ProjectStatus.CREATED
    prompt_version: Optional[str] = None
    storyboards: List[Storyboard] = []              # 分镜数组（生成提示词后初始化）


# ============ 请求模型 ============

class CreateProjectRequest(BaseModel):
    """创建项目请求"""
    name: str = Field(..., min_length=1, max_length=100)
    youtube_url: str


class UpdateProjectRequest(BaseModel):
    """更新项目请求（部分更新：编辑提示词、选择图片/视频）"""
    name: Optional[str] = None
    storyboards: Optional[List[dict]] = None  # 只传需要更新的分镜字段


class GeneratePromptsRequest(BaseModel):
    """生成提示词请求"""
    version: str = Field(default="v1", pattern="^(v1|v2)$")
    system_prompt: Optional[str] = None
    instruction: Optional[str] = None


class CharacterRef(BaseModel):
    """角色引用（用于图文生图）"""
    identifier: str  # A/B/C/D
    image_url: str


class GenerateImageRequest(BaseModel):
    """生成单个分镜图片请求"""
    storyboard_index: int = Field(..., ge=0)
    character_refs: Optional[List[CharacterRef]] = None  # 角色引用图片


class GenerateVideoRequest(BaseModel):
    """生成单个分镜视频请求"""
    storyboard_index: int = Field(..., ge=0)


# ============ 响应模型 ============

class ProjectResponse(BaseModel):
    """项目响应"""
    id: str
    data: ProjectData
    created_at: datetime
    updated_at: datetime


class PaginatedResponse(BaseModel):
    """分页响应"""
    data: List[ProjectResponse]
    total: int
    page: int
    page_size: int


class GeneratePromptsResponse(BaseModel):
    """生成提示词响应"""
    success: bool
    storyboard_count: int  # 生成的分镜数量
    message: str


class GenerateImageResponse(BaseModel):
    """生成图片响应"""
    success: bool
    storyboard_index: int
    image: Optional[GeneratedImage] = None  # 新生成的图片
    message: str


class GenerateVideoResponse(BaseModel):
    """生成视频响应"""
    success: bool
    storyboard_index: int
    video: Optional[GeneratedVideo] = None  # 新生成的视频
    message: str
