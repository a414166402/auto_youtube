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
- **Gemini_API**: Google的Gemini AI接口，用于解析视频并生成提示词
- **Grok_Imagine_API**: Grok的图生视频接口，用于批量生成视频
- **Generation_Result**: 生成结果，包含单次生成的图片或视频及其元数据

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

### Requirement 6: 文生图与图文生图批量生成

**User Story:** As a 视频创作者, I want to 批量生成分镜图片, so that I can 获得视频制作所需的图片素材。

#### Acceptance Criteria

1. WHEN 用户启动图片生成 THEN THE Image_Generator SHALL 根据提示词数据批量调用生成接口
2. WHEN 提示词包含角色引用 THEN THE Image_Generator SHALL 使用角色引用图片调用图文生图接口（角色引用图片 + text_to_image提示词）
3. WHEN 提示词不包含角色引用 THEN THE Image_Generator SHALL 直接调用文生图接口（仅text_to_image提示词）
4. WHEN 图片生成完成 THEN THE Image_Selector SHALL 显示所有生成的图片供用户选择
5. WHEN 用户对图片不满意 THEN THE Image_Generator SHALL 允许重新生成并将新图片加入候选列表
6. WHEN 用户选择图片 THEN THE Image_Selector SHALL 将选中的图片标记为该分镜的最终图片
7. THE Image_Generator SHALL 支持并行生成多个分镜的图片
8. THE 图片生成前置条件 SHALL 为提示词编辑完成（角色引用可选）

### Requirement 7: 图生视频批量生成

**User Story:** As a 视频创作者, I want to 从图片批量生成视频片段, so that I can 获得最终视频的素材。

#### Acceptance Criteria

1. WHEN 用户启动视频生成 THEN THE Video_Generator SHALL 使用用户选定的图片和对应的image_to_video提示词调用Grok Imagine API
2. WHEN 视频生成完成 THEN THE Video_Selector SHALL 显示所有生成的视频供用户选择
3. WHEN 用户对视频不满意 THEN THE Video_Generator SHALL 允许重新生成并将新视频加入候选列表
4. WHEN 用户选择视频 THEN THE Video_Selector SHALL 将选中的视频标记为该分镜的最终视频
5. THE Video_Generator SHALL 支持并行生成多个分镜的视频
6. WHEN 所有分镜视频选择完成 THEN THE Video_Downloader SHALL 提供批量下载功能
7. THE 视频生成前置条件 SHALL 为：提示词编辑完成 + 所有分镜图片已生成 + 用户已为每个分镜选择一张图片

### Requirement 8: 生成进度与状态管理

**User Story:** As a 视频创作者, I want to 实时查看生成进度和状态, so that I can 了解工作流的执行情况。

#### Acceptance Criteria

1. WHEN 批量生成任务开始 THEN THE Progress_Tracker SHALL 显示整体进度百分比
2. WHEN 单个生成任务完成或失败 THEN THE Progress_Tracker SHALL 更新对应分镜的状态
3. IF 生成任务失败 THEN THE Progress_Tracker SHALL 显示错误信息并允许单独重试
4. THE Progress_Tracker SHALL 支持暂停和继续批量生成任务
5. WHEN 用户刷新页面 THEN THE Progress_Tracker SHALL 恢复显示当前任务状态

