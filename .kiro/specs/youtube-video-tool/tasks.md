# Implementation Plan: YouTube AI视频制作工具

## Overview

本实现计划将YouTube AI视频制作工具分为前端和后端两部分。由于用户要求先完成阶段一（接口设计）和阶段三（前端实现），本任务列表聚焦于Next.js前端的完整实现，包括API客户端层、类型定义、页面组件和状态管理。

后端FastAPI接口将在阶段二单独实现。

## Tasks

- [x] 1. 项目基础设施搭建
  - [x] 1.1 创建YouTube模块目录结构
    - 创建 `src/app/dashboard/youtube/` 目录及子目录
    - 创建 `src/app/api/youtube/` API代理路由
    - 创建 `src/lib/api/youtube.ts` API客户端
    - 创建 `src/types/youtube.ts` 类型定义
    - 创建 `src/components/youtube/` 组件目录
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 创建TypeScript类型定义
    - 定义 VideoProject, Storyboard, Prompt 等核心类型
    - 定义 API请求/响应类型
    - 定义 GenerationTask, CharacterMapping 等辅助类型
    - _Requirements: 1.1, 2.1, 3.1, 5.1, 6.1, 7.1, 8.1_

  - [x] 1.3 创建API代理路由
    - 实现 `src/app/api/youtube/[...path]/route.ts`
    - 支持 GET, POST, PUT, DELETE 方法代理
    - 添加超时处理和错误处理
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.4 创建API客户端函数
    - 实现项目管理API函数
    - 实现分镜管理API函数
    - 实现提示词管理API函数
    - 实现图片/视频生成API函数
    - 实现任务状态API函数
    - _Requirements: 1.1-1.5, 2.1-2.6, 3.1-3.5, 7.1-7.7, 8.1-8.6, 9.1-9.5_

- [x] 2. YouTube模块导航和布局
  - [x] 2.1 创建YouTube导航组件
    - 创建 `src/components/nav-youtube.tsx`
    - 包含项目列表、设置等导航项
    - 支持当前路径高亮
    - _Requirements: 1.3_

  - [x] 2.2 创建YouTube模块布局
    - 创建 `src/app/dashboard/youtube/layout.tsx`
    - 添加模块元数据
    - _Requirements: 1.3_

  - [x] 2.3 创建模块入口页面
    - 创建 `src/app/dashboard/youtube/page.tsx`
    - 重定向到项目列表页
    - _Requirements: 1.3_

- [x] 3. Checkpoint - 基础设施验证
  - 确保目录结构正确创建
  - 确保类型定义无编译错误
  - 确保API代理路由可访问
  - 如有问题请询问用户

- [x] 4. 项目列表页面实现
  - [x] 4.1 创建项目列表页面
    - 创建 `src/app/dashboard/youtube/projects/page.tsx`
    - 实现项目卡片网格布局
    - 显示项目缩略图、名称、状态、分镜数量
    - 实现分页功能
    - _Requirements: 1.3_

  - [x] 4.2 创建项目创建对话框组件
    - 创建 `src/components/youtube/create-project-dialog.tsx`
    - 包含项目名称和YouTube URL输入
    - 实现URL格式验证
    - 调用创建项目API
    - _Requirements: 1.1, 1.2_

  - [x] 4.3 创建项目卡片组件
    - 创建 `src/components/youtube/project-card.tsx`
    - 显示项目状态徽章
    - 包含查看和删除操作
    - _Requirements: 1.3, 1.4_

  - [x] 4.4 编写项目列表页面单元测试
    - 测试项目列表渲染
    - 测试创建对话框交互
    - 测试删除确认流程
    - _Requirements: 1.1, 1.3, 1.4_

- [x] 5. 项目详情/工作流页面实现
  - [x] 5.1 创建项目详情页面
    - 更新 `src/app/dashboard/youtube/project/[projectId]/page.tsx`
    - 实现工作流进度条组件
    - 显示6个步骤的状态卡片
    - 获取并显示项目详情数据
    - _Requirements: 1.3, 1.5_

  - [x] 5.2 创建工作流步骤组件
    - 创建 `src/components/youtube/workflow-step.tsx`
    - 支持不同状态显示（完成、进行中、待开始）
    - 包含操作按钮和进度显示
    - _Requirements: 1.5, 9.1_

  - [x] 5.3 实现视频下载功能
    - 添加下载按钮和状态显示
    - 实现下载进度轮询
    - 处理下载完成/失败状态
    - _Requirements: 2.1, 2.2_

- [x] 6. 分镜编辑页面实现
  - [x] 6.1 创建分镜编辑页面
    - 更新 `src/app/dashboard/youtube/storyboard/[projectId]/page.tsx`
    - 显示分镜列表
    - 显示总分镜数量
    - _Requirements: 2.3, 2.6_

  - [x] 6.2 创建分镜卡片组件
    - 创建 `src/components/youtube/storyboard-card.tsx`
    - 显示首帧和尾帧图片
    - 包含时间范围显示
    - 包含描述输入框
    - _Requirements: 2.3, 2.4_

  - [x] 6.3 创建时间调整对话框
    - 创建 `src/components/youtube/time-adjust-dialog.tsx`
    - 支持调整分镜起止时间
    - 验证时间有效性
    - _Requirements: 2.5_

  - [x] 6.4 编写分镜编辑页面单元测试

    - 测试分镜列表渲染
    - 测试描述保存功能
    - 测试时间调整功能
    - _Requirements: 2.3, 2.4, 2.5_

- [x] 7. Checkpoint - 页面基础功能验证
  - 确保项目详情页面正常显示
  - 确保分镜编辑页面正常显示
  - 如有问题请询问用户


- [x] 8. 提示词编辑页面实现
  - [x] 8.1 创建提示词编辑页面
    - 更新 `src/app/dashboard/youtube/prompts/[projectId]/page.tsx`
    - 显示提示词列表
    - 支持版本切换（V1/V2）
    - 包含导出JSON按钮
    - _Requirements: 3.3, 4.1, 6.5_

  - [x] 8.2 创建提示词卡片组件
    - 创建 `src/components/youtube/prompt-card.tsx`
    - 显示分镜缩略图
    - 显示文生图和图生视频提示词
    - 显示角色引用标签
    - 显示编辑状态标记
    - _Requirements: 3.2, 4.1, 5.4_

  - [x] 8.3 创建提示词编辑对话框
    - 创建 `src/components/youtube/prompt-edit-dialog.tsx`
    - 支持直接编辑两种提示词
    - 支持输入AI修改建议
    - 调用AI重新生成API
    - _Requirements: 4.2, 4.3_

  - [x] 8.4 创建提示词历史查看组件
    - 创建 `src/components/youtube/prompt-history.tsx`
    - 显示修改历史列表
    - 支持查看历史版本内容
    - _Requirements: 4.5_

  - [x] 8.5 编写提示词编辑页面单元测试

    - 测试提示词列表渲染
    - 测试版本切换功能
    - 测试编辑保存功能
    - **Property 6: 提示词版本切换**
    - **Validates: Requirements 3.3, 3.4**

- [x] 9. 角色映射配置页面实现
  - [x] 9.1 创建角色映射配置页面
    - 更新 `src/app/dashboard/youtube/settings/page.tsx`
    - 显示项目选择下拉框
    - 显示角色映射列表
    - _Requirements: 5.1, 5.2_

  - [x] 9.2 创建角色映射卡片组件
    - 创建 `src/components/youtube/character-mapping-card.tsx`
    - 显示角色编号和标识
    - 包含名称输入框
    - 包含图片上传区域
    - _Requirements: 5.2, 5.3_

  - [x] 9.3 实现角色图片上传功能
    - 支持图片拖拽上传
    - 显示上传预览
    - 调用上传API
    - _Requirements: 5.3_

  - [x] 9.4 编写角色映射页面单元测试

    - 测试默认映射显示
    - 测试映射修改保存
    - 测试图片上传功能
    - **Property 8: 角色映射应用**
    - **Validates: Requirements 5.3, 5.4, 5.5, 6.3**

- [x] 10. 图片生成页面实现（异步队列模式）
  - [x] 10.1 创建素材生成页面
    - 更新 `src/app/dashboard/youtube/generate/[projectId]/page.tsx`
    - 实现图片生成和视频生成两个Tab
    - 显示整体生成进度条
    - 包含暂停/继续/取消按钮
    - _Requirements: 6.1, 8.1, 8.10_

  - [x] 10.2 创建图片生成分镜卡片组件
    - 创建 `src/components/youtube/image-generation-card.tsx`
    - 显示分镜状态（已选择/生成中/待生成）
    - 显示生成的图片网格
    - 支持图片选择
    - 包含重新生成按钮（创建新异步任务）
    - _Requirements: 6.8, 6.10, 6.11_

  - [x] 10.3 创建图片选择器组件
    - 创建 `src/components/youtube/image-selector.tsx`
    - 支持点击选择图片
    - 显示选中状态
    - 支持图片预览放大
    - _Requirements: 6.11_

  - [x] 10.4 实现异步任务创建逻辑
    - 更新 `src/lib/api/youtube.ts` 添加任务创建函数
    - 调用 POST /api/tasks/create 接口
    - 处理成功响应并保存task_id
    - 处理409错误并实现30秒后自动重试
    - 将task_id保存到localStorage支持页面刷新恢复
    - _Requirements: 6.1, 6.4, 6.5, 6.8_

  - [x] 10.5 实现批量任务状态查询
    - 更新 `src/lib/api/youtube.ts` 添加批量状态查询函数
    - 调用 POST /api/tasks/batch-status 接口
    - 支持一次查询最多100个任务
    - 处理not_found任务列表
    - _Requirements: 6.6, 6.7_

  - [x] 10.6 实现任务轮询逻辑
    - 更新 `src/hooks/use-task-polling.ts`
    - 每3秒调用批量状态查询接口
    - 动态移除completed和failed状态的任务
    - 只轮询pending和running状态的任务
    - 所有任务完成后停止轮询并清理localStorage
    - _Requirements: 6.7, 8.6, 8.7, 8.8, 8.9_

  - [x] 10.7 实现页面刷新后状态恢复
    - 从localStorage读取task_id列表
    - 调用批量状态查询接口恢复任务状态
    - 继续轮询未完成的任务
    - _Requirements: 6.4, 8.8_

  - [ ]* 10.8 编写图片生成页面单元测试
    - 测试异步任务创建
    - 测试批量状态查询
    - 测试任务轮询逻辑
    - 测试409错误自动重试
    - 测试页面刷新后状态恢复
    - 测试图片选择功能
    - 测试重新生成功能
    - **Property 11: 重新生成增加候选**
    - **Property 12: 选择标记唯一性**
    - **Property 25: 异步任务创建响应时间**
    - **Property 26: 批量状态查询性能**
    - **Validates: Requirements 6.1, 6.4, 6.5, 6.6, 6.7, 6.8, 6.10, 6.11**

- [x] 11. 视频生成功能实现（异步队列模式）
  - [x] 11.1 创建视频生成分镜卡片组件
    - 创建 `src/components/youtube/video-generation-card.tsx`
    - 显示源图片缩略图
    - 显示生成的视频列表
    - 支持视频播放预览
    - 支持视频选择
    - 包含重新生成按钮（创建新异步任务）
    - _Requirements: 7.1, 7.7, 7.8, 7.9, 7.10_

  - [x] 11.2 创建视频播放器组件
    - 创建 `src/components/youtube/video-player.tsx`
    - 支持视频播放控制
    - 支持全屏播放
    - _Requirements: 7.7_

  - [x] 11.3 实现异步任务创建逻辑
    - 更新 `src/lib/api/youtube.ts` 添加视频任务创建函数
    - 调用 POST /api/tasks/create 接口
    - 处理成功响应并保存task_id
    - 处理409错误并实现30秒后自动重试
    - 将task_id保存到localStorage支持页面刷新恢复
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 11.4 实现批量任务状态查询
    - 复用图片生成的批量状态查询函数
    - 支持视频生成任务的状态查询
    - _Requirements: 7.5, 7.6_

  - [x] 11.5 实现任务轮询逻辑
    - 复用 `src/hooks/use-task-polling.ts`
    - 每3秒调用批量状态查询接口
    - 动态移除completed和failed状态的任务
    - 只轮询pending和running状态的任务
    - 所有任务完成后停止轮询并清理localStorage
    - _Requirements: 7.6, 8.6, 8.7, 8.8, 8.9_

  - [x] 11.6 实现批量下载功能
    - 添加下载所有选中视频按钮
    - 显示下载进度
    - 处理下载完成提示
    - _Requirements: 7.12_

  - [ ]* 11.7 编写视频生成功能单元测试
    - 测试异步任务创建
    - 测试批量状态查询
    - 测试任务轮询逻辑
    - 测试409错误自动重试
    - 测试页面刷新后状态恢复
    - 测试视频列表渲染
    - 测试视频选择功能
    - 测试下载功能
    - **Property 12: 选择标记唯一性**
    - **Property 25: 异步任务创建响应时间**
    - **Property 26: 批量状态查询性能**
    - **Validates: Requirements 7.1, 7.3, 7.4, 7.5, 7.6, 7.10**

- [x] 12. Checkpoint - 生成功能验证
  - 确保图片生成页面正常显示
  - 确保视频生成Tab正常显示
  - 确保异步任务创建和轮询正常工作
  - 确保进度条和状态更新正常
  - 如有问题请询问用户


- [x] 13. 任务状态管理实现（基于异步任务队列）
  - [x] 13.1 创建任务状态轮询Hook
    - 更新 `src/hooks/use-task-polling.ts`
    - 实现基于批量状态查询的轮询逻辑
    - 每3秒调用一次批量状态查询接口
    - 动态移除completed和failed状态的任务
    - 只轮询pending和running状态的任务
    - 所有任务完成后自动停止轮询
    - 支持暂停/恢复轮询
    - 处理任务完成/失败回调
    - _Requirements: 8.1, 8.2, 8.6, 8.7, 8.9_

  - [x] 13.2 创建进度条组件
    - 更新 `src/components/youtube/generation-progress.tsx`
    - 基于异步任务状态显示整体进度百分比
    - 显示已完成任务数/总任务数
    - 显示pending/running/completed/failed任务统计
    - 支持动画效果
    - _Requirements: 8.1, 8.2_

  - [x] 13.3 创建任务控制组件
    - 更新 `src/components/youtube/task-controls.tsx`
    - 包含暂停/继续/取消按钮
    - 根据任务状态显示/隐藏按钮
    - 暂停时停止轮询，继续时恢复轮询
    - _Requirements: 8.5_

  - [x] 13.4 实现模块状态查询和显示
    - 更新 `src/lib/api/youtube.ts` 添加模块状态查询函数
    - 调用 GET /api/tasks/modules/{module_name}/status 接口
    - 在生成页面显示队列积压情况
    - 显示模块是否忙碌和可否添加新任务
    - _Requirements: 8.10, 12.1, 12.2, 12.3_

  - [x] 13.5 实现localStorage任务持久化
    - 任务创建成功后保存task_id到localStorage
    - 页面刷新时从localStorage恢复task_id列表
    - 任务完成或失败后从localStorage移除
    - 所有任务完成后清理localStorage
    - _Requirements: 6.4, 7.3, 8.8_

  - [ ]* 13.6 编写任务状态管理单元测试
    - 测试批量状态查询轮询逻辑
    - 测试动态移除已完成任务
    - 测试进度计算
    - 测试状态转换
    - 测试localStorage持久化和恢复
    - 测试模块状态查询
    - **Property 13: 任务进度计算正确性**
    - **Property 14: 任务状态持久化**
    - **Property 27: 轮询动态优化**
    - **Property 28: 模块状态查询准确性**
    - **Validates: Requirements 8.1, 8.2, 8.6, 8.7, 8.8, 8.9, 8.10**

- [x] 14. 通用组件和工具函数
  - [x] 14.1 创建加载状态组件
    - 创建 `src/components/youtube/loading-skeleton.tsx`
    - 为各页面创建骨架屏
    - _Requirements: 1.3_

  - [x] 14.2 创建错误处理组件
    - 创建 `src/components/youtube/error-fallback.tsx`
    - 显示错误信息
    - 包含重试按钮
    - _Requirements: 3.5, 9.3_

  - [x] 14.3 创建确认对话框组件
    - 创建 `src/components/youtube/confirm-dialog.tsx`
    - 用于删除确认等操作
    - _Requirements: 1.4_

  - [x] 14.4 添加国际化支持
    - 更新 `src/locales/en.json` 添加YouTube模块文案
    - 更新 `src/locales/zh.json` 添加YouTube模块中文文案
    - _Requirements: 1.3_

- [x] 15. 集成和导航更新
  - [x] 15.1 更新侧边栏导航
    - 在 `src/components/nav-main.tsx` 或相关文件中添加YouTube模块入口
    - 添加YouTube图标
    - _Requirements: 1.3_

  - [x] 15.2 更新路由配置
    - 确保所有YouTube路由正确配置
    - 添加路由守卫（如需要）
    - _Requirements: 1.3_

- [x] 16. Final Checkpoint - 完整功能验证
  - 确保所有页面可正常访问
  - 确保导航正常工作
  - 确保API调用正确（使用mock数据测试）
  - 确保所有组件无编译错误
  - 如有问题请询问用户

- [x] 17. API v2 变更支持 - 并发冲突处理
  - [x] 17.1 更新API客户端添加409错误处理
    - 更新 `src/lib/api/youtube.ts`
    - 添加统一的409错误检测和处理逻辑
    - 创建 ConflictError 类型定义
    - _Requirements: 9.1, 9.4_

  - [x] 17.2 创建冲突提示对话框组件
    - 创建 `src/components/youtube/conflict-dialog.tsx`
    - 显示友好的冲突提示信息
    - 包含"重新获取数据"和"取消"按钮（不是"刷新页面"）
    - _Requirements: 9.2, 9.3_

  - [x] 17.3 在受影响的页面集成冲突处理
    - 创建 `src/hooks/use-conflict-handler.ts` 统一冲突处理Hook
    - 更新提示词编辑页面处理409错误
    - 更新素材生成页面处理409错误
    - （项目详情页和分镜页只有读操作，无需处理）
    - **实现方式**：使用 React Query 的 `mutate()` 或直接调用 API 更新 React 状态
    - **禁止使用**：`window.location.reload()` 或 `router.refresh()`
    - **目标**：只更新受影响的数据，保持滚动位置和页面状态
    - _Requirements: 9.3, 9.4, 9.5, 9.6, 9.7_

  - [ ]* 17.4 编写409冲突处理单元测试
    - 测试API客户端409错误检测
    - 测试冲突对话框显示
    - 测试数据重新获取（不刷新页面）
    - 测试滚动位置保持
    - **Property 17: 409冲突错误处理**
    - **Property 18: 冲突处理覆盖范围**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.6, 9.7**

- [x] 18. API v2 变更支持 - 提示词历史优化
  - [x] 18.1 更新API客户端支持full_history参数
    - 更新 `src/lib/api/youtube.ts` 的 getProject 函数
    - 添加 full_history 可选参数
    - 默认不传参数（只获取当前版本历史）
    - _Requirements: 10.1, 10.3_

  - [x] 18.2 更新提示词历史组件
    - 更新 `src/components/youtube/prompt-history.tsx`
    - 添加"查看全部历史"按钮
    - 点击时调用API传入 full_history=true
    - _Requirements: 10.2, 10.4, 10.5_

  - [ ]* 18.3 编写提示词历史优化单元测试
    - 测试默认只加载当前版本历史
    - 测试full_history参数传递
    - 测试完整历史加载显示
    - **Property 19: 提示词历史默认加载**
    - **Property 20: 提示词完整历史加载**
    - **Validates: Requirements 10.1, 10.2, 10.3**

- [ ] 19. Checkpoint - API v2 变更验证
  - 确保409错误能正确捕获和显示
  - 确保冲突对话框正常工作
  - 确保full_history参数正确传递
  - 如有问题请询问用户

- [x] 20. 主体描述字段功能实现
  - [x] 20.1 更新TypeScript类型定义
    - 更新 `src/types/youtube.ts` 中的 Subject 接口
    - 添加 description 字段（string | null）
    - 更新 CreateSubjectFields 和 UpdateSubjectFields 接口
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 20.2 更新API客户端函数
    - 更新 `src/lib/api/youtube.ts` 中的 createSubject 函数
    - 支持传递 description 参数
    - 更新 updateSubject 函数支持 description 参数
    - 处理空字符串清空描述的逻辑
    - _Requirements: 11.2, 11.3, 11.4, 11.5_

  - [x] 20.3 更新 subject-config.ts 辅助函数
    - 更新 `src/lib/subject-config.ts` 中的类型定义
    - 在 GlobalSubject 接口中添加 description 字段
    - 更新 subjectToGlobalSubject 转换函数
    - _Requirements: 11.1_

  - [x] 20.4 更新 GlobalSubjectCard 组件
    - 更新 `src/components/youtube/global-subject-card.tsx`
    - 在卡片上显示 description 字段
    - 添加编辑 description 的输入框
    - 当 description 为 null 时显示"暂无描述"
    - _Requirements: 11.8, 11.9_

  - [x] 20.5 更新 AddSubjectDialog 组件
    - 更新 `src/components/youtube/add-subject-dialog.tsx`
    - 添加 description 输入框（可选）
    - 添加输入提示和字符限制（建议50字符）
    - 当创建第2个同类型主体时显示提示信息
    - _Requirements: 11.2, 11.7_

  - [x] 20.6 更新 Settings 页面
    - 更新 `src/app/dashboard/youtube/settings/page.tsx`
    - 处理 description 字段的创建和更新
    - 实现创建第2个主体时的提示逻辑
    - _Requirements: 11.7_

  - [ ]* 20.7 编写 description 字段单元测试
    - 测试 description 字段的 CRUD 操作
    - 测试空字符串清空描述
    - 测试不传递 description 保持原值
    - 测试 UTF-8 字符支持（中文、emoji等）
    - **Property 21: 主体CRUD一致性**
    - **Property 22: 主体描述更新持久性**
    - **Property 23: 主体描述字符支持**
    - **Property 24: 主体列表description字段完整性**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6**

- [ ] 21. Checkpoint - description 字段功能验证
  - 确保 description 字段在所有主体类型中正常显示
  - 确保创建、更新、清空描述功能正常
  - 确保第2个主体创建时显示提示
  - 如有问题请询问用户

- [ ] 22. Final Checkpoint - 所有功能验证
  - 确保所有已完成的功能正常工作
  - 确保异步任务创建和轮询正常（任务10、11、13已实现）
  - 确保409冲突处理正常（任务17待实现）
  - 确保主体描述字段正常（任务20待实现）
  - 如有问题请询问用户

## Notes

- 标记为 `*` 的任务为可选任务（主要是测试任务），可根据需要跳过以加快MVP开发
- 每个任务引用了具体的需求编号以便追溯
- Checkpoint任务用于阶段性验证，确保增量开发的正确性
- 属性测试验证通用正确性属性
- 单元测试验证具体示例和边界情况
- 后端FastAPI接口将在阶段二单独实现，前端可先使用mock数据开发

### 异步队列模式说明

图片和视频生成采用异步任务队列模式，关键实现要点：

1. **任务创建**: 调用 POST /api/tasks/create 立即返回task_id，不等待生成完成
2. **409错误处理**: 模块忙碌时返回409，前端显示提示并在30秒后自动重试
3. **批量状态查询**: 使用 POST /api/tasks/batch-status 一次查询最多100个任务
4. **轮询优化**: 每3秒轮询一次，动态移除completed和failed状态的任务，只轮询pending和running任务
5. **状态持久化**: task_id保存到localStorage，页面刷新后自动恢复并继续轮询
6. **模块状态**: 使用 GET /api/tasks/modules/{module_name}/status 查询队列积压情况
7. **并发限制**: 图片生成最多2个并发，视频生成最多10个并发

