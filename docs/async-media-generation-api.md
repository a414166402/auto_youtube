# 异步媒体生成队列系统 - 前后端联调文档

## ⚠️ 重要：旧接口迁移说明

### 必须停止使用的旧接口

**图片生成旧接口（同步）**:
```
❌ POST /api/youtube/projects/{project_id}/generate/image
```

**视频生成旧接口（同步）**:
```
❌ POST /api/youtube/projects/{project_id}/generate/video
```

### 为什么必须迁移？

1. **阻塞问题**: 旧接口会阻塞30-120秒等待AI生成完成，前端无响应
2. **并发问题**: 多个请求同时发送会导致API速率限制（429错误）
3. **可靠性问题**: 网络超时或服务器重启会导致任务丢失
4. **无法批量**: 只能串行等待，无法并发处理大量任务

### 新接口（异步）

**任务创建接口**:
```
✅ POST /api/tasks/create
```

**任务状态查询**:
```
✅ GET /api/tasks/{task_id}
✅ POST /api/tasks/batch-status  (批量查询)
```

**项目任务列表**:
```
✅ GET /api/youtube/projects/{project_id}/generation-tasks
```

### 快速迁移对照表

| 旧接口 | 新接口 | 响应时间 | 说明 |
|--------|--------|----------|------|
| POST /api/youtube/projects/{id}/generate/image | POST /api/tasks/create | 30-120秒 → <200ms | 立即返回task_id |
| POST /api/youtube/projects/{id}/generate/video | POST /api/tasks/create | 60-180秒 → <200ms | 立即返回task_id |
| 无 | POST /api/tasks/batch-status | - | 批量查询100个任务 |
| 无 | GET /api/youtube/projects/{id}/generation-tasks | - | 查看项目所有任务 |

### 迁移步骤

1. **停止调用旧接口**: 立即停止使用 `/api/youtube/projects/{id}/generate/image` 和 `/generate/video`
2. **改用任务创建接口**: 使用 `POST /api/tasks/create` 提交任务
3. **实现轮询逻辑**: 使用 `POST /api/tasks/batch-status` 批量查询任务状态
4. **更新UI**: 显示任务进度而非阻塞等待

详细迁移示例见第10.3节。

---

## 1. 功能概述

### 1.1 业务价值

异步媒体生成队列系统将原有的同步等待模式改造为异步队列模式,解决了以下核心问题:

- **大批量生成支持**: 支持一次性提交数百个媒体生成任务,系统自动排队处理
- **并发控制**: 图片生成限制2个并发,视频生成限制10个并发,避免API配额耗尽
- **持久化队列**: 任务存储在数据库中,服务器重启后自动恢复
- **状态追踪**: 实时查询任务状态(pending/running/completed/failed)
- **批量查询优化**: 支持一次查询最多100个任务状态,大幅减少HTTP请求数量

### 1.2 与同步接口的区别

| 特性 | 同步接口 | 异步接口 |
|------|---------|---------|
| 响应时间 | 30-120秒(等待生成完成) | <200毫秒(立即返回task_id) |
| 批量支持 | 需要串行等待 | 支持并发提交 |
| 失败重试 | 需要前端重新请求 | 自动重试(最多3次) |
| 服务器重启 | 任务丢失 | 自动恢复 |
| 并发控制 | 无 | 模块级限制 |

### 1.3 适用场景

- **批量生成**: 一次性为多个分镜生成图片或视频
- **长时间操作**: 避免前端长时间等待导致超时
- **高并发场景**: 多个用户同时提交生成请求
- **可靠性要求高**: 需要任务持久化和自动恢复

---

## 2. API接口文档

### 2.1 任务创建接口

#### 端点
```
POST /api/tasks/create
```

#### 请求头
```
Content-Type: application/json
```

#### 请求体 - 图片生成

```json
{
  "module_name": "image_generation",
  "task_type": "generate_storyboard_image",
  "execution_mode": "sequential",
  "data": {
    "project_id": "proj_123",
    "storyboard_index": 0,
    "prompt": "A beautiful sunset over mountains",
    "character_images": ["https://example.com/char1.jpg", "https://example.com/char2.jpg"],
    "aspect_ratio": "9:16",
    "subject_mappings": {"角色A": "character_1"},
    "ref_storyboard_indexes": [1, 2],
    "ai_channel": "business"
  }
}
```


#### 请求体 - 视频生成

```json
{
  "module_name": "video_generation",
  "task_type": "generate_storyboard_video",
  "execution_mode": "sequential",
  "data": {
    "project_id": "proj_123",
    "storyboard_index": 0,
    "image_data": "https://example.com/source.jpg",
    "prompt": "Camera slowly zooms in",
    "subject_mappings": {"角色A": "character_1"},
    "source_image_index": 0
  }
}
```

#### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| module_name | string | 是 | 模块名称: `image_generation` 或 `video_generation` |
| task_type | string | 是 | 任务类型: `generate_storyboard_image` 或 `generate_storyboard_video` |
| execution_mode | string | 否 | 执行模式: `sequential`(默认) 或 `parallel` |
| data | object | 是 | 任务数据,根据模块不同而不同 |

**data字段 - 图片生成:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_id | string | 是 | 项目ID |
| storyboard_index | integer | 是 | 分镜索引 |
| prompt | string | 是 | 文本提示词 |
| character_images | array | 否 | 角色参考图片URL列表 |
| aspect_ratio | string | 否 | 图片比例: `9:16`(默认), `16:9`, `1:1` |
| subject_mappings | object | 否 | 主体引用映射 |
| ref_storyboard_indexes | array | 否 | 参考分镜索引列表 |
| ai_channel | string | 否 | AI渠道: `business`(默认), `antigravity`, `gcp` |

**data字段 - 视频生成:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_id | string | 是 | 项目ID |
| storyboard_index | integer | 是 | 分镜索引 |
| image_data | string | 是 | 源图片URL或base64数据 |
| prompt | string | 是 | 动作提示词 |
| subject_mappings | object | 否 | 主体引用映射 |
| source_image_index | integer | 否 | 源图片在分镜中的索引 |

#### 响应 - 成功

```json
{
  "success": true,
  "task_id": "image_generation_generate_storyboard_image_1234567890_abc123",
  "message": "任务已创建并添加到 image_generation 队列"
}
```

#### 响应 - 模块忙碌

```json
{
  "detail": "模块 image_generation 正在执行任务,无法添加新任务。原因: 处理器正在运行, 队列中有 5 个任务。请等待当前任务完成后再试。"
}
```
HTTP状态码: 409 Conflict

#### 响应 - 参数错误

```json
{
  "detail": "执行模式必须是 'sequential' 或 'parallel'"
}
```
HTTP状态码: 400 Bad Request


#### curl示例 - 图片生成

```bash
curl -X POST http://localhost:80/api/tasks/create \
  -H "Content-Type: application/json" \
  -d '{
    "module_name": "image_generation",
    "task_type": "generate_storyboard_image",
    "data": {
      "project_id": "proj_123",
      "storyboard_index": 0,
      "prompt": "A beautiful sunset",
      "aspect_ratio": "9:16"
    }
  }'
```

#### JavaScript示例

```javascript
async function createImageGenerationTask(projectId, storyboardIndex, prompt, options = {}) {
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
    const error = await response.json();
    throw new Error(error.detail || '任务创建失败');
  }
  
  const result = await response.json();
  return result.task_id;
}
```

---

### 2.2 任务状态查询接口

#### 端点
```
GET /api/tasks/{task_id}
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| task_id | string | 任务ID(从创建接口返回) |

#### 响应 - pending状态

```json
{
  "task_id": "image_generation_generate_storyboard_image_1234567890_abc123",
  "module_name": "image_generation",
  "task_type": "generate_storyboard_image",
  "status": "pending",
  "progress": 0,
  "created_at": "2024-01-01T10:00:00",
  "started_at": null,
  "completed_at": null,
  "error_message": null,
  "has_result": false
}
```

#### 响应 - running状态

```json
{
  "task_id": "image_generation_generate_storyboard_image_1234567890_abc123",
  "module_name": "image_generation",
  "task_type": "generate_storyboard_image",
  "status": "running",
  "progress": 50,
  "created_at": "2024-01-01T10:00:00",
  "started_at": "2024-01-01T10:00:05",
  "completed_at": null,
  "error_message": null,
  "has_result": false
}
```

#### 响应 - completed状态

```json
{
  "task_id": "image_generation_generate_storyboard_image_1234567890_abc123",
  "module_name": "image_generation",
  "task_type": "generate_storyboard_image",
  "status": "completed",
  "progress": 100,
  "created_at": "2024-01-01T10:00:00",
  "started_at": "2024-01-01T10:00:05",
  "completed_at": "2024-01-01T10:00:30",
  "error_message": null,
  "has_result": true
}
```


#### 响应 - failed状态

```json
{
  "task_id": "image_generation_generate_storyboard_image_1234567890_abc123",
  "module_name": "image_generation",
  "task_type": "generate_storyboard_image",
  "status": "failed",
  "progress": 0,
  "created_at": "2024-01-01T10:00:00",
  "started_at": "2024-01-01T10:00:05",
  "completed_at": "2024-01-01T10:00:10",
  "error_message": "图片生成失败: API rate limit exceeded",
  "has_result": false
}
```

#### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| task_id | string | 任务ID |
| module_name | string | 模块名称 |
| task_type | string | 任务类型 |
| status | string | 任务状态: `pending`, `running`, `completed`, `failed`, `cancelled` |
| progress | integer | 进度百分比(0-100) |
| created_at | string | 创建时间(ISO 8601格式) |
| started_at | string\|null | 开始时间 |
| completed_at | string\|null | 完成时间 |
| error_message | string\|null | 错误信息(仅failed状态) |
| has_result | boolean | 是否有结果数据 |

**注意**: `has_result=true`时,需要从数据库直接查询`task_manager_tasks`表的`result`字段(JSONB)获取完整结果。

#### curl示例

```bash
curl http://localhost:80/api/tasks/image_generation_generate_storyboard_image_1234567890_abc123
```

#### JavaScript示例

```javascript
async function getTaskStatus(taskId) {
  const response = await fetch(`/api/tasks/${taskId}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('任务不存在');
    }
    throw new Error('查询任务状态失败');
  }
  
  return await response.json();
}
```

---

### 2.3 批量任务状态查询接口

#### 端点
```
POST /api/tasks/batch-status
```

#### 设计目的

解决前端一次性提交大量任务后,需要频繁轮询每个任务状态导致的服务器压力问题。通过批量查询接口,前端可以一次请求获取多个任务的状态,大幅减少HTTP请求数量。

#### 请求头
```
Content-Type: application/json
```

#### 请求体

```json
{
  "task_ids": [
    "image_generation_generate_storyboard_image_1234567890_abc123",
    "image_generation_generate_storyboard_image_1234567891_def456",
    "video_generation_generate_storyboard_video_1234567892_ghi789"
  ]
}
```

#### 请求限制

- `task_ids`数组最多包含100个元素
- 超过100个返回400错误

#### 响应 - 成功

```json
{
  "success": true,
  "tasks": [
    {
      "task_id": "image_generation_generate_storyboard_image_1234567890_abc123",
      "module_name": "image_generation",
      "task_type": "generate_storyboard_image",
      "status": "completed",
      "progress": 100,
      "created_at": "2024-01-01T10:00:00",
      "started_at": "2024-01-01T10:00:05",
      "completed_at": "2024-01-01T10:00:30",
      "error_message": null,
      "has_result": true
    },
    {
      "task_id": "image_generation_generate_storyboard_image_1234567891_def456",
      "module_name": "image_generation",
      "task_type": "generate_storyboard_image",
      "status": "running",
      "progress": 50,
      "created_at": "2024-01-01T10:00:01",
      "started_at": "2024-01-01T10:00:35",
      "completed_at": null,
      "error_message": null,
      "has_result": false
    }
  ],
  "not_found": []
}
```


#### 响应 - 部分任务不存在

```json
{
  "success": true,
  "tasks": [
    {
      "task_id": "image_generation_generate_storyboard_image_1234567890_abc123",
      "status": "completed",
      "progress": 100,
      ...
    }
  ],
  "not_found": [
    "invalid_task_id_123"
  ]
}
```

#### 响应 - 请求过多

```json
{
  "success": false,
  "error": "task_ids数量不能超过100个",
  "max_allowed": 100,
  "received": 150
}
```
HTTP状态码: 400 Bad Request

#### 性能优势

- 使用单个SQL查询(IN子句)而非循环查询
- 100个任务查询在1秒内完成
- 大幅减少HTTP请求数量(100个任务从100次请求降至1次)

#### curl示例

```bash
curl -X POST http://localhost:80/api/tasks/batch-status \
  -H "Content-Type: application/json" \
  -d '{
    "task_ids": [
      "image_generation_generate_storyboard_image_1234567890_abc123",
      "image_generation_generate_storyboard_image_1234567891_def456"
    ]
  }'
```

#### JavaScript示例

```javascript
async function getBatchTaskStatus(taskIds) {
  const response = await fetch('/api/tasks/batch-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_ids: taskIds })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '批量查询失败');
  }
  
  const result = await response.json();
  return result;
}
```

---

### 2.4 项目任务列表接口

#### 端点
```
GET /api/youtube/projects/{project_id}/generation-tasks
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| project_id | string | 项目ID |

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_type | string | 否 | 任务类型筛选 |
| status | string | 否 | 状态筛选: `pending`, `running`, `completed`, `failed` |
| limit | integer | 否 | 每页数量(默认20) |
| offset | integer | 否 | 偏移量(默认0) |

#### 响应

```json
{
  "project_id": "proj_123",
  "tasks": [
    {
      "task_id": "image_generation_generate_storyboard_image_1234567890_abc123",
      "task_type": "generate_storyboard_image",
      "status": "completed",
      "progress": 100,
      "created_at": "2024-01-01T10:00:00",
      "started_at": "2024-01-01T10:00:05",
      "completed_at": "2024-01-01T10:00:30",
      "storyboard_index": 0,
      "result": {
        "media_url": "https://example.com/image.jpg",
        "media_index": 0
      }
    }
  ],
  "total": 50,
  "limit": 20,
  "offset": 0
}
```

#### curl示例

```bash
# 查询所有任务
curl "http://localhost:80/api/youtube/projects/proj_123/generation-tasks"

# 筛选已完成的图片生成任务
curl "http://localhost:80/api/youtube/projects/proj_123/generation-tasks?task_type=generate_storyboard_image&status=completed"

# 分页查询
curl "http://localhost:80/api/youtube/projects/proj_123/generation-tasks?limit=10&offset=20"
```


---

### 2.5 模块状态查询接口

#### 端点
```
GET /api/tasks/modules/{module_name}/status
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| module_name | string | 模块名称: `image_generation` 或 `video_generation` |

#### 响应

```json
{
  "status": "running",
  "queue_processing": true,
  "queue_size": 15,
  "message": "IMAGE_GENERATION数据处理队列正在运行，当前有 2 个任务正在执行，队列中还有 13 个待处理任务",
  "module_name": "image_generation",
  "total_tasks": 20,
  "completed_tasks": 5,
  "failed_tasks": 0,
  "pending_tasks": 13,
  "running_tasks": 2,
  "completion_percentage": 25.0,
  "automation_info": {
    "is_busy": true,
    "can_add_new_tasks": false,
    "auto_reset_enabled": true
  }
}
```

#### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| status | string | 模块状态: `running` 或 `idle` |
| queue_processing | boolean | 队列处理器是否正在运行 |
| queue_size | integer | 队列中待处理任务数量 |
| message | string | 状态描述信息 |
| total_tasks | integer | 本次会话的初始任务总数 |
| completed_tasks | integer | 已完成任务数 |
| failed_tasks | integer | 失败任务数 |
| pending_tasks | integer | 待处理任务数 |
| running_tasks | integer | 正在执行的任务数 |
| completion_percentage | float | 完成百分比 |
| automation_info.is_busy | boolean | 模块是否忙碌 |
| automation_info.can_add_new_tasks | boolean | 是否可以添加新任务 |

#### curl示例

```bash
curl http://localhost:80/api/tasks/modules/image_generation/status
```

---

## 3. 前端集成指南

### 3.1 异步生成流程图

```
┌─────────────┐
│ 用户点击生成 │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ 调用任务创建接口     │
│ POST /api/tasks/create│
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 立即返回task_id      │
│ (响应时间<200ms)     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 开始轮询任务状态     │
│ (每2-5秒一次)        │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 检查任务状态         │
│ - pending: 继续轮询  │
│ - running: 显示进度  │
│ - completed: 完成    │
│ - failed: 显示错误   │
└─────────────────────┘
```

### 3.2 轮询策略建议

#### 单任务轮询

```javascript
async function pollTaskUntilComplete(taskId, options = {}) {
  const {
    pollInterval = 3000,      // 轮询间隔(毫秒)
    maxAttempts = 100,        // 最大轮询次数
    onProgress = null,        // 进度回调
    onComplete = null,        // 完成回调
    onError = null            // 错误回调
  } = options;
  
  let attempts = 0;
  
  const poll = async () => {
    try {
      const task = await getTaskStatus(taskId);
      
      // 任务完成
      if (task.status === 'completed') {
        if (onComplete) onComplete(task);
        return task;
      }
      
      // 任务失败
      if (task.status === 'failed') {
        const error = new Error(task.error_message || '任务失败');
        if (onError) onError(error);
        throw error;
      }
      
      // 任务进行中
      if (task.status === 'running' || task.status === 'pending') {
        if (onProgress) onProgress(task.progress, task.status);
        
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error('任务超时');
        }
        
        // 继续轮询
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        return poll();
      }
      
    } catch (error) {
      if (onError) onError(error);
      throw error;
    }
  };
  
  return poll();
}

// 使用示例
const taskId = await createImageGenerationTask('proj_123', 0, 'A sunset');

await pollTaskUntilComplete(taskId, {
  pollInterval: 3000,
  onProgress: (progress, status) => {
    console.log(`任务进度: ${progress}%, 状态: ${status}`);
    updateProgressBar(progress);
  },
  onComplete: (task) => {
    console.log('任务完成:', task);
    showSuccessMessage();
  },
  onError: (error) => {
    console.error('任务失败:', error);
    showErrorMessage(error.message);
  }
});
```


#### 批量任务轮询(推荐)

```javascript
async function pollBatchTasksUntilComplete(taskIds, options = {}) {
  const {
    pollInterval = 3000,
    maxAttempts = 100,
    onTaskUpdate = null,      // 单个任务更新回调
    onAllComplete = null,     // 所有任务完成回调
    onError = null
  } = options;
  
  let attempts = 0;
  let pendingTaskIds = [...taskIds];
  const completedTasks = new Map();
  const failedTasks = new Map();
  
  const poll = async () => {
    try {
      // 批量查询所有待处理任务
      const result = await getBatchTaskStatus(pendingTaskIds);
      
      // 处理每个任务的状态
      for (const task of result.tasks) {
        if (task.status === 'completed') {
          completedTasks.set(task.task_id, task);
          pendingTaskIds = pendingTaskIds.filter(id => id !== task.task_id);
          if (onTaskUpdate) onTaskUpdate(task);
        } else if (task.status === 'failed') {
          failedTasks.set(task.task_id, task);
          pendingTaskIds = pendingTaskIds.filter(id => id !== task.task_id);
          if (onTaskUpdate) onTaskUpdate(task);
        } else {
          // pending或running状态,继续轮询
          if (onTaskUpdate) onTaskUpdate(task);
        }
      }
      
      // 所有任务都已完成或失败
      if (pendingTaskIds.length === 0) {
        if (onAllComplete) {
          onAllComplete({
            completed: Array.from(completedTasks.values()),
            failed: Array.from(failedTasks.values())
          });
        }
        return {
          completed: Array.from(completedTasks.values()),
          failed: Array.from(failedTasks.values())
        };
      }
      
      // 检查超时
      attempts++;
      if (attempts >= maxAttempts) {
        throw new Error(`批量任务超时,还有 ${pendingTaskIds.length} 个任务未完成`);
      }
      
      // 继续轮询
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      return poll();
      
    } catch (error) {
      if (onError) onError(error);
      throw error;
    }
  };
  
  return poll();
}

// 使用示例 - 批量生成分镜图片
async function batchGenerateStoryboardImages(projectId, storyboards) {
  // 1. 批量提交任务
  const taskIds = [];
  for (const sb of storyboards) {
    try {
      const taskId = await createImageGenerationTask(
        projectId,
        sb.index,
        sb.prompt,
        { aspectRatio: '9:16' }
      );
      taskIds.push(taskId);
    } catch (error) {
      console.error(`提交分镜${sb.index}任务失败:`, error);
    }
  }
  
  console.log(`已提交 ${taskIds.length} 个任务`);
  
  // 2. 批量轮询任务状态
  const taskStatusMap = new Map();
  
  const result = await pollBatchTasksUntilComplete(taskIds, {
    pollInterval: 3000,
    onTaskUpdate: (task) => {
      taskStatusMap.set(task.task_id, task);
      
      // 更新UI
      const completedCount = Array.from(taskStatusMap.values())
        .filter(t => t.status === 'completed').length;
      const failedCount = Array.from(taskStatusMap.values())
        .filter(t => t.status === 'failed').length;
      
      updateBatchProgress(completedCount, failedCount, taskIds.length);
    },
    onAllComplete: ({ completed, failed }) => {
      console.log(`批量生成完成: 成功${completed.length}个, 失败${failed.length}个`);
      showBatchCompleteMessage(completed.length, failed.length);
    },
    onError: (error) => {
      console.error('批量轮询失败:', error);
      showErrorMessage(error.message);
    }
  });
  
  return result;
}
```

### 3.3 批量查询最佳实践

#### 合并同项目任务

```javascript
// 按项目分组任务ID
function groupTaskIdsByProject(tasks) {
  const groups = new Map();
  
  for (const task of tasks) {
    const projectId = task.data.project_id;
    if (!groups.has(projectId)) {
      groups.set(projectId, []);
    }
    groups.get(projectId).push(task.task_id);
  }
  
  return groups;
}

// 为每个项目单独轮询
async function pollTasksByProject(taskGroups) {
  const promises = [];
  
  for (const [projectId, taskIds] of taskGroups) {
    const promise = pollBatchTasksUntilComplete(taskIds, {
      onTaskUpdate: (task) => {
        updateProjectTaskUI(projectId, task);
      }
    });
    promises.push(promise);
  }
  
  return Promise.all(promises);
}
```

#### 动态调整轮询列表

```javascript
// 智能轮询 - 自动移除已完成的任务
async function smartPollTasks(initialTaskIds) {
  let activeTaskIds = [...initialTaskIds];
  const results = new Map();
  
  while (activeTaskIds.length > 0) {
    const batchResult = await getBatchTaskStatus(activeTaskIds);
    
    // 更新结果并移除已完成的任务
    const stillActive = [];
    
    for (const task of batchResult.tasks) {
      results.set(task.task_id, task);
      
      if (task.status === 'pending' || task.status === 'running') {
        stillActive.push(task.task_id);
      }
    }
    
    activeTaskIds = stillActive;
    
    if (activeTaskIds.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  return Array.from(results.values());
}
```


### 3.4 错误处理建议

#### 常见错误场景

```javascript
async function robustTaskCreation(projectId, storyboardIndex, prompt) {
  try {
    const taskId = await createImageGenerationTask(projectId, storyboardIndex, prompt);
    return { success: true, taskId };
    
  } catch (error) {
    // 1. 模块忙碌错误(409)
    if (error.message.includes('正在执行任务')) {
      return {
        success: false,
        error: 'module_busy',
        message: '系统正在处理其他任务,请稍后重试',
        retryable: true,
        retryAfter: 30000  // 30秒后重试
      };
    }
    
    // 2. 参数错误(400)
    if (error.message.includes('参数') || error.message.includes('验证')) {
      return {
        success: false,
        error: 'invalid_params',
        message: '参数错误,请检查输入',
        retryable: false
      };
    }
    
    // 3. 网络错误
    if (error.message.includes('网络') || error.message.includes('timeout')) {
      return {
        success: false,
        error: 'network_error',
        message: '网络连接失败,请检查网络',
        retryable: true,
        retryAfter: 5000
      };
    }
    
    // 4. 其他错误
    return {
      success: false,
      error: 'unknown_error',
      message: error.message,
      retryable: false
    };
  }
}

// 自动重试逻辑
async function createTaskWithRetry(projectId, storyboardIndex, prompt, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await robustTaskCreation(projectId, storyboardIndex, prompt);
    
    if (result.success) {
      return result.taskId;
    }
    
    if (!result.retryable) {
      throw new Error(result.message);
    }
    
    if (attempt < maxRetries) {
      console.log(`任务创建失败,${result.retryAfter}ms后重试 (${attempt}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, result.retryAfter));
    }
  }
  
  throw new Error('任务创建失败,已达到最大重试次数');
}
```

#### 页面刷新后状态恢复

```javascript
// 保存任务ID到localStorage
function saveTaskIds(projectId, taskIds) {
  const key = `project_${projectId}_tasks`;
  localStorage.setItem(key, JSON.stringify(taskIds));
}

// 从localStorage恢复任务ID
function loadTaskIds(projectId) {
  const key = `project_${projectId}_tasks`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

// 页面加载时恢复轮询
async function resumeTaskPolling(projectId) {
  const taskIds = loadTaskIds(projectId);
  
  if (taskIds.length === 0) {
    return;
  }
  
  console.log(`恢复 ${taskIds.length} 个任务的轮询`);
  
  // 先查询一次状态,过滤掉已完成的任务
  const result = await getBatchTaskStatus(taskIds);
  const activeTaskIds = result.tasks
    .filter(t => t.status === 'pending' || t.status === 'running')
    .map(t => t.task_id);
  
  if (activeTaskIds.length === 0) {
    // 所有任务都已完成,清理localStorage
    localStorage.removeItem(`project_${projectId}_tasks`);
    return;
  }
  
  // 继续轮询未完成的任务
  await pollBatchTasksUntilComplete(activeTaskIds, {
    onTaskUpdate: (task) => {
      updateTaskUI(task);
    },
    onAllComplete: () => {
      localStorage.removeItem(`project_${projectId}_tasks`);
    }
  });
}

// 在页面加载时调用
window.addEventListener('load', () => {
  const projectId = getCurrentProjectId();
  if (projectId) {
    resumeTaskPolling(projectId);
  }
});
```

---

## 4. 数据结构说明

### 4.1 data字段结构

#### 图片生成任务

```json
{
  "project_id": "proj_123",
  "storyboard_index": 0,
  "prompt": "A beautiful sunset over mountains",
  "character_images": [
    "https://example.com/char1.jpg",
    "https://example.com/char2.jpg"
  ],
  "aspect_ratio": "9:16",
  "subject_mappings": {
    "角色A": "character_1",
    "场景B": "scene_2"
  },
  "ref_storyboard_indexes": [1, 2],
  "ai_channel": "business"
}
```

#### 视频生成任务

```json
{
  "project_id": "proj_123",
  "storyboard_index": 0,
  "image_data": "https://example.com/source.jpg",
  "prompt": "Camera slowly zooms in",
  "subject_mappings": {
    "角色A": "character_1"
  },
  "source_image_index": 0
}
```

### 4.2 result字段结构

#### 图片生成结果

```json
{
  "media_url": "https://imgbed.example.com/abc123.jpg",
  "media_index": 0,
  "storyboard_index": 0
}
```

#### 视频生成结果

```json
{
  "media_url": "https://imgbed.example.com/video123.mp4",
  "media_index": 0,
  "storyboard_index": 0
}
```

### 4.3 错误信息格式

```json
{
  "detail": "图片生成失败: API rate limit exceeded"
}
```

或

```json
{
  "detail": {
    "success": false,
    "error": "task_ids数量不能超过100个",
    "max_allowed": 100,
    "received": 150
  }
}
```


---

## 5. 状态机说明

### 5.1 任务状态流转图

```
┌─────────┐
│ pending │  任务已创建,等待处理
└────┬────┘
     │
     ▼
┌─────────┐
│ running │  任务正在执行
└────┬────┘
     │
     ├──────────┐
     │          │
     ▼          ▼
┌───────────┐ ┌────────┐
│ completed │ │ failed │
└───────────┘ └────────┘
```

### 5.2 状态触发条件

| 状态 | 触发条件 | 说明 |
|------|---------|------|
| pending | 任务创建时 | 任务已插入数据库,等待处理器获取 |
| running | 处理器开始执行 | 任务从队列中取出,开始调用AI客户端 |
| completed | 任务执行成功 | AI生成成功,媒体已保存,项目数据已更新 |
| failed | 任务执行失败 | AI调用失败、下载失败或数据库更新失败 |
| cancelled | 用户取消任务 | (预留功能,当前未实现) |

### 5.3 异常状态处理

#### 服务器重启

- **pending状态**: 自动恢复到队列,继续处理
- **running状态**: 重置为pending,重新执行
- **completed/failed状态**: 保持不变

#### 任务超时

- 前端轮询超时(如5分钟无响应): 停止轮询,提示用户稍后查看
- 任务仍在后台执行,不会丢失
- 用户可通过任务ID继续查询状态

---

## 6. 并发控制说明

### 6.1 并发限制配置

```python
# config/default.py
MODULE_CONCURRENCY_LIMITS = {
    'image_generation': 2,   # 图片生成最多2个并发
    'video_generation': 10,  # 视频生成最多10个并发
}
```

### 6.2 队列排队机制

```
图片生成队列:
┌─────────────────────────────────────┐
│ 任务1 (running) │ 任务2 (running)   │  ← 并发槽位(2/2)
├─────────────────────────────────────┤
│ 任务3 (pending) │ 任务4 (pending)   │  ← 等待队列
│ 任务5 (pending) │ 任务6 (pending)   │
└─────────────────────────────────────┘

当任务1完成后:
┌─────────────────────────────────────┐
│ 任务2 (running) │ 任务3 (running)   │  ← 任务3自动开始
├─────────────────────────────────────┤
│ 任务4 (pending) │ 任务5 (pending)   │
│ 任务6 (pending) │                   │
└─────────────────────────────────────┘
```

### 6.3 预估等待时间计算

```javascript
function estimateWaitTime(moduleStatus) {
  const {
    queue_size,
    running_tasks,
    total_tasks,
    completed_tasks
  } = moduleStatus;
  
  // 获取并发限制
  const concurrencyLimit = moduleStatus.module_name === 'image_generation' ? 2 : 10;
  
  // 计算平均任务处理时间(秒)
  const avgTaskTime = moduleStatus.module_name === 'image_generation' ? 30 : 60;
  
  // 预估等待时间 = (队列大小 / 并发数) * 平均任务时间
  const estimatedSeconds = Math.ceil((queue_size / concurrencyLimit) * avgTaskTime);
  
  return {
    seconds: estimatedSeconds,
    minutes: Math.ceil(estimatedSeconds / 60),
    formatted: formatDuration(estimatedSeconds)
  };
}

function formatDuration(seconds) {
  if (seconds < 60) {
    return `${seconds}秒`;
  } else if (seconds < 3600) {
    return `${Math.ceil(seconds / 60)}分钟`;
  } else {
    return `${Math.ceil(seconds / 3600)}小时`;
  }
}

// 使用示例
const status = await fetch('/api/tasks/modules/image_generation/status').then(r => r.json());
const waitTime = estimateWaitTime(status);
console.log(`预计等待时间: ${waitTime.formatted}`);
```

---

## 7. 测试场景

### 7.1 单个任务提交测试

```javascript
// 测试图片生成
async function testSingleImageGeneration() {
  console.log('测试: 单个图片生成任务');
  
  const taskId = await createImageGenerationTask('test_proj', 0, 'A sunset');
  console.log('任务已创建:', taskId);
  
  const result = await pollTaskUntilComplete(taskId, {
    onProgress: (progress) => console.log(`进度: ${progress}%`)
  });
  
  console.log('任务完成:', result);
}

// 测试视频生成
async function testSingleVideoGeneration() {
  console.log('测试: 单个视频生成任务');
  
  const taskId = await createVideoGenerationTask(
    'test_proj',
    0,
    'https://example.com/image.jpg',
    'Camera zooms in'
  );
  console.log('任务已创建:', taskId);
  
  const result = await pollTaskUntilComplete(taskId, {
    onProgress: (progress) => console.log(`进度: ${progress}%`)
  });
  
  console.log('任务完成:', result);
}
```

### 7.2 批量任务提交测试

```javascript
async function testBatchGeneration() {
  console.log('测试: 批量提交10个图片生成任务');
  
  const taskIds = [];
  for (let i = 0; i < 10; i++) {
    const taskId = await createImageGenerationTask(
      'test_proj',
      i,
      `Storyboard ${i}`
    );
    taskIds.push(taskId);
    console.log(`任务${i+1}已创建:`, taskId);
  }
  
  console.log(`已提交 ${taskIds.length} 个任务,开始批量轮询`);
  
  const result = await pollBatchTasksUntilComplete(taskIds, {
    onTaskUpdate: (task) => {
      console.log(`任务更新: ${task.task_id} - ${task.status}`);
    }
  });
  
  console.log('批量任务完成:', result);
}
```

### 7.3 并发限制验证

```javascript
async function testConcurrencyLimit() {
  console.log('测试: 并发限制验证');
  
  // 提交5个图片生成任务(并发限制为2)
  const taskIds = [];
  for (let i = 0; i < 5; i++) {
    const taskId = await createImageGenerationTask('test_proj', i, `Test ${i}`);
    taskIds.push(taskId);
  }
  
  // 立即查询模块状态
  const status = await fetch('/api/tasks/modules/image_generation/status')
    .then(r => r.json());
  
  console.log('模块状态:', status);
  console.log(`队列大小: ${status.queue_size}`);
  console.log(`正在执行: ${status.running_tasks}`);
  console.log(`待处理: ${status.pending_tasks}`);
  
  // 验证: running_tasks应该不超过2
  if (status.running_tasks <= 2) {
    console.log('✓ 并发限制验证通过');
  } else {
    console.error('✗ 并发限制验证失败');
  }
}
```


### 7.4 失败重试验证

```javascript
async function testFailureRetry() {
  console.log('测试: 失败重试机制');
  
  // 提交一个可能失败的任务(使用无效参数)
  const taskId = await createImageGenerationTask(
    'test_proj',
    0,
    ''  // 空提示词可能导致失败
  );
  
  const result = await pollTaskUntilComplete(taskId, {
    onProgress: (progress, status) => {
      console.log(`状态: ${status}, 进度: ${progress}%`);
    },
    onError: (error) => {
      console.log('任务失败:', error.message);
    }
  }).catch(error => {
    console.log('捕获到失败:', error.message);
    return null;
  });
  
  if (result && result.status === 'failed') {
    console.log('✓ 失败处理验证通过');
  }
}
```

### 7.5 页面刷新后状态恢复测试

```javascript
async function testStateRecovery() {
  console.log('测试: 页面刷新后状态恢复');
  
  // 1. 提交任务并保存到localStorage
  const taskIds = [];
  for (let i = 0; i < 3; i++) {
    const taskId = await createImageGenerationTask('test_proj', i, `Test ${i}`);
    taskIds.push(taskId);
  }
  saveTaskIds('test_proj', taskIds);
  console.log('已保存任务ID到localStorage');
  
  // 2. 模拟页面刷新(实际测试时需要手动刷新页面)
  console.log('请刷新页面,然后调用 resumeTaskPolling("test_proj")');
  
  // 3. 恢复轮询
  await resumeTaskPolling('test_proj');
  console.log('✓ 状态恢复验证通过');
}
```

---

## 8. 常见问题FAQ

### 8.1 任务超时如何处理?

**问题**: 前端轮询5分钟后仍未完成,如何处理?

**答案**:
- 任务仍在后台执行,不会丢失
- 停止轮询,提示用户"任务正在后台处理,请稍后查看"
- 用户可以通过任务ID继续查询状态
- 或者使用项目任务列表接口查看所有任务

```javascript
// 超时后的处理
async function handleTimeout(taskId) {
  // 停止轮询
  clearInterval(pollInterval);
  
  // 提示用户
  showMessage('任务正在后台处理,请稍后查看');
  
  // 保存任务ID供后续查询
  saveTaskIdForLater(taskId);
}
```

### 8.2 如何取消任务?

**问题**: 用户想取消正在排队或执行中的任务

**答案**:
- 当前版本暂不支持任务取消功能
- 该功能已预留,将在未来版本中实现
- 临时方案: 等待任务完成后删除生成的媒体

### 8.3 如何查看队列积压情况?

**问题**: 如何知道当前有多少任务在排队?

**答案**:
使用模块状态查询接口:

```javascript
async function checkQueueStatus() {
  const status = await fetch('/api/tasks/modules/image_generation/status')
    .then(r => r.json());
  
  console.log(`队列大小: ${status.queue_size}`);
  console.log(`正在执行: ${status.running_tasks}`);
  console.log(`待处理: ${status.pending_tasks}`);
  console.log(`完成进度: ${status.completion_percentage}%`);
  
  // 预估等待时间
  const waitTime = estimateWaitTime(status);
  console.log(`预计等待: ${waitTime.formatted}`);
}
```

### 8.4 如何优化轮询性能?

**问题**: 大量任务时轮询导致服务器压力大

**答案**:
1. **使用批量查询接口**: 一次查询最多100个任务
2. **动态调整轮询间隔**: 根据任务状态调整
3. **移除已完成任务**: 只轮询pending和running状态的任务

```javascript
// 智能轮询间隔
function getSmartPollInterval(taskStatus) {
  if (taskStatus === 'pending') {
    return 5000;  // pending状态5秒轮询一次
  } else if (taskStatus === 'running') {
    return 2000;  // running状态2秒轮询一次
  }
  return 3000;  // 默认3秒
}

// 批量查询 + 动态移除
async function optimizedPoll(taskIds) {
  let activeIds = [...taskIds];
  
  while (activeIds.length > 0) {
    const result = await getBatchTaskStatus(activeIds);
    
    // 只保留未完成的任务
    activeIds = result.tasks
      .filter(t => t.status === 'pending' || t.status === 'running')
      .map(t => t.task_id);
    
    if (activeIds.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}
```

### 8.5 任务失败后如何重试?

**问题**: 任务失败后想重新生成

**答案**:
重新提交任务即可:

```javascript
async function retryFailedTask(failedTask) {
  console.log('重试失败的任务:', failedTask.task_id);
  
  // 使用原始参数重新提交
  const newTaskId = await createImageGenerationTask(
    failedTask.data.project_id,
    failedTask.data.storyboard_index,
    failedTask.data.prompt,
    {
      characterImages: failedTask.data.character_images,
      aspectRatio: failedTask.data.aspect_ratio,
      aiChannel: failedTask.data.ai_channel
    }
  );
  
  console.log('新任务已创建:', newTaskId);
  return newTaskId;
}
```

### 8.6 如何处理模块忙碌错误(409)?

**问题**: 提交任务时返回409错误"模块正在执行任务"

**答案**:
等待当前任务完成后再提交:

```javascript
async function submitWhenReady(projectId, storyboardIndex, prompt) {
  const maxRetries = 10;
  const retryInterval = 5000;  // 5秒
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const taskId = await createImageGenerationTask(projectId, storyboardIndex, prompt);
      return taskId;
    } catch (error) {
      if (error.message.includes('正在执行任务')) {
        console.log(`模块忙碌,${retryInterval/1000}秒后重试 (${i+1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryInterval));
      } else {
        throw error;
      }
    }
  }
  
  throw new Error('模块持续忙碌,请稍后再试');
}
```

---

## 9. 配置说明

### 9.1 MODULE_CONCURRENCY_LIMITS配置

**位置**: `config/default.py`

```python
MODULE_CONCURRENCY_LIMITS = {
    'image_generation': 2,   # 图片生成最多2个并发
    'video_generation': 10,  # 视频生成最多10个并发
}
```

**说明**:
- 控制每个模块同时处理的任务数量
- 图片生成限制较低(2个)是因为AI API配额限制
- 视频生成限制较高(10个)是因为处理时间较长
- 未配置的模块(如tdk、shopify)无并发限制

### 9.2 运行时配置更新

**位置**: `config/runtime.json`

```json
{
  "MODULE_CONCURRENCY_LIMITS": {
    "image_generation": 3,
    "video_generation": 15
  }
}
```

**说明**:
- 运行时配置优先级最高
- 修改后需要重启服务生效
- 可根据实际API配额动态调整


### 9.3 AI客户端配置

**位置**: `config/default.py`

```python
AI_PROXY = {
    # 图文生图渠道选择
    'image_generation_channel': 'gcp',  # 'gcp', 'antigravity' 或 'business'
    
    # GCP渠道配置
    'gcp': {
        'base_url': 'https://aiplatform.googleapis.com',
        'api_key': 'YOUR_API_KEY',
        'timeout': 300,
        'default_image_model': 'gemini-3.1-flash-image-preview',
        'max_retries': 1,
        'retry_delay': 1.0
    },
    
    # Business渠道配置
    'business': {
        'base_url': 'http://50.114.206.152:7899',
        'api_key': 'YOUR_API_KEY',
        'timeout': 300,
        'default_model': 'gemini-3-pro-preview'
    },
    
    # Grok渠道配置(视频生成)
    'grok': {
        'base_url': 'http://43.166.240.23:18000',
        'api_key': 'YOUR_API_KEY',
        'timeout': 300
    }
}
```

**重要参数**:
- `max_retries`: 最大重试次数(默认1次,避免风控后扣除额度)
- `timeout`: 请求超时时间(秒)
- `retry_delay`: 重试延迟(秒)

### 9.4 TASK_RETENTION_DAYS配置

**位置**: `config/default.py`

```python
TASK_RETENTION_DAYS = 30  # 任务保留天数
```

**说明**:
- 已完成和失败的任务保留30天后自动清理
- 清理操作每天凌晨自动执行
- pending和running状态的任务不会被清理

---

## 10. 版本兼容性

### 10.1 与同步接口的兼容性

**同步接口保留**:
- 现有的同步图片生成接口(在`api/youtube.py`中)继续可用
- 现有的同步视频生成接口继续可用
- 异步接口与同步接口共享相同的AI客户端和配置

**迁移建议**:
1. **新功能优先使用异步接口**: 批量生成、长时间操作
2. **单个快速生成可继续使用同步接口**: 简单场景
3. **逐步迁移**: 不需要一次性全部迁移

### 10.2 向后兼容保证

**TaskManager扩展**:
- 核心方法签名未改变
- 并发控制通过配置启用
- 未配置的模块(tdk、shopify)不受影响

**数据库兼容**:
- 复用现有的`task_manager_tasks`表
- 不修改表结构
- 新旧任务可以共存

**API兼容**:
- 所有接口都复用现有的`/api/tasks/*`路由
- 响应格式保持一致
- 新增的批量查询接口不影响现有接口

### 10.3 迁移示例

#### 从同步接口迁移到异步接口

**❌ 旧方式（同步，必须停止使用）**:
```javascript
// 旧接口 - 阻塞30-120秒，导致429错误
async function generateImageOld(projectId, storyboardIndex, prompt) {
  const response = await fetch(
    `/api/youtube/projects/${projectId}/generate/image`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storyboard_index: storyboardIndex,
        prompt: prompt,
        aspect_ratio: '9:16'
      })
    }
  );
  
  // 等待30-120秒才返回
  const result = await response.json();
  return result.image_url;
}

// 批量生成 - 串行等待，非常慢
async function batchGenerateOld(projectId, storyboards) {
  const results = [];
  for (const sb of storyboards) {
    // 每个任务等待30-120秒
    const url = await generateImageOld(projectId, sb.index, sb.prompt);
    results.push(url);
  }
  return results;  // 10个任务需要5-20分钟！
}
```

**✅ 新方式（异步，推荐使用）**:
```javascript
// 新接口 - 立即返回(<200ms)
async function generateImageNew(projectId, storyboardIndex, prompt) {
  // 1. 提交任务（立即返回）
  const response = await fetch('/api/tasks/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      module_name: 'image_generation',
      task_type: 'generate_storyboard_image',
      data: {
        project_id: projectId,
        storyboard_index: storyboardIndex,
        prompt: prompt,
        aspect_ratio: '9:16'
      }
    })
  });
  
  const { task_id } = await response.json();
  
  // 2. 轮询任务状态（非阻塞）
  const result = await pollTaskUntilComplete(task_id, {
    onProgress: (progress) => {
      console.log(`任务进度: ${progress}%`);
      updateProgressBar(progress);  // 更新UI
    }
  });
  
  return result.media_url;
}

// 批量生成 - 并发处理，快速
async function batchGenerateNew(projectId, storyboards) {
  // 1. 批量提交所有任务（几秒内完成）
  const taskIds = await Promise.all(
    storyboards.map(sb => 
      fetch('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_name: 'image_generation',
          task_type: 'generate_storyboard_image',
          data: {
            project_id: projectId,
            storyboard_index: sb.index,
            prompt: sb.prompt,
            aspect_ratio: '9:16'
          }
        })
      }).then(r => r.json()).then(d => d.task_id)
    )
  );
  
  console.log(`已提交 ${taskIds.length} 个任务`);
  
  // 2. 批量轮询（使用批量查询接口）
  const result = await pollBatchTasksUntilComplete(taskIds, {
    onTaskUpdate: (task) => {
      console.log(`任务 ${task.task_id}: ${task.status}`);
      updateTaskUI(task);  // 更新UI
    }
  });
  
  return result.completed.map(t => t.result.media_url);
  // 10个任务只需要2-5分钟（并发处理）
}
```

#### 关键差异对比

| 特性 | 旧接口（同步） | 新接口（异步） |
|------|---------------|---------------|
| 请求URL | `/api/youtube/projects/{id}/generate/image` | `/api/tasks/create` |
| 请求体格式 | `{storyboard_index, prompt, ...}` | `{module_name, task_type, data: {...}}` |
| 响应时间 | 30-120秒 | <200毫秒 |
| 返回内容 | `{image_url, ...}` | `{task_id}` |
| 批量处理 | 串行等待 | 并发处理 |
| 进度显示 | 无 | 支持 |
| 失败重试 | 需要前端重新请求 | 自动重试 |
| 服务器重启 | 任务丢失 | 自动恢复 |

#### 完整迁移示例

```javascript
// ============================================================================
// 完整的迁移示例：从旧接口迁移到新接口
// ============================================================================

// ❌ 旧代码（必须删除）
/*
async function handleGenerateClick() {
  showLoading();  // 显示加载中
  
  try {
    const response = await fetch(
      `/api/youtube/projects/${projectId}/generate/image`,
      {
        method: 'POST',
        body: JSON.stringify({
          storyboard_index: currentIndex,
          prompt: promptText,
          aspect_ratio: '9:16'
        })
      }
    );
    
    // 阻塞30-120秒
    const result = await response.json();
    
    hideLoading();
    displayImage(result.image_url);
  } catch (error) {
    hideLoading();
    showError(error.message);
  }
}
*/

// ✅ 新代码（推荐）
async function handleGenerateClick() {
  try {
    // 1. 提交任务（立即返回）
    const response = await fetch('/api/tasks/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module_name: 'image_generation',
        task_type: 'generate_storyboard_image',
        data: {
          project_id: projectId,
          storyboard_index: currentIndex,
          prompt: promptText,
          aspect_ratio: '9:16'
        }
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '任务创建失败');
    }
    
    const { task_id } = await response.json();
    
    // 2. 显示进度条（非阻塞）
    showProgressBar();
    
    // 3. 轮询任务状态
    const result = await pollTaskUntilComplete(task_id, {
      pollInterval: 3000,  // 每3秒查询一次
      onProgress: (progress, status) => {
        updateProgressBar(progress);
        updateStatusText(status);
      }
    });
    
    // 4. 显示结果
    hideProgressBar();
    displayImage(result.media_url);
    
  } catch (error) {
    hideProgressBar();
    showError(error.message);
  }
}

// 批量生成迁移示例
async function handleBatchGenerateClick() {
  const storyboards = getSelectedStoryboards();  // 获取选中的分镜
  
  try {
    // 1. 批量提交任务
    showBatchProgress(`正在提交 ${storyboards.length} 个任务...`);
    
    const taskIds = [];
    for (const sb of storyboards) {
      const response = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_name: 'image_generation',
          task_type: 'generate_storyboard_image',
          data: {
            project_id: projectId,
            storyboard_index: sb.index,
            prompt: sb.prompt,
            aspect_ratio: '9:16'
          }
        })
      });
      
      if (response.ok) {
        const { task_id } = await response.json();
        taskIds.push(task_id);
      }
    }
    
    showBatchProgress(`已提交 ${taskIds.length} 个任务，开始生成...`);
    
    // 2. 批量轮询
    const taskStatusMap = new Map();
    
    await pollBatchTasksUntilComplete(taskIds, {
      pollInterval: 3000,
      onTaskUpdate: (task) => {
        taskStatusMap.set(task.task_id, task);
        
        // 更新UI
        const completed = Array.from(taskStatusMap.values())
          .filter(t => t.status === 'completed').length;
        const failed = Array.from(taskStatusMap.values())
          .filter(t => t.status === 'failed').length;
        
        updateBatchProgress(completed, failed, taskIds.length);
      },
      onAllComplete: ({ completed, failed }) => {
        hideBatchProgress();
        showBatchResult(
          `生成完成！成功: ${completed.length}, 失败: ${failed.length}`
        );
        
        // 刷新项目数据
        refreshProjectData();
      }
    });
    
  } catch (error) {
    hideBatchProgress();
    showError(error.message);
  }
}
```

#### 迁移检查清单

- [ ] 删除所有对 `/api/youtube/projects/{id}/generate/image` 的调用
- [ ] 删除所有对 `/api/youtube/projects/{id}/generate/video` 的调用
- [ ] 实现 `POST /api/tasks/create` 任务创建逻辑
- [ ] 实现 `POST /api/tasks/batch-status` 批量查询逻辑
- [ ] 实现轮询函数 `pollTaskUntilComplete` 和 `pollBatchTasksUntilComplete`
- [ ] 更新UI显示进度条而非阻塞等待
- [ ] 测试单个任务提交和查询
- [ ] 测试批量任务提交和查询
- [ ] 测试页面刷新后状态恢复
- [ ] 测试错误处理（429、超时等）

---

## 11. 总结

### 11.1 核心优势

1. **高性能**: 支持大批量并发生成,响应时间<200ms
2. **高可靠**: 任务持久化,服务器重启自动恢复
3. **易集成**: 统一的REST API,完善的错误处理
4. **可监控**: 实时查询队列状态和任务进度
5. **可扩展**: 模块化设计,易于添加新的生成类型

### 11.2 最佳实践

1. **使用批量查询接口**: 减少HTTP请求数量
2. **动态调整轮询列表**: 移除已完成的任务
3. **合理设置轮询间隔**: 根据任务状态调整(2-5秒)
4. **保存任务ID**: 支持页面刷新后恢复
5. **错误处理**: 区分可重试和不可重试错误

### 11.3 注意事项

1. **并发限制**: 图片生成2个并发,视频生成10个并发
2. **任务超时**: 前端轮询建议设置5分钟超时
3. **模块忙碌**: 提交任务前检查模块状态,避免409错误
4. **批量查询限制**: 单次最多查询100个任务
5. **数据清理**: 已完成任务保留30天后自动清理

---

## 附录: 完整集成示例

```javascript
// ============================================================================
// 完整的前端集成示例
// ============================================================================

class MediaGenerationClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }
  
  // 创建图片生成任务
  async createImageTask(projectId, storyboardIndex, prompt, options = {}) {
    const response = await fetch(`${this.baseUrl}/api/tasks/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module_name: 'image_generation',
        task_type: 'generate_storyboard_image',
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
      const error = await response.json();
      throw new Error(error.detail || '任务创建失败');
    }
    
    const result = await response.json();
    return result.task_id;
  }
  
  // 批量查询任务状态
  async getBatchStatus(taskIds) {
    const response = await fetch(`${this.baseUrl}/api/tasks/batch-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_ids: taskIds })
    });
    
    if (!response.ok) {
      throw new Error('批量查询失败');
    }
    
    return await response.json();
  }
  
  // 批量轮询直到完成
  async pollBatchUntilComplete(taskIds, options = {}) {
    const {
      pollInterval = 3000,
      maxAttempts = 100,
      onTaskUpdate = null,
      onAllComplete = null
    } = options;
    
    let attempts = 0;
    let pendingIds = [...taskIds];
    const completed = [];
    const failed = [];
    
    while (pendingIds.length > 0 && attempts < maxAttempts) {
      const result = await this.getBatchStatus(pendingIds);
      
      const stillPending = [];
      for (const task of result.tasks) {
        if (task.status === 'completed') {
          completed.push(task);
          if (onTaskUpdate) onTaskUpdate(task);
        } else if (task.status === 'failed') {
          failed.push(task);
          if (onTaskUpdate) onTaskUpdate(task);
        } else {
          stillPending.push(task.task_id);
          if (onTaskUpdate) onTaskUpdate(task);
        }
      }
      
      pendingIds = stillPending;
      attempts++;
      
      if (pendingIds.length > 0) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }
    
    const result = { completed, failed };
    if (onAllComplete) onAllComplete(result);
    return result;
  }
  
  // 批量生成分镜图片
  async batchGenerateImages(projectId, storyboards, options = {}) {
    // 1. 批量提交任务
    const taskIds = [];
    for (const sb of storyboards) {
      try {
        const taskId = await this.createImageTask(
          projectId,
          sb.index,
          sb.prompt,
          options
        );
        taskIds.push(taskId);
      } catch (error) {
        console.error(`提交分镜${sb.index}失败:`, error);
      }
    }
    
    console.log(`已提交 ${taskIds.length} 个任务`);
    
    // 2. 批量轮询
    return await this.pollBatchUntilComplete(taskIds, {
      onTaskUpdate: (task) => {
        console.log(`任务更新: ${task.task_id} - ${task.status}`);
      },
      onAllComplete: ({ completed, failed }) => {
        console.log(`完成: ${completed.length}, 失败: ${failed.length}`);
      }
    });
  }
}

// 使用示例
const client = new MediaGenerationClient();

// 批量生成
const storyboards = [
  { index: 0, prompt: 'A beautiful sunset' },
  { index: 1, prompt: 'A mountain landscape' },
  { index: 2, prompt: 'A city skyline' }
];

const result = await client.batchGenerateImages('proj_123', storyboards, {
  aspectRatio: '9:16',
  aiChannel: 'business'
});

console.log('生成完成:', result);
```

---

**文档版本**: v1.0  
**最后更新**: 2024-01-01  
**维护者**: 开发团队
