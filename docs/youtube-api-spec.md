# YouTube AI视频制作工具 - FastAPI接口实现规格（简化版）

## 一、业务概述

这是一个AI驱动的YouTube视频微创新工具，用户输入YouTube视频URL，系统通过AI分析视频内容，自动生成分镜提示词，然后批量生成图片和视频。

### 核心工作流程
```
创建项目(保存youtube_url) → 生成提示词(LLM分析视频) → 生成图片(逐个分镜) → 生成视频(逐个分镜)
```

### 设计原则
1. **单表JSONB** - 一个project_id对应一条记录，所有数据存在JSONB字段
2. **简化接口** - 减少接口数量，合并相似功能
3. **同步优先** - AI调用直接同步返回，前端逐个调用

---

## 二、现有AI代理接口（已实现，直接调用）

### 2.1 视频分析接口（文生文，用于生成提示词）
```
POST /api/ai/video-analysis
```
**请求体**:
```json
{
  "youtube_url": "https://www.youtube.com/shorts/xxx",
  "instruction": "改编指令（可选）",
  "system_prompt": "自定义系统提示词（可选）"
}
```
**响应体**:
```json
{
  "success": true,
  "content": "LLM返回的结构化内容",
  "error": null
}
```

### 2.2 图文生图接口
```
POST /api/ai/image-generation
```
**请求体**:
```json
{
  "image": "角色参考图URL或base64（可选，无角色时传空字符串）",
  "prompt": "图片生成提示词"
}
```
**响应体**:
```json
{
  "success": true,
  "image_url": "https://xxx/generated.png",
  "error": null
}
```

### 2.3 图文生视频接口
```
POST /api/ai/video-generation
```
**请求体**:
```json
{
  "image": "源图片URL",
  "prompt": "视频生成提示词"
}
```
**响应体**:
```json
{
  "success": true,
  "video_url": "https://xxx/generated.mp4",
  "error": null
}
```

---

## 三、数据库设计（单表JSONB）

### 3.1 表结构
```sql
CREATE TABLE youtube_projects (
    id VARCHAR(32) PRIMARY KEY,              -- 项目ID，格式: proj_xxxxxxxxxxxx
    data JSONB NOT NULL,                     -- 项目所有数据
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引便于查询
CREATE INDEX idx_youtube_projects_created_at ON youtube_projects(created_at DESC);
CREATE INDEX idx_youtube_projects_status ON youtube_projects((data->>'status'));
```

### 3.2 JSONB数据结构

**阶段1：刚创建项目**
```json
{
  "name": "我的视频项目",
  "youtube_url": "https://www.youtube.com/watch?v=xxx",
  "status": "created",
  "prompt_version": null,
  "storyboards": []
}
```

**阶段2：生成提示词后（假设LLM返回3个分镜）**
```json
{
  "name": "我的视频项目",
  "youtube_url": "https://www.youtube.com/watch?v=xxx",
  "status": "prompts_ready",
  "prompt_version": "v1",
  "storyboards": [
    {
      "index": 0,
      "text_to_image": "一个宁静的森林场景，阳光透过树叶洒落...",
      "image_to_video": "镜头缓缓向前推进，树叶轻轻摇曳，光影变幻...",
      "character_refs": null,
      "is_prompt_edited": false,
      "images": [],
      "selected_image_index": null,
      "videos": [],
      "selected_video_index": null
    },
    {
      "index": 1,
      "text_to_image": "城市街道的夜景，霓虹灯闪烁...",
      "image_to_video": "行人匆匆走过，车流穿梭...",
      "character_refs": null,
      "is_prompt_edited": false,
      "images": [],
      "selected_image_index": null,
      "videos": [],
      "selected_video_index": null
    },
    {
      "index": 2,
      "text_to_image": "海边日落，金色阳光洒在海面上...",
      "image_to_video": "海浪轻轻拍打沙滩，海鸥飞过...",
      "character_refs": null,
      "is_prompt_edited": false,
      "images": [],
      "selected_image_index": null,
      "videos": [],
      "selected_video_index": null
    }
  ]
}
```

**阶段3：生成图片后（分镜0生成了2张图片）**
```json
{
  "storyboards": [
    {
      "index": 0,
      "text_to_image": "一个宁静的森林场景...",
      "image_to_video": "镜头缓缓向前推进...",
      "character_refs": ["A"],
      "is_prompt_edited": false,
      "images": [
        {
          "url": "https://xxx/img_001.png",
          "generation_type": "image_text_to_image"
        },
        {
          "url": "https://xxx/img_002.png",
          "generation_type": "image_text_to_image"
        }
      ],
      "selected_image_index": 0,
      "videos": [],
      "selected_video_index": null
    },
    {
      "index": 1,
      "text_to_image": "城市街道的夜景...",
      "image_to_video": "行人匆匆走过...",
      "character_refs": null,
      "is_prompt_edited": false,
      "images": [],
      "selected_image_index": null,
      "videos": [],
      "selected_video_index": null
    }
  ]
}
```

**阶段4：生成视频后（分镜0生成了1个视频）**
```json
{
  "storyboards": [
    {
      "index": 0,
      "text_to_image": "一个宁静的森林场景...",
      "image_to_video": "镜头缓缓向前推进...",
      "character_refs": ["A"],
      "is_prompt_edited": false,
      "images": [
        {"url": "https://xxx/img_001.png", "generation_type": "image_text_to_image"},
        {"url": "https://xxx/img_002.png", "generation_type": "image_text_to_image"}
      ],
      "selected_image_index": 0,
      "videos": [
        {
          "url": "https://xxx/vid_001.mp4",
          "source_image_index": 0
        }
      ],
      "selected_video_index": 0
    }
  ]
}
```

```

### 3.3 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `storyboards` | array | 分镜数组，生成提示词后初始化，数量由LLM决定 |
| `storyboards[n].text_to_image` | string | 文生图提示词，生成提示词时填充 |
| `storyboards[n].image_to_video` | string | 图生视频提示词，生成提示词时填充 |
| `storyboards[n].character_refs` | array\|null | 角色引用标识，用户编辑时设置 |
| `storyboards[n].images` | array | 生成的图片数组，初始为空，每次生成追加 |
| `storyboards[n].selected_image_index` | int\|null | 选中的图片索引，首次生成时默认为0 |
| `storyboards[n].videos` | array | 生成的视频数组，初始为空，每次生成追加 |
| `storyboards[n].selected_video_index` | int\|null | 选中的视频索引，首次生成时默认为0 |

### 3.4 status枚举值
- `created` - 刚创建，storyboards为空数组
- `prompts_ready` - 提示词已生成，storyboards已初始化
- `images_partial` - 部分分镜有图片
- `images_ready` - 所有分镜都有图片
- `videos_partial` - 部分分镜有视频
- `completed` - 所有分镜都有视频
- `failed` - 失败

---

## 四、API接口设计（简化版）

### 接口一览

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 项目 | POST | `/api/youtube/projects` | 创建项目 |
| | GET | `/api/youtube/projects` | 项目列表 |
| | GET | `/api/youtube/projects/{id}` | 项目详情（含所有数据） |
| | PUT | `/api/youtube/projects/{id}` | 更新项目（编辑提示词、选择图片/视频） |
| | DELETE | `/api/youtube/projects/{id}` | 删除项目 |
| 生成 | POST | `/api/youtube/projects/{id}/generate/prompts` | 生成所有提示词（调用video-analysis） |
| | POST | `/api/youtube/projects/{id}/generate/image` | 生成单个分镜的图片（调用image-generation） |
| | POST | `/api/youtube/projects/{id}/generate/video` | 生成单个分镜的视频（调用video-generation） |

**设计说明**:
1. **无单独的提示词/图片/视频列表接口** - 通过`GET /projects/{id}`获取项目详情，包含所有storyboards数据
2. **无单独的选择接口** - 通过`PUT /projects/{id}`更新`selected_image_index`或`selected_video_index`
3. **生成接口是同步的** - 前端逐个分镜调用，每次调用返回生成结果，前端可显示进度
4. **无任务管理** - 简化设计，不需要任务表和任务状态轮询

---

### 4.1 项目管理

#### 4.1.1 创建项目
```
POST /api/youtube/projects
```
**请求体**:
```json
{
  "name": "我的视频项目",
  "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```
**响应体**:
```json
{
  "id": "proj_a1b2c3d4e5f6",
  "data": {
    "name": "我的视频项目",
    "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "status": "created",
    "prompt_version": null,
    "storyboards": []
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### 4.1.2 获取项目列表
```
GET /api/youtube/projects?page=1&page_size=10&status=prompts_ready
```
**响应体**:
```json
{
  "data": [
    {
      "id": "proj_a1b2c3d4e5f6",
      "data": {
        "name": "我的视频项目",
        "youtube_url": "https://...",
        "status": "prompts_ready",
        "storyboards": [...]
      },
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T11:00:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "page_size": 10
}
```

#### 4.1.3 获取项目详情
```
GET /api/youtube/projects/{project_id}
```
**响应体**: 同创建项目的响应，包含完整的`data` JSONB

#### 4.1.4 更新项目
```
PUT /api/youtube/projects/{project_id}
```
**请求体**（部分更新，只传需要修改的字段）:
```json
{
  "name": "新项目名称",
  "storyboards": [
    {
      "index": 0,
      "text_to_image": "修改后的提示词...",
      "selected_image_index": 2
    }
  ]
}
```
**业务逻辑**:
- 支持修改项目名称
- 支持修改单个分镜的提示词（设置`is_prompt_edited = true`）
- 支持修改`selected_image_index`（选择图片）
- 支持修改`selected_video_index`（选择视频）
- 只更新传入的字段，其他字段保持不变

#### 4.1.5 删除项目
```
DELETE /api/youtube/projects/{project_id}
```

---

### 4.2 生成接口

#### 4.2.1 生成提示词（同步）
```
POST /api/youtube/projects/{project_id}/generate/prompts
```
**请求体**:
```json
{
  "version": "v1",
  "system_prompt": "你是一个专业的视频分镜师...",
  "instruction": "请将这个视频改编成科幻风格"
}
```
**响应体**:
```json
{
  "success": true,
  "storyboard_count": 5,
  "message": "成功生成5个分镜提示词"
}
```
**业务逻辑**:
1. 从数据库获取项目的`youtube_url`
2. 调用 `POST /api/ai/video-analysis`
3. 解析LLM返回的content，提取每个分镜的`text_to_image`和`image_to_video`
4. **初始化storyboards数组**：为每个分镜创建完整结构，包含提示词字段，`images`和`videos`初始化为空数组
5. 更新项目JSONB和`status`为`prompts_ready`
6. 同步返回结果

**生成提示词后的storyboards初始化结构**:
```json
{
  "index": 0,
  "text_to_image": "LLM生成的文生图提示词",
  "image_to_video": "LLM生成的图生视频提示词",
  "character_refs": null,
  "is_prompt_edited": false,
  "images": [],
  "selected_image_index": null,
  "videos": [],
  "selected_video_index": null
}
```

**LLM返回格式要求**（通过system_prompt约束）:
```json
{
  "storyboards": [
    {
      "index": 0,
      "text_to_image": "一个宁静的森林场景，阳光透过树叶...",
      "image_to_video": "镜头缓缓向前推进，树叶轻轻摇曳..."
    }
  ]
}
```

#### 4.2.2 生成单个分镜的图片（同步）
```
POST /api/youtube/projects/{project_id}/generate/image
```
**请求体**:
```json
{
  "storyboard_index": 0,
  "character_refs": [
    {
      "identifier": "A",
      "image_url": "https://xxx/character_a.png"
    }
  ]
}
```
**响应体**:
```json
{
  "success": true,
  "storyboard_index": 0,
  "image": {
    "url": "https://xxx/generated.png",
    "generation_type": "image_text_to_image"
  },
  "message": "分镜0图片生成成功"
}
```
**业务逻辑**:
1. 从项目JSONB获取指定分镜的`text_to_image`提示词
2. 判断是否有`character_refs`:
   - **有**: 调用`/api/ai/image-generation`，image参数传角色图片URL，`generation_type`记为`image_text_to_image`
   - **无**: 调用`/api/ai/image-generation`，image参数传空字符串，`generation_type`记为`text_to_image`
3. **追加**生成的图片到该分镜的`images`数组（不是覆盖）
4. 如果是该分镜**第一张图片**（`images`之前为空），设置`selected_image_index = 0`
5. 更新项目`status`（根据是否所有分镜都有图片）
6. 同步返回结果

**图片追加示例**:
```
调用前: storyboards[0].images = []
调用后: storyboards[0].images = [{"url": "...", "generation_type": "text_to_image"}]

再次调用后: storyboards[0].images = [
  {"url": "...", "generation_type": "text_to_image"},
  {"url": "...", "generation_type": "text_to_image"}
]
```

**前端调用方式**:
```javascript
// 前端逐个分镜调用，可显示进度
for (let i = 0; i < storyboards.length; i++) {
  setProgress(`正在生成分镜${i+1}的图片...`);
  const result = await fetch(`/api/youtube/projects/${projectId}/generate/image`, {
    method: 'POST',
    body: JSON.stringify({ storyboard_index: i, character_refs: null })
  });
  // 更新UI显示新生成的图片
}
```

#### 4.2.3 生成单个分镜的视频（同步）
```
POST /api/youtube/projects/{project_id}/generate/video
```
**请求体**:
```json
{
  "storyboard_index": 0
}
```
**响应体**:
```json
{
  "success": true,
  "storyboard_index": 0,
  "video": {
    "url": "https://xxx/generated.mp4",
    "source_image_index": 0
  },
  "message": "分镜0视频生成成功"
}
```
**业务逻辑**:
1. 从项目JSONB获取指定分镜的:
   - `image_to_video`提示词
   - `selected_image_index`对应的图片URL（作为视频生成的源图片）
2. 调用 `POST /api/ai/video-generation`
3. **追加**生成的视频到该分镜的`videos`数组（不是覆盖），记录`source_image_index`
4. 如果是该分镜**第一个视频**（`videos`之前为空），设置`selected_video_index = 0`
5. 更新项目`status`（根据是否所有分镜都有视频）
6. 同步返回结果

**前置条件**: 该分镜必须已有图片且已选择（`selected_image_index`有效）

**视频追加示例**:
```
调用前: storyboards[0].videos = []
调用后: storyboards[0].videos = [{"url": "...", "source_image_index": 0}]

用户切换选中图片后再次调用:
storyboards[0].videos = [
  {"url": "...", "source_image_index": 0},
  {"url": "...", "source_image_index": 1}
]
```

---

## 五、Pydantic模型定义

```python
from datetime import datetime
from enum import Enum
from typing import Optional, List, Any
from pydantic import BaseModel, Field

# ============ 枚举 ============

class ProjectStatus(str, Enum):
    CREATED = "created"
    PROMPTS_READY = "prompts_ready"
    IMAGES_PARTIAL = "images_partial"
    IMAGES_READY = "images_ready"
    VIDEOS_PARTIAL = "videos_partial"
    COMPLETED = "completed"
    FAILED = "failed"

class GenerationType(str, Enum):
    TEXT_TO_IMAGE = "text_to_image"
    IMAGE_TEXT_TO_IMAGE = "image_text_to_image"

# ============ JSONB嵌套数据结构 ============

class GeneratedImage(BaseModel):
    """生成的图片，追加到storyboard.images数组"""
    url: str
    generation_type: GenerationType

class GeneratedVideo(BaseModel):
    """生成的视频，追加到storyboard.videos数组"""
    url: str
    source_image_index: int  # 记录使用的是哪张图片

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
    name: str = Field(..., min_length=1, max_length=100)
    youtube_url: str

class UpdateProjectRequest(BaseModel):
    """部分更新项目（编辑提示词、选择图片/视频）"""
    name: Optional[str] = None
    storyboards: Optional[List[dict]] = None  # 只传需要更新的分镜字段

class GeneratePromptsRequest(BaseModel):
    version: str = Field(default="v1", pattern="^(v1|v2)$")
    system_prompt: Optional[str] = None
    instruction: Optional[str] = None

class CharacterRef(BaseModel):
    """角色引用（用于图文生图）"""
    identifier: str  # A/B/C/D
    image_url: str

class GenerateImageRequest(BaseModel):
    """生成单个分镜的图片"""
    storyboard_index: int = Field(..., ge=0)
    character_refs: Optional[List[CharacterRef]] = None  # 角色引用图片

class GenerateVideoRequest(BaseModel):
    """生成单个分镜的视频"""
    storyboard_index: int = Field(..., ge=0)

# ============ 响应模型 ============

class ProjectResponse(BaseModel):
    id: str
    data: ProjectData
    created_at: datetime
    updated_at: datetime

class PaginatedResponse(BaseModel):
    data: List[ProjectResponse]
    total: int
    page: int
    page_size: int

class GeneratePromptsResponse(BaseModel):
    success: bool
    storyboard_count: int  # 生成的分镜数量
    message: str

class GenerateImageResponse(BaseModel):
    success: bool
    storyboard_index: int
    image: Optional[GeneratedImage] = None  # 新生成的图片
    message: str

class GenerateVideoResponse(BaseModel):
    success: bool
    storyboard_index: int
    video: Optional[GeneratedVideo] = None  # 新生成的视频
    message: str
```

---

## 六、实现要点

### 6.1 ID生成
```python
import uuid

def generate_project_id() -> str:
    return f"proj_{uuid.uuid4().hex[:12]}"
```

### 6.2 JSONB更新（PostgreSQL）
```python
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import JSONB

# 更新单个分镜的selected_image_index
def update_storyboard_selection(db, project_id: str, storyboard_index: int, selected_image_index: int):
    db.execute(text("""
        UPDATE youtube_projects 
        SET data = jsonb_set(
            data, 
            ARRAY['storyboards', :idx::text, 'selected_image_index'], 
            :value::jsonb
        ),
        updated_at = NOW()
        WHERE id = :project_id
    """), {
        "project_id": project_id,
        "idx": storyboard_index,
        "value": str(selected_image_index)
    })
    db.commit()

# 追加图片到分镜
def append_image_to_storyboard(db, project_id: str, storyboard_index: int, image: dict):
    db.execute(text("""
        UPDATE youtube_projects 
        SET data = jsonb_set(
            data,
            ARRAY['storyboards', :idx::text, 'images'],
            (data->'storyboards'->:idx::int->'images') || :image::jsonb
        ),
        updated_at = NOW()
        WHERE id = :project_id
    """), {
        "project_id": project_id,
        "idx": storyboard_index,
        "image": json.dumps(image)
    })
    db.commit()
```

### 6.3 调用AI代理接口
```python
import httpx

AI_BASE_URL = "http://localhost:8000"  # 或配置的AI服务地址

async def call_video_analysis(youtube_url: str, instruction: str = None, system_prompt: str = None) -> dict:
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{AI_BASE_URL}/api/ai/video-analysis",
            json={
                "youtube_url": youtube_url,
                "instruction": instruction or "",
                "system_prompt": system_prompt
            }
        )
        return response.json()

async def call_image_generation(image_url: str, prompt: str) -> dict:
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{AI_BASE_URL}/api/ai/image-generation",
            json={
                "image": image_url,  # 空字符串表示纯文生图
                "prompt": prompt
            }
        )
        return response.json()

async def call_video_generation(image_url: str, prompt: str) -> dict:
    async with httpx.AsyncClient(timeout=180.0) as client:
        response = await client.post(
            f"{AI_BASE_URL}/api/ai/video-generation",
            json={
                "image": image_url,
                "prompt": prompt
            }
        )
        return response.json()
```

### 6.4 状态更新逻辑
```python
def calculate_project_status(data: dict) -> str:
    """根据storyboards数据计算项目状态"""
    storyboards = data.get("storyboards", [])
    
    # 没有分镜 = 刚创建
    if not storyboards:
        return "created"
    
    # 检查图片和视频状态
    all_have_images = all(len(sb.get("images", [])) > 0 for sb in storyboards)
    all_have_videos = all(len(sb.get("videos", [])) > 0 for sb in storyboards)
    any_have_images = any(len(sb.get("images", [])) > 0 for sb in storyboards)
    any_have_videos = any(len(sb.get("videos", [])) > 0 for sb in storyboards)
    
    if all_have_videos:
        return "completed"
    elif any_have_videos:
        return "videos_partial"
    elif all_have_images:
        return "images_ready"
    elif any_have_images:
        return "images_partial"
    else:
        return "prompts_ready"  # 有分镜但没有图片/视频 = 提示词已生成
```

### 6.5 生成提示词时初始化storyboards
```python
def initialize_storyboards_from_llm(llm_response: dict) -> list:
    """从LLM响应初始化storyboards数组"""
    storyboards = []
    for item in llm_response.get("storyboards", []):
        storyboards.append({
            "index": item["index"],
            "text_to_image": item["text_to_image"],
            "image_to_video": item["image_to_video"],
            "character_refs": None,
            "is_prompt_edited": False,
            "images": [],                    # 初始为空数组
            "selected_image_index": None,    # 初始为null
            "videos": [],                    # 初始为空数组
            "selected_video_index": None     # 初始为null
        })
    return storyboards
```

### 6.6 追加图片到分镜
```python
def append_image_to_storyboard(
    db, 
    project_id: str, 
    storyboard_index: int, 
    image_url: str,
    generation_type: str
):
    """追加图片到指定分镜的images数组"""
    project = db.query(YouTubeProject).filter_by(id=project_id).first()
    data = project.data
    
    storyboard = data["storyboards"][storyboard_index]
    
    # 追加新图片
    new_image = {"url": image_url, "generation_type": generation_type}
    storyboard["images"].append(new_image)
    
    # 如果是第一张图片，自动选中
    if len(storyboard["images"]) == 1:
        storyboard["selected_image_index"] = 0
    
    # 更新状态
    data["status"] = calculate_project_status(data)
    
    project.data = data
    project.updated_at = datetime.now()
    db.commit()
    
    return new_image
```

---

## 七、前端调用示例

```typescript
// 1. 创建项目
const project = await fetch('/api/youtube/projects', {
  method: 'POST',
  body: JSON.stringify({ name: '测试项目', youtube_url: 'https://...' })
}).then(r => r.json());

// 2. 生成提示词
await fetch(`/api/youtube/projects/${project.id}/generate/prompts`, {
  method: 'POST',
  body: JSON.stringify({ version: 'v1' })
});

// 3. 重新获取项目（包含生成的提示词）
const updatedProject = await fetch(`/api/youtube/projects/${project.id}`).then(r => r.json());
const storyboards = updatedProject.data.storyboards;

// 4. 逐个分镜生成图片
for (let i = 0; i < storyboards.length; i++) {
  const result = await fetch(`/api/youtube/projects/${project.id}/generate/image`, {
    method: 'POST',
    body: JSON.stringify({ storyboard_index: i })
  }).then(r => r.json());
  console.log(`分镜${i}图片生成完成:`, result.image.url);
}

// 5. 选择图片（更新项目）
await fetch(`/api/youtube/projects/${project.id}`, {
  method: 'PUT',
  body: JSON.stringify({
    storyboards: [{ index: 0, selected_image_index: 1 }]  // 选择第2张图片
  })
});

// 6. 逐个分镜生成视频
for (let i = 0; i < storyboards.length; i++) {
  const result = await fetch(`/api/youtube/projects/${project.id}/generate/video`, {
    method: 'POST',
    body: JSON.stringify({ storyboard_index: i })
  }).then(r => r.json());
  console.log(`分镜${i}视频生成完成:`, result.video.url);
}
```

---

## 八、数据流程总结

### 完整数据生命周期

```
1. 创建项目
   └─ storyboards: []  (空数组)
   └─ status: "created"

2. 生成提示词（调用 /api/ai/video-analysis）
   └─ storyboards: [
        {index: 0, text_to_image: "...", image_to_video: "...", images: [], videos: []},
        {index: 1, text_to_image: "...", image_to_video: "...", images: [], videos: []},
        ...
      ]
   └─ status: "prompts_ready"

3. 生成图片（逐个分镜调用 /api/ai/image-generation）
   └─ storyboards[0].images: [
        {url: "...", generation_type: "text_to_image"}
      ]
   └─ storyboards[0].selected_image_index: 0
   └─ status: "images_partial" → "images_ready"

4. 生成视频（逐个分镜调用 /api/ai/video-generation）
   └─ storyboards[0].videos: [
        {url: "...", source_image_index: 0}
      ]
   └─ storyboards[0].selected_video_index: 0
   └─ status: "videos_partial" → "completed"
```

### 接口总览（8个）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/youtube/projects` | 创建项目 |
| GET | `/api/youtube/projects` | 项目列表 |
| GET | `/api/youtube/projects/{id}` | 项目详情（含完整storyboards） |
| PUT | `/api/youtube/projects/{id}` | 更新项目（编辑提示词、选择图片/视频） |
| DELETE | `/api/youtube/projects/{id}` | 删除项目 |
| POST | `/api/youtube/projects/{id}/generate/prompts` | 生成提示词（初始化storyboards） |
| POST | `/api/youtube/projects/{id}/generate/image` | 生成单个分镜图片（追加到images数组） |
| POST | `/api/youtube/projects/{id}/generate/video` | 生成单个分镜视频（追加到videos数组） |

### 关键设计点

1. **单表JSONB** - 所有数据存在一个JSONB字段，简化查询和更新
2. **storyboards初始化** - 生成提示词时创建完整结构，`images`和`videos`初始为空数组
3. **追加而非覆盖** - 每次生成图片/视频都是追加到数组，支持多次生成
4. **自动选中** - 首次生成时自动设置`selected_xxx_index = 0`
5. **同步调用** - 前端逐个分镜调用，可实时显示进度
