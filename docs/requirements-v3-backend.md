# 爆款库模块 - 后端需求文档 V3

## 版本信息
- 版本：V3.0
- 日期：2026-01-14
- 状态：需求确认中

---

## 一、模块概述

### 1.1 功能定位

爆款库是一个独立的素材管理模块，与视频制作模块平级，用于收集和管理爆款视频素材。用户可以从爆款库快速创建视频制作项目。

### 1.2 模块关系

```
YouTube AI 视频工具
├── 爆款库（Viral Library）
│   ├── 爆款视频列表
│   └── 设置（标签管理）
│
└── 视频制作（Video Production）
    ├── 项目列表
    ├── 项目工作流（提示词编辑 → 图片生成 → 视频生成）
    └── 设置（主体库管理）
```

**命名说明：**
- 英文命名使用 `viral`（病毒式传播/爆款）
- 中文显示为"爆款库"
- 未来的"趋势监控榜单"模块将使用 `trending` 命名，避免冲突

---

## 二、数据库设计

### 2.1 爆款视频表

```sql
CREATE TABLE IF NOT EXISTS youtube_viral_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data JSONB NOT NULL,                          -- 爆款视频所有数据
    user_id VARCHAR(64),                          -- 创建者ID（预留，暂时为空表示全局共享）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_viral_videos_created_at ON youtube_viral_videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_viral_videos_tags ON youtube_viral_videos USING GIN ((data->'tags'));
CREATE INDEX IF NOT EXISTS idx_viral_videos_name ON youtube_viral_videos((data->>'name'));
```

### 2.2 JSONB 数据结构

```json
{
  "name": "爆款视频名称",
  "youtube_url": "https://www.youtube.com/watch?v=xxx",
  "image_host_video_url": "https://imgbed.3dany.com/file/youtube/viral/video_xxx.mp4",
  "image_host_cover_url": "https://imgbed.3dany.com/file/youtube/viral/cover_xxx.jpg",
  "view_count": 1500000,
  "tags": ["搞笑", "宠物", "日常"],
  "analysis_text": "这是一个关于宠物搞笑日常的爆款视频，主要亮点是...",
  "storyboard_descriptions": [
    "开场：一只猫咪躺在沙发上打哈欠",
    "中段：猫咪突然被窗外的鸟吸引，跳起来扑向窗户",
    "高潮：猫咪撞到玻璃，滑稽地滑落",
    "结尾：猫咪若无其事地舔爪子"
  ]
}
```

### 2.3 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 爆款视频名称 |
| youtube_url | string | 是 | 源 YouTube 视频 URL |
| image_host_video_url | string | 否 | 图床中的视频 URL（下载后填充） |
| image_host_cover_url | string | 否 | 图床中的封面图 URL（下载后填充） |
| view_count | integer | 否 | 视频播放量（用户手动输入） |
| tags | string[] | 否 | 视频标签数组 |
| analysis_text | string | 否 | 爆款分析文本（用户手动填写） |
| storyboard_descriptions | string[] | 否 | 分镜描述数组（用户手动填写） |

### 2.4 标签表

```sql
CREATE TABLE IF NOT EXISTS youtube_viral_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,             -- 标签名称
    color VARCHAR(20) DEFAULT '#6366f1',          -- 标签颜色（可选）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_viral_tags_name ON youtube_viral_tags(name);
```

---

## 三、API 接口设计

### 3.1 爆款视频 CRUD

#### 3.1.1 创建爆款视频
```
POST /api/youtube/viral
```

**请求体：**
```json
{
  "name": "搞笑猫咪日常",
  "youtube_url": "https://www.youtube.com/watch?v=xxx",
  "view_count": 1500000,
  "tags": ["搞笑", "宠物"],
  "analysis_text": "这是一个关于...",
  "storyboard_descriptions": ["开场：...", "中段：..."]
}
```

**响应体：**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "name": "搞笑猫咪日常",
    "youtube_url": "https://www.youtube.com/watch?v=xxx",
    "image_host_video_url": null,
    "image_host_cover_url": null,
    "view_count": 1500000,
    "tags": ["搞笑", "宠物"],
    "analysis_text": "这是一个关于...",
    "storyboard_descriptions": ["开场：...", "中段：..."]
  },
  "created_at": "2026-01-14T10:00:00Z",
  "updated_at": "2026-01-14T10:00:00Z"
}
```

#### 3.1.2 获取爆款视频列表
```
GET /api/youtube/viral?page=1&page_size=10&keyword=猫咪&tags=搞笑,宠物&start_date=2026-01-01&end_date=2026-01-31
```

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| page_size | int | 否 | 每页数量，默认 10 |
| keyword | string | 否 | 关键词搜索（匹配名称和分析文本） |
| tags | string | 否 | 标签筛选，逗号分隔，多个标签为 AND 关系 |
| start_date | string | 否 | 创建时间范围开始（ISO 8601 格式） |
| end_date | string | 否 | 创建时间范围结束（ISO 8601 格式） |

**响应体：**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "data": {...},
      "created_at": "2026-01-14T10:00:00Z",
      "updated_at": "2026-01-14T10:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "page_size": 10
}
```

#### 3.1.3 获取爆款视频详情
```
GET /api/youtube/viral/{id}
```

**响应体：** 同创建接口响应

#### 3.1.4 更新爆款视频
```
PUT /api/youtube/viral/{id}
```

**请求体：**（部分更新，只传需要修改的字段）
```json
{
  "name": "新名称",
  "view_count": 2000000,
  "tags": ["新标签"],
  "analysis_text": "更新后的分析文本",
  "storyboard_descriptions": ["更新后的分镜1", "更新后的分镜2"]
}
```

**响应体：** 同创建接口响应

#### 3.1.5 删除爆款视频
```
DELETE /api/youtube/viral/{id}?delete_media=true
```

**查询参数：**
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| delete_media | boolean | 否 | true | 是否同时删除图库中的媒体文件 |

**响应体：**
```json
{
  "success": true,
  "message": "爆款视频已删除"
}
```

### 3.2 媒体下载接口

#### 3.2.1 下载媒体到图床
```
POST /api/youtube/viral/{id}/download-media
```

**请求体：** 无

**响应体（成功）：**
```json
{
  "success": true,
  "image_host_video_url": "https://imgbed.3dany.com/file/youtube/viral/video_xxx.mp4",
  "image_host_cover_url": "https://imgbed.3dany.com/file/youtube/viral/cover_xxx.jpg",
  "message": "媒体下载成功"
}
```

**响应体（失败）：**
```json
{
  "success": false,
  "error": "VIDEO_DOWNLOAD_FAILED",
  "message": "视频下载失败：无法访问 YouTube 视频",
  "details": "Connection timeout after 30s"
}
```

**业务逻辑：**
1. 从 JSONB 获取 `youtube_url`
2. 调用 YouTube 下载服务获取视频和封面
3. 上传到第三方图床（与主体库使用同一图床）
4. 更新 JSONB 中的 `image_host_video_url` 和 `image_host_cover_url`
5. 返回结果

**错误码：**
| 错误码 | 说明 |
|--------|------|
| VIDEO_DOWNLOAD_FAILED | 视频下载失败 |
| COVER_DOWNLOAD_FAILED | 封面下载失败 |
| UPLOAD_FAILED | 上传到图床失败 |
| INVALID_YOUTUBE_URL | 无效的 YouTube URL |

### 3.3 从爆款库创建项目

#### 3.3.1 创建项目接口
```
POST /api/youtube/viral/{id}/create-project
```

**请求体：**
```json
{
  "instruction": "将这个视频改编成科幻风格，保留核心剧情但更换场景为太空站"
}
```

**响应体：**
```json
{
  "success": true,
  "project_id": "proj_a1b2c3d4e5f6",
  "viral_video_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "项目创建成功，请继续完成提示词生成流程"
}
```

**业务逻辑：**
1. 获取爆款视频完整 JSONB 数据
2. 创建新的 YouTube 项目：
   - `name`: 使用爆款视频的 `name`
   - `youtube_url`: 使用爆款视频的 `youtube_url`
   - `status`: `created`
   - `source_viral_id`: 记录来源爆款视频 ID（可选，用于追溯）
   - `viral_context`: 存储爆款视频完整 JSONB（用于后续提示词生成）
   - `instruction`: 用户输入的改编指令
3. 返回新项目 ID

**注意：** 此接口只创建项目，不自动生成提示词。用户需要在视频制作模块中继续完成提示词生成流程，届时爆款视频的 JSONB 数据和改编指令会被追加到提示词中。

### 3.4 标签管理接口

#### 3.4.1 获取所有标签
```
GET /api/youtube/viral/tags
```

**响应体：**
```json
{
  "tags": [
    {
      "id": "uuid-1",
      "name": "搞笑",
      "color": "#ef4444",
      "created_at": "2026-01-14T10:00:00Z"
    },
    {
      "id": "uuid-2",
      "name": "宠物",
      "color": "#22c55e",
      "created_at": "2026-01-14T10:00:00Z"
    }
  ],
  "total": 10
}
```

#### 3.4.2 创建标签
```
POST /api/youtube/viral/tags
```

**请求体：**
```json
{
  "name": "新标签",
  "color": "#6366f1"
}
```

**响应体：**
```json
{
  "id": "uuid-new",
  "name": "新标签",
  "color": "#6366f1",
  "created_at": "2026-01-14T10:00:00Z"
}
```

#### 3.4.3 更新标签
```
PUT /api/youtube/viral/tags/{id}
```

**请求体：**
```json
{
  "name": "更新后的标签名",
  "color": "#f59e0b"
}
```

#### 3.4.4 删除标签
```
DELETE /api/youtube/viral/tags/{id}
```

**响应体：**
```json
{
  "success": true,
  "message": "标签已删除"
}
```

**注意：** 删除标签时，已使用该标签的爆款视频不受影响（标签以字符串形式存储在 JSONB 中）。

---

## 四、项目 JSONB 结构扩展

为支持从爆款库创建项目，需要在项目 JSONB 中新增字段：

```json
{
  "name": "项目名称",
  "youtube_url": "https://www.youtube.com/watch?v=xxx",
  "status": "created",
  "source_viral_id": "550e8400-e29b-41d4-a716-446655440000",
  "viral_context": {
    "name": "爆款视频名称",
    "youtube_url": "...",
    "view_count": 1500000,
    "tags": ["搞笑", "宠物"],
    "analysis_text": "...",
    "storyboard_descriptions": ["...", "..."]
  },
  "instruction": "将这个视频改编成科幻风格...",
  "storyboards": []
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| source_viral_id | string | 来源爆款视频 ID（可选，用于追溯） |
| viral_context | object | 爆款视频完整 JSONB 数据（用于提示词生成时追加到上下文） |
| instruction | string | 用户输入的改编指令 |

## 五、提示词生成接口修改

### 5.1 修改首次生成提示词接口

当项目包含 `viral_context` 和 `instruction` 时，需要将其追加到提示词中：

```
POST /api/youtube/projects/{project_id}/generate/prompts
```

**业务逻辑修改：**
1. 检查项目是否有 `viral_context` 和 `instruction`
2. 如果有，将 `viral_context` 的完整 JSON 和 `instruction` 序列化后追加到 `system_prompt` 末尾
3. 追加格式示例：
```
[爆款视频参考数据]
{
  "name": "搞笑猫咪日常",
  "view_count": 1500000,
  "analysis_text": "这是一个关于宠物搞笑日常的爆款视频...",
  "storyboard_descriptions": ["开场：...", "中段：...", "高潮：...", "结尾：..."],
  "tags": ["搞笑", "宠物"]
}

[改编指令]
将这个视频改编成科幻风格，保留核心剧情但更换场景为太空站
```
4. 调用 antigravity 渠道的 Gemini 3 Pro 接口
5. 后续流程保持不变

---

## 六、Pydantic 模型定义

```python
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from uuid import UUID

# ============ 爆款视频数据结构 ============

class ViralVideoData(BaseModel):
    """爆款视频 JSONB 数据"""
    name: str
    youtube_url: str
    image_host_video_url: Optional[str] = None
    image_host_cover_url: Optional[str] = None
    view_count: Optional[int] = None
    tags: Optional[List[str]] = []
    analysis_text: Optional[str] = None
    storyboard_descriptions: Optional[List[str]] = []

class ViralVideoResponse(BaseModel):
    """爆款视频响应"""
    id: UUID
    data: ViralVideoData
    created_at: datetime
    updated_at: datetime

class ViralVideoListResponse(BaseModel):
    """爆款视频列表响应"""
    data: List[ViralVideoResponse]
    total: int
    page: int
    page_size: int

# ============ 请求模型 ============

class CreateViralVideoRequest(BaseModel):
    """创建爆款视频请求"""
    name: str = Field(..., min_length=1, max_length=200)
    youtube_url: str
    view_count: Optional[int] = None
    tags: Optional[List[str]] = []
    analysis_text: Optional[str] = None
    storyboard_descriptions: Optional[List[str]] = []

class UpdateViralVideoRequest(BaseModel):
    """更新爆款视频请求"""
    name: Optional[str] = Field(None, max_length=200)
    view_count: Optional[int] = None
    tags: Optional[List[str]] = None
    analysis_text: Optional[str] = None
    storyboard_descriptions: Optional[List[str]] = None

# ============ 媒体下载响应 ============

class DownloadMediaResponse(BaseModel):
    """媒体下载响应"""
    success: bool
    image_host_video_url: Optional[str] = None
    image_host_cover_url: Optional[str] = None
    message: str
    error: Optional[str] = None
    details: Optional[str] = None

# ============ 创建项目响应 ============

class CreateProjectFromViralRequest(BaseModel):
    """从爆款库创建项目请求"""
    instruction: str = Field(..., min_length=1)

class CreateProjectFromViralResponse(BaseModel):
    """从爆款库创建项目响应"""
    success: bool
    project_id: str
    viral_video_id: UUID
    message: str

# ============ 标签模型 ============

class ViralTag(BaseModel):
    """标签"""
    id: UUID
    name: str
    color: Optional[str] = "#6366f1"
    created_at: datetime

class ViralTagListResponse(BaseModel):
    """标签列表响应"""
    tags: List[ViralTag]
    total: int

class CreateTagRequest(BaseModel):
    """创建标签请求"""
    name: str = Field(..., min_length=1, max_length=50)
    color: Optional[str] = "#6366f1"

class UpdateTagRequest(BaseModel):
    """更新标签请求"""
    name: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = None
```

---

## 七、接口汇总表

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 爆款视频 | POST | `/api/youtube/viral` | 创建爆款视频 |
| 爆款视频 | GET | `/api/youtube/viral` | 获取爆款视频列表（支持筛选） |
| 爆款视频 | GET | `/api/youtube/viral/{id}` | 获取爆款视频详情 |
| 爆款视频 | PUT | `/api/youtube/viral/{id}` | 更新爆款视频 |
| 爆款视频 | DELETE | `/api/youtube/viral/{id}` | 删除爆款视频 |
| 媒体下载 | POST | `/api/youtube/viral/{id}/download-media` | 下载媒体到图床 |
| 创建项目 | POST | `/api/youtube/viral/{id}/create-project` | 从爆款库创建项目 |
| 标签管理 | GET | `/api/youtube/viral/tags` | 获取所有标签 |
| 标签管理 | POST | `/api/youtube/viral/tags` | 创建标签 |
| 标签管理 | PUT | `/api/youtube/viral/tags/{id}` | 更新标签 |
| 标签管理 | DELETE | `/api/youtube/viral/tags/{id}` | 删除标签 |

---

## 八、错误处理规范

### 8.1 HTTP 状态码

| 状态码 | 场景 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如标签名重复） |
| 500 | 服务器内部错误 |

### 8.2 错误响应格式

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "用户友好的错误描述",
  "details": "详细错误信息（可选，用于调试）"
}
```

### 8.3 日志规范

所有接口需要记录以下日志：
- 请求开始：记录请求路径、参数
- 请求成功：记录响应摘要
- 请求失败：记录完整错误堆栈

```python
import logging

logger = logging.getLogger("youtube.viral")

# 示例
logger.info(f"Creating viral video: {request.name}")
logger.error(f"Failed to download media for {viral_id}: {str(e)}", exc_info=True)
```
