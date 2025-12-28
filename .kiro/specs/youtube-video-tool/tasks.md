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

- [x] 10. 图片生成页面实现
  - [x] 10.1 创建素材生成页面
    - 更新 `src/app/dashboard/youtube/generate/[projectId]/page.tsx`
    - 实现图片生成和视频生成两个Tab
    - 显示整体生成进度条
    - 包含暂停/继续/取消按钮
    - _Requirements: 7.1, 9.1, 9.4_

  - [x] 10.2 创建图片生成分镜卡片组件
    - 创建 `src/components/youtube/image-generation-card.tsx`
    - 显示分镜状态（已选择/生成中/待生成）
    - 显示生成的图片网格
    - 支持图片选择
    - 包含重新生成按钮
    - _Requirements: 7.4, 7.5, 7.6_

  - [x] 10.3 创建图片选择器组件
    - 创建 `src/components/youtube/image-selector.tsx`
    - 支持点击选择图片
    - 显示选中状态
    - 支持图片预览放大
    - _Requirements: 7.6_

  - [x] 10.4 编写图片生成页面单元测试

    - 测试进度条显示
    - 测试图片选择功能
    - 测试重新生成功能
    - **Property 11: 重新生成增加候选**
    - **Property 12: 选择标记唯一性**
    - **Validates: Requirements 7.5, 7.6, 8.3, 8.4**

- [x] 11. 视频生成功能实现
  - [x] 11.1 创建视频生成分镜卡片组件
    - 创建 `src/components/youtube/video-generation-card.tsx`
    - 显示源图片缩略图
    - 显示生成的视频列表
    - 支持视频播放预览
    - 支持视频选择
    - 包含重新生成按钮
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 11.2 创建视频播放器组件
    - 创建 `src/components/youtube/video-player.tsx`
    - 支持视频播放控制
    - 支持全屏播放
    - _Requirements: 8.2_

  - [x] 11.3 实现批量下载功能
    - 添加下载所有选中视频按钮
    - 显示下载进度
    - 处理下载完成提示
    - _Requirements: 8.6_

  - [x] 11.4 编写视频生成功能单元测试

    - 测试视频列表渲染
    - 测试视频选择功能
    - 测试下载功能
    - **Property 12: 选择标记唯一性**
    - **Validates: Requirements 8.4**

- [x] 12. Checkpoint - 生成功能验证
  - 确保图片生成页面正常显示
  - 确保视频生成Tab正常显示
  - 确保进度条和状态更新正常
  - 如有问题请询问用户


- [x] 13. 任务状态管理实现
  - [x] 13.1 创建任务状态轮询Hook
    - 创建 `src/hooks/use-task-polling.ts`
    - 实现任务状态定时轮询
    - 支持暂停/恢复轮询
    - 处理任务完成/失败回调
    - _Requirements: 9.1, 9.2, 9.5_

  - [x] 13.2 创建进度条组件
    - 创建 `src/components/youtube/generation-progress.tsx`
    - 显示整体进度百分比
    - 显示完成/失败/总数统计
    - 支持动画效果
    - _Requirements: 9.1, 9.2_

  - [x] 13.3 创建任务控制组件
    - 创建 `src/components/youtube/task-controls.tsx`
    - 包含暂停/继续/取消按钮
    - 根据任务状态显示/隐藏按钮
    - _Requirements: 9.4_

  - [x] 13.4 编写任务状态管理单元测试

    - 测试轮询Hook功能
    - 测试进度计算
    - 测试状态转换
    - **Property 13: 任务进度计算正确性**
    - **Property 14: 任务状态持久化**
    - **Validates: Requirements 9.1, 9.2, 9.4, 9.5**

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

## Notes

- 标记为 `*` 的任务为可选任务（主要是测试任务），可根据需要跳过以加快MVP开发
- 每个任务引用了具体的需求编号以便追溯
- Checkpoint任务用于阶段性验证，确保增量开发的正确性
- 属性测试验证通用正确性属性
- 单元测试验证具体示例和边界情况
- 后端FastAPI接口将在阶段二单独实现，前端可先使用mock数据开发

