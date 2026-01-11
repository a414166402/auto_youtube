# YouTube AI视频制作工具 - 后端需求文档 V2

## 版本信息
- 版本：V2.0
- 日期：2026-01-11
- 状态：待开发

---

## 一、全局主体库管理

### 1.1 数据库设计

#### 新增表：youtube_subjects
```sql
CREATE TABLE IF NOT EXISTS youtube_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(32) NOT NULL,                    -- 主体类型：character/object/scene
    name VARCHAR(100),                            -- 主体名称
    image_url TEXT,                               -- 图片URL（第三方图床）
    user_id VARCHAR(64),                          -- 用户ID（预留，暂时为空表示全局共享）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_youtube_subjects_type ON youtube_subjects(type);
CREATE INDEX IF NOT EXISTS idx_youtube_subjects_user_id ON youtube_subjects(user_id);
```

**说明：** identifier 字段已废弃，主体通过 UUID 唯一标识，项目级映射直接使用主体 UUID。

#### 主体类型枚举（硬编码，可扩展）
```python
class SubjectType(str, Enum):
    CHARACTER = "character"  # 角色
    OBJECT = "object"        # 物品
    SCENE = "scene"          # 场景
```

### 1.2 API 接口

#### 1.2.1 获取主体列表
```
GET /api/youtube/subjects?type=character&user_id=xxx
```

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 否 | 主体类型筛选：character/object/scene |
| user_id | string | 否 | 用户ID（暂不使用，预留） |

**响应体：**
```json
{
  "subjects": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "character",
      "name": "紫发贵妇",
      "image_url": "https://imgbed.3dany.com/file/youtube/subjects/xxx.jpg",
      "created_at": "2026-01-10T10:00:00Z",
      "updated_at": "2026-01-10T10:00:00Z"
    }
  ],
  "total": 5
}
```

#### 1.2.2 创建主体
```
POST /api/youtube/subjects
Content-Type: multipart/form-data
```

**请求体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 主体类型：character/object/scene |
| name | string | 否 | 主体名称 |
| image | file | 否 | 图片文件（≤5MB） |

**响应体：**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "character",
  "name": "紫发贵妇",
  "image_url": "https://imgbed.3dany.com/file/youtube/subjects/xxx.jpg",
  "created_at": "2026-01-10T10:00:00Z",
  "updated_at": "2026-01-10T10:00:00Z"
}
```

**业务逻辑：**
1. 验证 type 是否为有效枚举值
2. 如有图片，上传到第三方图床，获取 URL
3. 创建记录并返回

#### 1.2.3 更新主体
```
PUT /api/youtube/subjects/{id}
Content-Type: multipart/form-data
```

**请求体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 主体名称 |
| image | file | 否 | 新图片文件（≤5MB） |
| remove_image | boolean | 否 | 是否删除图片 |

**响应体：** 同创建主体

#### 1.2.4 删除主体
```
DELETE /api/youtube/subjects/{id}?delete_image=true
```

**查询参数：**
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| delete_image | boolean | 否 | true | 是否同时删除图床图片 |

**响应体：**
```json
"主体已删除"
```

**说明：** 后端返回简单字符串消息，前端需自行包装处理。

**业务逻辑：**
1. 检查是否有项目正在引用该主体（可选：警告或阻止）
2. 如果 delete_image=true，删除图床上的图片
3. 删除数据库记录

---

## 二、项目 JSONB 结构改造

### 2.1 新增/修改字段

```json
{
  "name": "项目名称",
  "youtube_url": "https://www.youtube.com/watch?v=xxx",
  "status": "prompts_ready",
  "aspect_ratio": "9:16",
  "current_prompt_version": "v2",
  "subject_mappings": {
    "角色A": "uuid-of-subject-1",
    "角色B": "uuid-of-subject-2",
    "物品A": "uuid-of-subject-3",
    "场景A": "uuid-of-subject-4"
  },
  "prompt_history": [
    {
      "version": "v1",
      "created_at": "2026-01-10T10:00:00Z",
      "instruction": "不需要任何改编",
      "conversation_history": [
        {"role": "user", "content": "..."},
        {"role": "assistant", "content": "..."}
      ],
      "storyboards": [
        {
          "index": 0,
          "text_to_image": "...",
          "image_to_video": "...",
          "character_refs": ["角色A", "场景A"],
          "is_prompt_edited": false
        }
      ]
    },
    {
      "version": "v2",
      "created_at": "2026-01-10T11:00:00Z",
      "parent_version": "v1",
      "instruction": "让画面更科幻",
      "conversation_history": [
        {"role": "user", "content": "..."},
        {"role": "assistant", "content": "..."}
      ],
      "storyboards": [...]
    }
  ],
  "storyboards": [
    {
      "index": 0,
      "text_to_image": "...",
      "image_to_video": "...",
      "character_refs": ["角色A", "场景A"],
      "character_image_count": 2,
      "is_prompt_edited": false,
      "ref_storyboard_indexes": null,
      "images": [...],
      "selected_image_index": 0,
      "videos": [...],
      "selected_video_index": 0
    }
  ]
}
```

### 2.2 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| aspect_ratio | string | 图片生成比例：`9:16`（默认）或 `16:9` |
| current_prompt_version | string | 当前使用的提示词版本：v1, v2, v3... |
| subject_mappings | object | 项目级主体映射：`{"角色A": "uuid", ...}` |
| prompt_history | array | 提示词历史版本数组 |
| prompt_history[n].version | string | 版本号 |
| prompt_history[n].parent_version | string | 父版本号（v1 无此字段） |
| prompt_history[n].instruction | string | 生成时的用户指令 |
| prompt_history[n].conversation_history | array | Gemini 对话历史 |
| prompt_history[n].storyboards | array | 该版本的分镜提示词 |
| storyboards | array | 当前版本分镜快照（含图片/视频数据） |

---

## 三、提示词生成接口

### 3.1 首次生成提示词（保持原有）
```
POST /api/youtube/projects/{project_id}/generate/prompts
```

**请求体：**
```json
{
  "instruction": "不需要任何改编",
  "system_prompt": "..."
}
```

**业务逻辑：**
1. 调用 aistudio 渠道的视频分析接口
2. 解析返回的分镜提示词
3. 创建 v1 版本，存入 prompt_history
4. 设置 current_prompt_version = "v1"
5. 同步更新顶层 storyboards

### 3.2 继续对话生成
```
POST /api/youtube/projects/{project_id}/generate/prompts/continue
```

**请求体：**
```json
{
  "instruction": "让画面更科幻，增加霓虹灯效果"
}
```

**响应体：**
```json
{
  "success": true,
  "version": "v3",
  "storyboard_count": 15,
  "message": "成功生成新版本 v3"
}
```

**业务逻辑：**
1. 获取当前版本及其所有祖先版本的 conversation_history
2. 拼接完整对话历史
3. 调用 antigravity 渠道的 Gemini 3 Pro 接口
4. 解析返回的分镜提示词
5. 创建新版本（version = 当前最大版本号 + 1）
6. 设置 parent_version = 当前版本
7. 追加到 prompt_history
8. 更新 current_prompt_version
9. 同步更新顶层 storyboards

### 3.3 重新生成（从历史版本）
```
POST /api/youtube/projects/{project_id}/generate/prompts/regenerate
```

**请求体：**
```json
{
  "from_version": "v2",
  "instruction": "换一种风格"
}
```

**响应体：**
```json
{
  "success": true,
  "version": "v3",
  "deleted_versions": ["v3", "v4"],
  "storyboard_count": 15,
  "message": "从 v2 重新生成，已删除 v3, v4"
}
```

**业务逻辑：**
1. 验证 from_version 存在
2. 删除 from_version 之后的所有版本
3. 获取 from_version 及其祖先的 conversation_history
4. 调用 Gemini 接口生成新内容
5. 创建新版本，parent_version = from_version
6. 更新 current_prompt_version
7. 同步更新顶层 storyboards

### 3.4 切换提示词版本
```
PUT /api/youtube/projects/{project_id}/prompt-version
```

**请求体：**
```json
{
  "version": "v2"
}
```

**响应体：**
```json
"已切换到版本 v2"
```

**说明：** 后端返回简单字符串消息，前端需自行包装处理。

**业务逻辑：**
1. 验证版本存在
2. 更新 current_prompt_version
3. 从 prompt_history 中找到对应版本的 storyboards
4. 合并到顶层 storyboards（保留图片/视频数据，更新提示词）

### 3.5 获取历史版本列表
```
GET /api/youtube/projects/{project_id}/prompt-history
```

**响应体：**
```json
{
  "current_version": "v3",
  "versions": [
    {
      "version": "v1",
      "created_at": "2026-01-10T10:00:00Z",
      "instruction": "不需要任何改编",
      "storyboard_count": 15,
      "parent_version": null
    },
    {
      "version": "v2",
      "created_at": "2026-01-10T11:00:00Z",
      "instruction": "让画面更科幻",
      "storyboard_count": 15,
      "parent_version": "v1"
    }
  ]
}
```

---

## 四、项目复制接口

```
POST /api/youtube/projects/{project_id}/copy
```

**请求体：**
```json
{
  "name": "善恶循环类型 - 副本"
}
```

**响应体：**
```json
{
  "success": true,
  "source_project_id": "proj_abc123",
  "new_project_id": "proj_new456",
  "message": "项目复制成功"
}
```

**业务逻辑：**
1. 获取原项目数据
2. 创建新项目，复制以下字段：
   - name（使用请求中的新名称）
   - youtube_url
   - aspect_ratio
   - subject_mappings
   - prompt_history（完整复制）
   - current_prompt_version
3. 不复制：
   - storyboards 中的 images 和 videos（清空）
   - selected_image_index 和 selected_video_index（设为 null）
4. 设置 status = "prompts_ready"
5. 生成新的 project_id
6. 返回复制结果

---

## 五、分镜管理接口

### 5.1 删除分镜
```
DELETE /api/youtube/projects/{project_id}/storyboards/{index}
```

**响应体：**
```json
{
  "success": true,
  "deleted_index": 2,
  "new_storyboard_count": 14,
  "message": "分镜 #3 已删除，后续分镜已重新编号"
}
```

**业务逻辑：**
1. 验证 index 有效
2. 从顶层 storyboards 删除指定分镜
3. 重新编号后续分镜（index - 1）
4. 同步更新 prompt_history 中当前版本的 storyboards
5. 更新 ref_storyboard_indexes 引用（如有）

### 5.2 新增分镜
```
POST /api/youtube/projects/{project_id}/storyboards
```

**请求体：**
```json
{
  "position": 3,
  "insert_type": "after"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| position | int | 参考分镜的索引 |
| insert_type | string | `before` 或 `after` |

**响应体：**
```json
{
  "success": true,
  "new_index": 4,
  "new_storyboard_count": 16,
  "storyboard": {
    "index": 4,
    "text_to_image": "",
    "image_to_video": "",
    "character_refs": [],
    "is_prompt_edited": false,
    "images": [],
    "selected_image_index": null,
    "videos": [],
    "selected_video_index": null
  }
}
```

**业务逻辑：**
1. 计算插入位置
2. 创建空白分镜
3. 插入到 storyboards 数组
4. 重新编号后续分镜
5. 同步更新 prompt_history 中当前版本

### 5.3 交换分镜位置
```
PUT /api/youtube/projects/{project_id}/storyboards/swap
```

**请求体：**
```json
{
  "index_a": 2,
  "index_b": 5
}
```

**响应体：**
```json
{
  "success": true,
  "swapped": [2, 5],
  "message": "分镜 #3 和 #6 已交换位置"
}
```

**业务逻辑：**
1. 验证两个索引有效且不相同
2. 交换两个分镜的位置
3. 更新 index 字段
4. 同步更新 prompt_history 中当前版本
5. 更新 ref_storyboard_indexes 引用（如有）

---

## 六、图片生成接口修改

### 6.1 生成单个分镜图片（修改）
```
POST /api/youtube/projects/{project_id}/generate/image
```

**请求体：**
```json
{
  "storyboard_index": 0,
  "character_images": ["https://...", "https://..."],
  "aspect_ratio": "9:16"
}
```

**新增参数：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| aspect_ratio | string | 否 | 图片比例，默认从项目配置读取 |

**业务逻辑修改：**
1. 获取 aspect_ratio（优先请求参数，其次项目配置，默认 9:16）
2. 根据比例生成前缀描述：
   - `9:16` → `[要求生成的图片竖屏(9:16)]`
   - `16:9` → `[要求生成的图片横屏(16:9)]`
3. 将前缀追加到 text_to_image 提示词前面
4. 调用图文生图接口

---

## 七、Pydantic 模型更新

```python
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict
from pydantic import BaseModel, Field
from uuid import UUID

# ============ 枚举 ============

class SubjectType(str, Enum):
    CHARACTER = "character"
    OBJECT = "object"
    SCENE = "scene"

class AspectRatio(str, Enum):
    PORTRAIT = "9:16"
    LANDSCAPE = "16:9"

# ============ 主体库模型 ============

class SubjectResponse(BaseModel):
    id: UUID
    type: SubjectType
    identifier: str
    name: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class SubjectListResponse(BaseModel):
    subjects: List[SubjectResponse]
    total: int

class CreateSubjectRequest(BaseModel):
    type: SubjectType
    identifier: str = Field(..., min_length=1, max_length=1, pattern="^[A-Z]$")
    name: Optional[str] = Field(None, max_length=100)

class UpdateSubjectRequest(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    remove_image: Optional[bool] = False

# ============ 提示词历史模型 ============

class ConversationMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class PromptHistoryStoryboard(BaseModel):
    index: int
    text_to_image: str
    image_to_video: str
    character_refs: Optional[List[str]] = None
    is_prompt_edited: bool = False

class PromptHistoryVersion(BaseModel):
    version: str
    created_at: datetime
    parent_version: Optional[str] = None
    instruction: str
    conversation_history: List[ConversationMessage]
    storyboards: List[PromptHistoryStoryboard]

class PromptHistorySummary(BaseModel):
    version: str
    created_at: datetime
    instruction: str
    storyboard_count: int
    parent_version: Optional[str] = None

class PromptHistoryListResponse(BaseModel):
    current_version: str
    versions: List[PromptHistorySummary]

# ============ 提示词生成请求 ============

class ContinuePromptsRequest(BaseModel):
    instruction: str = Field(..., min_length=1)

class RegeneratePromptsRequest(BaseModel):
    from_version: str
    instruction: str = Field(..., min_length=1)

class SwitchVersionRequest(BaseModel):
    version: str

# ============ 项目复制请求 ============

class CopyProjectRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

# ============ 分镜管理请求 ============

class InsertType(str, Enum):
    BEFORE = "before"
    AFTER = "after"

class AddStoryboardRequest(BaseModel):
    position: int = Field(..., ge=0)
    insert_type: InsertType

class SwapStoryboardsRequest(BaseModel):
    index_a: int = Field(..., ge=0)
    index_b: int = Field(..., ge=0)

# ============ 图片生成请求（修改） ============

class GenerateImageRequest(BaseModel):
    storyboard_index: int = Field(..., ge=0)
    character_images: Optional[List[str]] = None
    aspect_ratio: Optional[AspectRatio] = None
```

---

## 八、接口汇总表

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 主体库 | GET | `/api/youtube/subjects` | 获取全局主体列表 |
| 主体库 | POST | `/api/youtube/subjects` | 创建主体 |
| 主体库 | PUT | `/api/youtube/subjects/{id}` | 更新主体 |
| 主体库 | DELETE | `/api/youtube/subjects/{id}` | 删除主体 |
| 提示词 | POST | `/api/youtube/projects/{id}/generate/prompts` | 首次生成（保持原有） |
| 提示词 | POST | `/api/youtube/projects/{id}/generate/prompts/continue` | 继续对话生成 |
| 提示词 | POST | `/api/youtube/projects/{id}/generate/prompts/regenerate` | 重新生成 |
| 提示词 | PUT | `/api/youtube/projects/{id}/prompt-version` | 切换版本 |
| 提示词 | GET | `/api/youtube/projects/{id}/prompt-history` | 获取历史列表 |
| 项目 | POST | `/api/youtube/projects/{id}/copy` | 复制项目 |
| 分镜 | DELETE | `/api/youtube/projects/{id}/storyboards/{index}` | 删除分镜 |
| 分镜 | POST | `/api/youtube/projects/{id}/storyboards` | 新增分镜 |
| 分镜 | PUT | `/api/youtube/projects/{id}/storyboards/swap` | 交换位置 |
| 图片 | POST | `/api/youtube/projects/{id}/generate/image` | 生成图片（修改） |
