"""
YouTube AI视频制作工具 - FastAPI路由模块（简化版）

设计原则：
1. 单表JSONB - 一个project_id对应一条记录
2. 同步调用 - 前端逐个分镜调用，无需任务管理
3. 8个接口 - 项目CRUD(5) + 生成(3)

接口列表：
- POST   /api/youtube/projects                      创建项目
- GET    /api/youtube/projects                      项目列表
- GET    /api/youtube/projects/{id}                 项目详情
- PUT    /api/youtube/projects/{id}                 更新项目
- DELETE /api/youtube/projects/{id}                 删除项目
- POST   /api/youtube/projects/{id}/generate/prompts  生成提示词
- POST   /api/youtube/projects/{id}/generate/image    生成单个分镜图片
- POST   /api/youtube/projects/{id}/generate/video    生成单个分镜视频
"""

import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from .youtube_models import (
    ProjectStatus,
    GenerationType,
    ProjectData,
    Storyboard,
    GeneratedImage,
    GeneratedVideo,
    CreateProjectRequest,
    UpdateProjectRequest,
    GeneratePromptsRequest,
    GenerateImageRequest,
    GenerateVideoRequest,
    ProjectResponse,
    PaginatedResponse,
    GeneratePromptsResponse,
    GenerateImageResponse,
    GenerateVideoResponse,
)

router = APIRouter(prefix="/api/youtube", tags=["YouTube"])

# ============ 内存存储（开发阶段，生产环境替换为数据库） ============
_projects: dict = {}


def _generate_id() -> str:
    """生成项目ID"""
    return f"proj_{uuid.uuid4().hex[:12]}"


def _calculate_status(data: dict) -> ProjectStatus:
    """根据storyboards数据计算项目状态"""
    storyboards = data.get("storyboards", [])
    
    if not storyboards:
        return ProjectStatus.CREATED
    
    all_have_images = all(len(sb.get("images", [])) > 0 for sb in storyboards)
    all_have_videos = all(len(sb.get("videos", [])) > 0 for sb in storyboards)
    any_have_images = any(len(sb.get("images", [])) > 0 for sb in storyboards)
    any_have_videos = any(len(sb.get("videos", [])) > 0 for sb in storyboards)
    
    if all_have_videos:
        return ProjectStatus.COMPLETED
    elif any_have_videos:
        return ProjectStatus.VIDEOS_PARTIAL
    elif all_have_images:
        return ProjectStatus.IMAGES_READY
    elif any_have_images:
        return ProjectStatus.IMAGES_PARTIAL
    else:
        return ProjectStatus.PROMPTS_READY


# ============ 项目管理 API ============

@router.post(
    "/projects",
    response_model=ProjectResponse,
    summary="创建项目",
    tags=["YouTube - Projects"]
)
async def create_project(request: CreateProjectRequest) -> ProjectResponse:
    """创建项目，保存youtube_url"""
    project_id = _generate_id()
    now = datetime.now()
    
    data = ProjectData(
        name=request.name,
        youtube_url=request.youtube_url,
        status=ProjectStatus.CREATED,
        prompt_version=None,
        storyboards=[]
    )
    
    _projects[project_id] = {
        "id": project_id,
        "data": data.model_dump(),
        "created_at": now,
        "updated_at": now
    }
    
    return ProjectResponse(
        id=project_id,
        data=data,
        created_at=now,
        updated_at=now
    )


@router.get(
    "/projects",
    response_model=PaginatedResponse,
    summary="项目列表",
    tags=["YouTube - Projects"]
)
async def get_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: Optional[ProjectStatus] = None
) -> PaginatedResponse:
    """获取项目列表（分页）"""
    projects = list(_projects.values())
    
    if status:
        projects = [p for p in projects if p["data"]["status"] == status.value]
    
    projects.sort(key=lambda x: x["created_at"], reverse=True)
    
    total = len(projects)
    start = (page - 1) * page_size
    end = start + page_size
    
    return PaginatedResponse(
        data=[ProjectResponse(**p) for p in projects[start:end]],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get(
    "/projects/{project_id}",
    response_model=ProjectResponse,
    summary="项目详情",
    tags=["YouTube - Projects"]
)
async def get_project(project_id: str) -> ProjectResponse:
    """获取项目详情（含完整storyboards）"""
    if project_id not in _projects:
        raise HTTPException(status_code=404, detail="项目不存在")
    return ProjectResponse(**_projects[project_id])


@router.put(
    "/projects/{project_id}",
    response_model=ProjectResponse,
    summary="更新项目",
    description="部分更新：编辑提示词、选择图片/视频",
    tags=["YouTube - Projects"]
)
async def update_project(project_id: str, request: UpdateProjectRequest) -> ProjectResponse:
    """更新项目（编辑提示词、选择图片/视频）"""
    if project_id not in _projects:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    project = _projects[project_id]
    data = project["data"]
    
    # 更新项目名称
    if request.name is not None:
        data["name"] = request.name
    
    # 更新分镜数据
    if request.storyboards is not None:
        for update_sb in request.storyboards:
            idx = update_sb.get("index")
            if idx is None or idx >= len(data["storyboards"]):
                continue
            
            sb = data["storyboards"][idx]
            
            # 更新提示词
            if "text_to_image" in update_sb:
                sb["text_to_image"] = update_sb["text_to_image"]
                sb["is_prompt_edited"] = True
            if "image_to_video" in update_sb:
                sb["image_to_video"] = update_sb["image_to_video"]
                sb["is_prompt_edited"] = True
            
            # 更新角色引用
            if "character_refs" in update_sb:
                sb["character_refs"] = update_sb["character_refs"]
            
            # 更新选中的图片/视频索引
            if "selected_image_index" in update_sb:
                sb["selected_image_index"] = update_sb["selected_image_index"]
            if "selected_video_index" in update_sb:
                sb["selected_video_index"] = update_sb["selected_video_index"]
    
    project["updated_at"] = datetime.now()
    
    return ProjectResponse(**project)


@router.delete(
    "/projects/{project_id}",
    summary="删除项目",
    tags=["YouTube - Projects"]
)
async def delete_project(project_id: str):
    """删除项目"""
    if project_id not in _projects:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    del _projects[project_id]
    return {"message": "项目已删除"}


# ============ 生成接口 ============

async def _call_video_analysis(youtube_url: str, instruction: str = None, system_prompt: str = None) -> dict:
    """
    调用AI代理的视频分析接口 POST /api/ai/video-analysis
    
    TODO: 替换为实际的httpx调用
    """
    # 模拟LLM返回
    return {
        "success": True,
        "content": {
            "storyboards": [
                {"index": 0, "text_to_image": "一个宁静的森林场景，阳光透过树叶洒落...", "image_to_video": "镜头缓缓向前推进，树叶轻轻摇曳..."},
                {"index": 1, "text_to_image": "城市街道的夜景，霓虹灯闪烁...", "image_to_video": "行人匆匆走过，车流穿梭..."},
                {"index": 2, "text_to_image": "海边日落，金色阳光洒在海面上...", "image_to_video": "海浪轻轻拍打沙滩，海鸥飞过..."},
            ]
        }
    }


async def _call_image_generation(image_url: str, prompt: str) -> dict:
    """
    调用AI代理的图文生图接口 POST /api/ai/image-generation
    
    TODO: 替换为实际的httpx调用
    """
    return {
        "success": True,
        "image_url": f"https://placeholder.com/img_{uuid.uuid4().hex[:8]}.png"
    }


async def _call_video_generation(image_url: str, prompt: str) -> dict:
    """
    调用AI代理的图文生视频接口 POST /api/ai/video-generation
    
    TODO: 替换为实际的httpx调用
    """
    return {
        "success": True,
        "video_url": f"https://placeholder.com/vid_{uuid.uuid4().hex[:8]}.mp4"
    }


@router.post(
    "/projects/{project_id}/generate/prompts",
    response_model=GeneratePromptsResponse,
    summary="生成提示词",
    description="调用 /api/ai/video-analysis 分析视频，初始化storyboards数组",
    tags=["YouTube - Generate"]
)
async def generate_prompts(project_id: str, request: GeneratePromptsRequest) -> GeneratePromptsResponse:
    """生成提示词（同步），初始化storyboards数组"""
    if project_id not in _projects:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    project = _projects[project_id]
    data = project["data"]
    
    # 调用AI接口
    result = await _call_video_analysis(
        youtube_url=data["youtube_url"],
        instruction=request.instruction,
        system_prompt=request.system_prompt
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "AI接口调用失败"))
    
    # 初始化storyboards数组
    llm_storyboards = result["content"]["storyboards"]
    storyboards = []
    
    for item in llm_storyboards:
        storyboards.append({
            "index": item["index"],
            "text_to_image": item["text_to_image"],
            "image_to_video": item["image_to_video"],
            "character_refs": None,
            "is_prompt_edited": False,
            "images": [],                    # 初始为空数组
            "selected_image_index": None,
            "videos": [],                    # 初始为空数组
            "selected_video_index": None
        })
    
    # 更新项目数据
    data["storyboards"] = storyboards
    data["prompt_version"] = request.version
    data["status"] = ProjectStatus.PROMPTS_READY.value
    project["updated_at"] = datetime.now()
    
    return GeneratePromptsResponse(
        success=True,
        storyboard_count=len(storyboards),
        message=f"成功生成 {len(storyboards)} 个分镜提示词"
    )


@router.post(
    "/projects/{project_id}/generate/image",
    response_model=GenerateImageResponse,
    summary="生成单个分镜图片",
    description="调用 /api/ai/image-generation，追加到images数组",
    tags=["YouTube - Generate"]
)
async def generate_image(project_id: str, request: GenerateImageRequest) -> GenerateImageResponse:
    """生成单个分镜的图片（同步），追加到images数组"""
    if project_id not in _projects:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    project = _projects[project_id]
    data = project["data"]
    storyboards = data.get("storyboards", [])
    
    # 检查分镜索引
    if request.storyboard_index >= len(storyboards):
        raise HTTPException(status_code=400, detail=f"分镜索引 {request.storyboard_index} 不存在")
    
    sb = storyboards[request.storyboard_index]
    
    # 判断生成类型
    has_character_refs = request.character_refs and len(request.character_refs) > 0
    generation_type = GenerationType.IMAGE_TEXT_TO_IMAGE if has_character_refs else GenerationType.TEXT_TO_IMAGE
    
    # 准备角色图片URL
    image_input = ""
    if has_character_refs:
        image_input = request.character_refs[0].image_url
    
    # 调用AI接口
    result = await _call_image_generation(
        image_url=image_input,
        prompt=sb["text_to_image"]
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "图片生成失败"))
    
    # 追加新图片到数组
    new_image = {
        "url": result["image_url"],
        "generation_type": generation_type.value
    }
    sb["images"].append(new_image)
    
    # 如果是第一张图片，自动选中
    if len(sb["images"]) == 1:
        sb["selected_image_index"] = 0
    
    # 更新角色引用（如果有）
    if has_character_refs:
        sb["character_refs"] = [ref.identifier for ref in request.character_refs]
    
    # 更新项目状态
    data["status"] = _calculate_status(data).value
    project["updated_at"] = datetime.now()
    
    return GenerateImageResponse(
        success=True,
        storyboard_index=request.storyboard_index,
        image=GeneratedImage(**new_image),
        message=f"分镜 {request.storyboard_index} 图片生成成功"
    )


@router.post(
    "/projects/{project_id}/generate/video",
    response_model=GenerateVideoResponse,
    summary="生成单个分镜视频",
    description="调用 /api/ai/video-generation，追加到videos数组",
    tags=["YouTube - Generate"]
)
async def generate_video(project_id: str, request: GenerateVideoRequest) -> GenerateVideoResponse:
    """生成单个分镜的视频（同步），追加到videos数组"""
    if project_id not in _projects:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    project = _projects[project_id]
    data = project["data"]
    storyboards = data.get("storyboards", [])
    
    # 检查分镜索引
    if request.storyboard_index >= len(storyboards):
        raise HTTPException(status_code=400, detail=f"分镜索引 {request.storyboard_index} 不存在")
    
    sb = storyboards[request.storyboard_index]
    
    # 检查是否有选中的图片
    if sb["selected_image_index"] is None or len(sb["images"]) == 0:
        raise HTTPException(status_code=400, detail=f"分镜 {request.storyboard_index} 没有选中的图片")
    
    # 获取选中的图片URL
    selected_image = sb["images"][sb["selected_image_index"]]
    source_image_url = selected_image["url"]
    
    # 调用AI接口
    result = await _call_video_generation(
        image_url=source_image_url,
        prompt=sb["image_to_video"]
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "视频生成失败"))
    
    # 追加新视频到数组
    new_video = {
        "url": result["video_url"],
        "source_image_index": sb["selected_image_index"]
    }
    sb["videos"].append(new_video)
    
    # 如果是第一个视频，自动选中
    if len(sb["videos"]) == 1:
        sb["selected_video_index"] = 0
    
    # 更新项目状态
    data["status"] = _calculate_status(data).value
    project["updated_at"] = datetime.now()
    
    return GenerateVideoResponse(
        success=True,
        storyboard_index=request.storyboard_index,
        video=GeneratedVideo(**new_video),
        message=f"分镜 {request.storyboard_index} 视频生成成功"
    )
