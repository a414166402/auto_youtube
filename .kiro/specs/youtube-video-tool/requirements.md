# Requirements Document

## Introduction

YouTube AI视频制作工具模块，用于辅助用户从对标爆款YouTube视频中提取分镜、生成提示词、批量生成图片和视频，最终完成AI视频制作工作流。该模块将集成到现有的Next.js仪表板中，通过FastAPI后端提供核心功能。

## Glossary

- **Video_Project**: 一个完整的视频制作项目，包含原始视频URL、分镜数据、提示词、生成的图片和视频
- **Source_Storyboard**: 源视频分镜，从原始YouTube视频解析出的分镜，仅供参考展示，不影响后续流程
- **Innovation_Storyboard**: 微创新视频分镜，AI自动生成的提示词对应的分镜，数量与源视频分镜无关
- **Prompt**: 提示词，用于AI生成图片或视频的文本描述
- **Text_To_Image_Prompt**: 文生图提示词，用于文生图或图文生图接口的文本提示词
- **Image_To_Video_Prompt**: 图生视频提示词，用于从图片生成视频的文本提示词
- **Character_Reference**: 角色引用，在提示词编辑页面管理，作为图文生图接口的传入图片
- **Subject**: 主体，包括角色（Character）、物品（Object）、场景（Scene）三种类型
- **Subject_Description**: 主体描述，用于区分同类型的多个主体的简短文本说明
- **Global_Subject_Library**: 全局主体库，存储所有主体的参考图和描述信息，所有项目共享
- **Gemini_API**: Google的Gemini AI接口，用于解析视频并生成提示词
- **Grok_Imagine_API**: Grok的图生视频接口，用于批量生成视频
- **Generation_Result**: 生成结果，包含单次生成的图片或视频及其元数据
- **Optimistic_Lock**: 乐观锁，用于解决多用户同时操作同一项目时的数据覆盖问题
- **Data_Version**: 数据版本号，用于乐观锁机制的版本控制
- **Prompt_History**: 提示词历史版本，记录提示词的所有修改历史
- **Async_Task**: 异步任务，通过任务队列系统处理的媒体生成任务
- **Task_ID**: 任务标识符，用于查询和追踪异步任务状态的唯一ID
- **Task_Status**: 任务状态，包括pending（等待中）、running（执行中）、completed（已完成）、failed（失败）
- **Task_Queue_System**: 任务队列系统，管理异步任务的创建、执行、状态追踪和并发控制
- **Batch_Status_Query**: 批量状态查询，一次性查询多个任务状态的接口，最多支持100个任务
- **Concurrency_Limit**: 并发限制，图片生成最多2个并发，视频生成最多10个并发
- **Task_Polling**: 任务轮询，前端定期查询任务状态直到完成或失败的机制

## Requirements

### Requirement 1: 项目管理

**User Story:** As a 视频创作者, I want to 创建和管理视频制作项目, so that I can 组织和追踪我的AI视频制作工作流。

#### Acceptance Criteria

1. WHEN 用户点击创建项目按钮 THEN THE Video_Project_Manager SHALL 创建一个新项目并显示项目详情页面
2. WHEN 用户输入YouTube视频URL THEN THE Video_Project_Manager SHALL 验证URL格式并保存到项目中
3. WHEN 用户查看项目列表 THEN THE Video_Project_Manager SHALL 显示所有项目及其当前状态
4. WHEN 用户删除项目 THEN THE Video_Project_Manager SHALL 删除项目及其所有关联数据
5. THE Video_Project_Manager SHALL 为每个项目维护完整的工作流状态追踪
6. WHEN 用户查看项目列表 THEN THE Video_Project_Manager SHALL 显示两个分镜数：源视频总分镜数（来自分镜解析）和微创新视频总分镜数（来自提示词生成，依赖提示词是否已生成）

### Requirement 2: 视频下载与分镜解析

**User Story:** As a 视频创作者, I want to 下载对标视频并解析源视频分镜, so that I can 参考理解原视频结构。

#### Acceptance Criteria

1. WHEN 用户提交YouTube视频URL THEN THE Video_Downloader SHALL 下载视频并存储到服务器
2. WHEN 视频下载完成 THEN THE Storyboard_Parser SHALL 自动提取视频的关键帧信息作为源视频分镜
3. WHEN 用户查看源视频分镜列表 THEN THE Storyboard_Viewer SHALL 显示每个分镜的首帧和尾帧图片
4. WHEN 用户编辑源视频分镜 THEN THE Storyboard_Editor SHALL 允许用户输入该分镜的内容描述
5. WHEN 用户调整源视频分镜边界 THEN THE Storyboard_Editor SHALL 更新分镜的起止时间点
6. THE Storyboard_Parser SHALL 显示源视频总分镜数量
7. THE 源视频分镜解析 SHALL 仅供参考展示，不影响后续提示词生成和素材生成流程

### Requirement 3: AI提示词生成

**User Story:** As a 视频创作者, I want to 使用AI自动生成文生图和图生视频提示词, so that I can 快速获得高质量的创作素材。

#### Acceptance Criteria

1. WHEN 用户点击生成提示词按钮 THEN THE Prompt_Generator SHALL 调用Gemini API解析视频并返回提示词
2. WHEN Gemini API返回结果 THEN THE Prompt_Generator SHALL 生成微创新视频分镜及其对应的Text_To_Image_Prompt和Image_To_Video_Prompt
3. THE 微创新视频分镜数量 SHALL 由AI自动决定，与源视频分镜数量无关
4. THE Prompt_Generator SHALL 支持两个版本的提示词模板，用户可切换选择
5. WHEN 用户选择不同提示词版本 THEN THE Prompt_Generator SHALL 使用对应版本的模板重新生成
6. IF Gemini API调用失败 THEN THE Prompt_Generator SHALL 显示错误信息并允许重试

### Requirement 4: 提示词修正与编辑

**User Story:** As a 视频创作者, I want to 手动修正和编辑生成的提示词及角色引用, so that I can 确保提示词符合我的创作需求。

#### Acceptance Criteria

1. WHEN 用户查看提示词列表 THEN THE Prompt_Editor SHALL 显示所有微创新视频分镜的提示词（不显示分镜缩略图）
2. WHEN 用户点击编辑按钮 THEN THE Prompt_Editor SHALL 允许直接修改Text_To_Image_Prompt和Image_To_Video_Prompt
3. WHEN 用户输入修改建议 THEN THE Prompt_Editor SHALL 调用AI对话接口重新生成大改版提示词
4. WHEN 用户确认修改 THEN THE Prompt_Editor SHALL 保存更新后的提示词
5. THE Prompt_Editor SHALL 保留提示词的修改历史
6. WHEN 用户编辑角色引用 THEN THE Prompt_Editor SHALL 允许对角色引用进行增删改操作
7. THE 角色引用 SHALL 作为图片生成时图文生图接口的传入图片

### Requirement 5: 提示词结构化

**User Story:** As a 视频创作者, I want to 将提示词转换为结构化JSON数据, so that I can 供后续批量生成程序使用。

#### Acceptance Criteria

1. WHEN 用户确认提示词最终版本 THEN THE Prompt_Structurer SHALL 将提示词转换为JSON格式
2. THE Prompt_Structurer SHALL 在JSON中包含微创新分镜编号、提示词内容、角色引用信息
3. WHEN JSON包含角色引用 THEN THE Prompt_Structurer SHALL 关联对应的角色图片路径
4. THE Prompt_Structurer SHALL 验证JSON数据结构的完整性
5. WHEN 用户导出数据 THEN THE Prompt_Structurer SHALL 提供JSON文件下载

### Requirement 6: 文生图与图文生图批量生成（异步队列模式）

**User Story:** As a 视频创作者, I want to 批量生成分镜图片, so that I can 获得视频制作所需的图片素材。

#### Acceptance Criteria

1. WHEN 用户启动图片生成 THEN THE Image_Generator SHALL 调用异步任务创建接口（POST /api/tasks/create）并立即返回task_id
2. WHEN 提示词包含角色引用 THEN THE Image_Generator SHALL 在任务数据中包含character_images字段用于图文生图
3. WHEN 提示词不包含角色引用 THEN THE Image_Generator SHALL 在任务数据中不包含character_images字段用于纯文生图
4. WHEN 任务创建成功 THEN THE Image_Generator SHALL 保存task_id到本地存储以支持页面刷新后恢复
5. WHEN 任务创建失败返回409错误 THEN THE Image_Generator SHALL 显示"系统正在处理其他任务，请稍后重试"并在30秒后自动重试
6. THE Image_Generator SHALL 使用批量状态查询接口（POST /api/tasks/batch-status）轮询任务状态
7. THE Image_Generator SHALL 每3秒轮询一次任务状态，动态移除已完成或失败的任务
8. WHEN 任务状态为completed THEN THE Image_Selector SHALL 显示生成的图片供用户选择
9. WHEN 任务状态为failed THEN THE Image_Generator SHALL 显示错误信息并允许重新生成
10. WHEN 用户对图片不满意 THEN THE Image_Generator SHALL 创建新的异步任务并将新图片加入候选列表
11. WHEN 用户选择图片 THEN THE Image_Selector SHALL 将选中的图片标记为该分镜的最终图片
12. THE Image_Generator SHALL 支持最多2个并发图片生成任务，超出部分自动排队
13. THE 图片生成前置条件 SHALL 为提示词编辑完成（角色引用可选）

### Requirement 7: 图生视频批量生成（异步队列模式）

**User Story:** As a 视频创作者, I want to 从图片批量生成视频片段, so that I can 获得最终视频的素材。

#### Acceptance Criteria

1. WHEN 用户启动视频生成 THEN THE Video_Generator SHALL 调用异步任务创建接口（POST /api/tasks/create）并立即返回task_id
2. WHEN 创建视频生成任务 THEN THE Video_Generator SHALL 在任务数据中包含用户选定的图片URL和对应的image_to_video提示词
3. WHEN 任务创建成功 THEN THE Video_Generator SHALL 保存task_id到本地存储以支持页面刷新后恢复
4. WHEN 任务创建失败返回409错误 THEN THE Video_Generator SHALL 显示"系统正在处理其他任务，请稍后重试"并在30秒后自动重试
5. THE Video_Generator SHALL 使用批量状态查询接口（POST /api/tasks/batch-status）轮询任务状态
6. THE Video_Generator SHALL 每3秒轮询一次任务状态，动态移除已完成或失败的任务
7. WHEN 任务状态为completed THEN THE Video_Selector SHALL 显示生成的视频供用户选择
8. WHEN 任务状态为failed THEN THE Video_Generator SHALL 显示错误信息并允许重新生成
9. WHEN 用户对视频不满意 THEN THE Video_Generator SHALL 创建新的异步任务并将新视频加入候选列表
10. WHEN 用户选择视频 THEN THE Video_Selector SHALL 将选中的视频标记为该分镜的最终视频
11. THE Video_Generator SHALL 支持最多10个并发视频生成任务，超出部分自动排队
12. WHEN 所有分镜视频选择完成 THEN THE Video_Downloader SHALL 提供批量下载功能
13. THE 视频生成前置条件 SHALL 为：提示词编辑完成 + 所有分镜图片已生成 + 用户已为每个分镜选择一张图片

### Requirement 8: 生成进度与状态管理（基于异步任务）

**User Story:** As a 视频创作者, I want to 实时查看生成进度和状态, so that I can 了解工作流的执行情况。

#### Acceptance Criteria

1. WHEN 批量生成任务开始 THEN THE Progress_Tracker SHALL 显示整体进度百分比（已完成任务数/总任务数）
2. WHEN 批量状态查询返回结果 THEN THE Progress_Tracker SHALL 更新每个分镜的任务状态（pending/running/completed/failed）
3. WHEN 任务状态为running THEN THE Progress_Tracker SHALL 显示该任务的进度百分比（0-100）
4. WHEN 任务状态为failed THEN THE Progress_Tracker SHALL 显示错误信息并提供"重试"按钮
5. WHEN 用户点击重试 THEN THE Progress_Tracker SHALL 创建新的异步任务替换失败的任务
6. THE Progress_Tracker SHALL 每3秒调用批量状态查询接口更新所有任务状态
7. THE Progress_Tracker SHALL 只轮询pending和running状态的任务，自动移除completed和failed状态的任务
8. WHEN 用户刷新页面 THEN THE Progress_Tracker SHALL 从本地存储恢复task_id列表并继续轮询
9. WHEN 所有任务完成或失败 THEN THE Progress_Tracker SHALL 停止轮询并清理本地存储
10. THE Progress_Tracker SHALL 使用模块状态查询接口（GET /api/tasks/modules/{module_name}/status）显示队列积压情况

### Requirement 12: 异步任务队列系统

**User Story:** As a 视频创作者, I want to 使用异步队列处理大批量媒体生成任务, so that I can 避免长时间等待和任务丢失。

#### Acceptance Criteria

1. WHEN 前端调用任务创建接口 THEN THE Task_Queue_System SHALL 在200毫秒内返回task_id
2. THE Task_Queue_System SHALL 将图片生成任务的并发数限制为2个，超出部分自动排队
3. THE Task_Queue_System SHALL 将视频生成任务的并发数限制为10个，超出部分自动排队
4. WHEN 任务创建时模块正在执行任务 THEN THE Task_Queue_System SHALL 返回HTTP 409错误并提示等待时间
5. THE Task_Queue_System SHALL 支持批量查询最多100个任务的状态
6. WHEN 批量查询接口被调用 THEN THE Task_Queue_System SHALL 使用单个SQL查询返回所有任务状态
7. THE Task_Queue_System SHALL 持久化所有任务到数据库，服务器重启后自动恢复
8. WHEN 任务执行失败 THEN THE Task_Queue_System SHALL 自动重试最多3次
9. THE Task_Queue_System SHALL 保留已完成和失败的任务30天后自动清理
10. WHEN 查询单个任务状态 THEN THE Task_Queue_System SHALL 返回task_id、status、progress、created_at、started_at、completed_at、error_message和has_result字段
11. WHEN 任务状态为completed且has_result为true THEN THE Task_Queue_System SHALL 在result字段中包含media_url、media_index和storyboard_index
12. THE Task_Queue_System SHALL 支持通过项目ID查询该项目的所有生成任务列表

### Requirement 9: 并发冲突处理（乐观锁机制）

**User Story:** As a 视频创作者, I want to 在多人协作时避免数据覆盖, so that I can 确保我的修改不会丢失。

#### Acceptance Criteria

1. WHEN 后端返回HTTP 409 Conflict错误 THEN THE Conflict_Handler SHALL 显示友好的冲突提示信息
2. WHEN 发生数据冲突 THEN THE Conflict_Handler SHALL 提示用户"数据已被修改，请重新获取最新数据后重试"
3. WHEN 用户确认冲突提示 THEN THE Conflict_Handler SHALL 重新获取受影响的数据并更新UI，不刷新整个页面
4. THE Conflict_Handler SHALL 在以下操作中处理409错误：项目更新、媒体清理、分镜删除、分镜新增、分镜交换、版本切换
5. IF 发生409冲突 THEN THE Conflict_Handler SHALL 不丢失用户当前的输入内容（如可能）
6. WHEN 重新获取数据后 THEN THE Conflict_Handler SHALL 保持用户当前的滚动位置和页面状态
7. THE Conflict_Handler SHALL 只更新受影响的组件区域，不触发整个页面重新渲染

### Requirement 10: 提示词历史版本管理

**User Story:** As a 视频创作者, I want to 查看和管理提示词的历史版本, so that I can 追溯修改记录并在需要时恢复。

#### Acceptance Criteria

1. WHEN 用户查看项目详情 THEN THE Project_Viewer SHALL 默认只加载当前版本的提示词历史
2. WHEN 用户需要查看完整历史 THEN THE Project_Viewer SHALL 提供"查看全部历史"选项
3. WHEN 用户点击"查看全部历史" THEN THE Project_Viewer SHALL 调用API并传入full_history=true参数
4. THE Prompt_History_Viewer SHALL 显示每个历史版本的时间戳和修改类型
5. WHEN 用户选择历史版本 THEN THE Prompt_History_Viewer SHALL 显示该版本的完整提示词内容

### Requirement 11: 主体描述字段管理

**User Story:** As a 视频创作者, I want to 为主体添加描述信息, so that I can 在多个同类型主体时进行区分。

#### Acceptance Criteria

1. WHEN 用户查询主体列表 THEN THE Subject_Manager SHALL 返回每个主体的description字段（可为null）
2. WHEN 用户创建主体 THEN THE Subject_Manager SHALL 允许可选地输入description字段
3. WHEN 用户更新主体 THEN THE Subject_Manager SHALL 允许修改或清空description字段
4. WHEN 用户传递空字符串作为description THEN THE Subject_Manager SHALL 将description设置为null
5. WHEN 用户不传递description字段 THEN THE Subject_Manager SHALL 保持原有description值不变
6. THE Subject_Manager SHALL 支持description字段包含所有UTF-8字符（中文、英文、数字、emoji等）
7. WHEN 用户创建第2个同类型主体时 THEN THE Subject_UI SHALL 提示用户填写描述以区分多个主体
8. THE Subject_UI SHALL 在主体卡片上显示description字段内容（如果存在）
9. WHEN description为null THEN THE Subject_UI SHALL 显示"暂无描述"或类似提示

