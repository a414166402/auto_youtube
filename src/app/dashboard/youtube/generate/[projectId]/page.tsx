'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Image,
  Video,
  Loader2,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
  getProject,
  updateProject,
  createImageTask,
  createVideoTask,
  cleanupMedia,
  updateProjectAspectRatio,
  getSubjects
} from '@/lib/api/youtube';
import {
  subjectsToLibrary,
  getSubjectForRef,
  type GlobalSubjectLibrary,
  type ProjectSubjectMapping,
  DEFAULT_SUBJECT_LIBRARY
} from '@/lib/subject-config';
import { AspectRatioSelector } from '@/components/youtube/aspect-ratio-selector';
import { ConflictDialog } from '@/components/youtube/conflict-dialog';
import { useConflictHandler } from '@/hooks/use-conflict-handler';
import { useTaskPolling } from '@/hooks/use-task-polling';
import {
  loadTaskIds,
  saveTaskIds,
  addTaskId,
  removeTaskIds
} from '@/lib/task-storage';
import { ImageGenerationCard } from '@/components/youtube/image-generation-card';
import { VideoGenerationCard } from '@/components/youtube/video-generation-card';
import type {
  ProjectResponse,
  GeneratedVideo,
  AspectRatio,
  TaskStatus
} from '@/types/youtube';

interface GeneratePageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default function GeneratePage({ params }: GeneratePageProps) {
  const { projectId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const initialTab = searchParams.get('tab') === 'video' ? 'video' : 'image';

  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [subjectLibrary, setSubjectLibrary] = useState<GlobalSubjectLibrary>(
    DEFAULT_SUBJECT_LIBRARY
  );
  const [projectMapping, setProjectMapping] = useState<ProjectSubjectMapping>(
    {}
  );

  // 图片比例状态
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [savingAspectRatio, setSavingAspectRatio] = useState(false);

  // 清理状态
  const [cleaningImages, setCleaningImages] = useState(false);
  const [cleaningVideos, setCleaningVideos] = useState(false);

  // 任务轮询
  const {
    isPolling,
    tasks: taskMap,
    startPolling,
    stopPolling
  } = useTaskPolling({
    pollInterval: 3000,
    onTaskUpdate: (task) => {
      console.log('任务更新:', task);
      // 任务完成或失败时，从localStorage移除
      if (task.status === 'completed' || task.status === 'failed') {
        removeTaskIds(projectId, [task.task_id]);
        // 重新加载项目数据
        if (task.status === 'completed') {
          loadData();
        }
      }
    },
    onAllComplete: ({ completed, failed }) => {
      toast({
        title: '任务完成',
        description: `成功: ${completed.length}, 失败: ${failed.length}`
      });
      loadData();
    },
    onError: (error) => {
      console.error('轮询错误:', error);
    }
  });

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const projectData = await getProject(projectId);
      setProject(projectData);

      // 设置图片比例
      setAspectRatio(projectData.data.aspect_ratio || '9:16');

      // 加载项目映射
      setProjectMapping(projectData.data.subject_mappings || {});

      // 加载全局主体库
      try {
        const subjectsResponse = await getSubjects();
        const library = subjectsToLibrary(subjectsResponse.subjects);
        setSubjectLibrary(library);
      } catch {
        console.warn('Failed to load subjects from server');
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 页面加载时恢复任务轮询
  useEffect(() => {
    const savedTaskIds = loadTaskIds(projectId);
    if (savedTaskIds.length > 0) {
      startPolling(savedTaskIds);
    }
  }, [projectId, startPolling]);

  // 409 冲突处理
  const {
    showConflictDialog,
    conflictMessage,
    setShowConflictDialog,
    handleError,
    handleRefetch
  } = useConflictHandler(loadData);

  // 更新图片比例
  const handleAspectRatioChange = async (newRatio: AspectRatio) => {
    if (!project || newRatio === aspectRatio) return;

    setSavingAspectRatio(true);
    try {
      await updateProjectAspectRatio(projectId, newRatio);
      setAspectRatio(newRatio);
      toast({
        title: '已更新',
        description: `图片比例已设置为 ${newRatio === '9:16' ? '竖屏 9:16' : '横屏 16:9'}`
      });
    } catch (err) {
      if (handleError(err)) return;
      toast({
        title: '更新失败',
        description: err instanceof Error ? err.message : '更新图片比例失败',
        variant: 'destructive'
      });
    } finally {
      setSavingAspectRatio(false);
    }
  };

  // 生成单个分镜图片
  const handleGenerateImage = async (storyboardIndex: number) => {
    if (!project) return;

    const storyboard = project.data.storyboards[storyboardIndex];
    if (!storyboard) return;

    try {
      // 获取主体引用图片
      const characterImages: string[] = [];
      if (storyboard.character_refs && storyboard.character_refs.length > 0) {
        for (const ref of storyboard.character_refs) {
          const subject = getSubjectForRef(ref, projectMapping, subjectLibrary);
          if (subject?.imageData) {
            characterImages.push(subject.imageData);
          }
        }
      }

      // 创建任务
      const taskId = await createImageTask(
        projectId,
        storyboardIndex,
        storyboard.text_to_image,
        {
          characterImages,
          aspectRatio: aspectRatio,
          subjectMappings: Object.fromEntries(
            Object.entries(projectMapping).filter(([_, v]) => v !== null)
          ) as Record<string, string>,
          refIndexes: storyboard.ref_storyboard_indexes || []
        }
      );

      // 保存任务ID
      addTaskId(projectId, taskId);

      // 开始轮询
      const currentTaskIds = loadTaskIds(projectId);
      startPolling(currentTaskIds);

      toast({
        title: '任务已创建',
        description: `分镜 #${storyboardIndex + 1} 图片生成任务已加入队列`
      });
    } catch (err) {
      if (handleError(err)) return;
      toast({
        title: '创建失败',
        description: err instanceof Error ? err.message : '创建任务失败',
        variant: 'destructive'
      });
    }
  };

  // 生成单个分镜视频
  const handleGenerateVideo = async (storyboardIndex: number) => {
    if (!project) return;

    const storyboard = project.data.storyboards[storyboardIndex];
    if (!storyboard) return;

    // 检查是否有选中的图片
    if (storyboard.selected_image_index === null) {
      toast({
        title: '请先选择图片',
        description: '需要先选择一张图片作为视频生成的源图片',
        variant: 'destructive'
      });
      return;
    }

    try {
      const selectedImage = storyboard.images[storyboard.selected_image_index];
      if (!selectedImage) {
        throw new Error('选中的图片不存在');
      }

      // 创建任务
      const taskId = await createVideoTask(
        projectId,
        storyboardIndex,
        selectedImage.url,
        storyboard.image_to_video,
        {
          subjectMappings: Object.fromEntries(
            Object.entries(projectMapping).filter(([_, v]) => v !== null)
          ) as Record<string, string>,
          sourceImageIndex: storyboard.selected_image_index
        }
      );

      // 保存任务ID
      addTaskId(projectId, taskId);

      // 开始轮询
      const currentTaskIds = loadTaskIds(projectId);
      startPolling(currentTaskIds);

      toast({
        title: '任务已创建',
        description: `分镜 #${storyboardIndex + 1} 视频生成任务已加入队列`
      });
    } catch (err) {
      if (handleError(err)) return;
      toast({
        title: '创建失败',
        description: err instanceof Error ? err.message : '创建任务失败',
        variant: 'destructive'
      });
    }
  };

  // 选择图片
  const handleSelectImage = async (
    storyboardIndex: number,
    imageIndex: number
  ) => {
    if (!project) return;

    const currentSelected =
      project.data.storyboards[storyboardIndex]?.selected_image_index;
    if (currentSelected === imageIndex) return;

    try {
      const storyboards = [...project.data.storyboards];
      storyboards[storyboardIndex] = {
        ...storyboards[storyboardIndex],
        selected_image_index: imageIndex
      };

      await updateProject(projectId, { storyboards });
      loadData();

      toast({
        title: '已选择',
        description: `分镜 #${storyboardIndex + 1} 图片已选择`
      });
    } catch (err) {
      if (handleError(err)) return;
      toast({
        title: '选择失败',
        description: err instanceof Error ? err.message : '选择图片失败',
        variant: 'destructive'
      });
    }
  };

  // 选择视频
  const handleSelectVideo = async (
    storyboardIndex: number,
    videoIndex: number
  ) => {
    if (!project) return;

    const currentSelected =
      project.data.storyboards[storyboardIndex]?.selected_video_index;
    if (currentSelected === videoIndex) return;

    try {
      const storyboards = [...project.data.storyboards];
      storyboards[storyboardIndex] = {
        ...storyboards[storyboardIndex],
        selected_video_index: videoIndex
      };

      await updateProject(projectId, { storyboards });
      loadData();

      toast({
        title: '已选择',
        description: `分镜 #${storyboardIndex + 1} 视频已选择`
      });
    } catch (err) {
      if (handleError(err)) return;
      toast({
        title: '选择失败',
        description: err instanceof Error ? err.message : '选择视频失败',
        variant: 'destructive'
      });
    }
  };

  // 批量生成所有图片
  const handleGenerateAllImages = async () => {
    if (!project) return;

    for (let i = 0; i < project.data.storyboards.length; i++) {
      const sb = project.data.storyboards[i];
      if (sb.images.length === 0) {
        await handleGenerateImage(i);
      }
    }
  };

  // 批量生成所有视频
  const handleGenerateAllVideos = async () => {
    if (!project) return;

    for (let i = 0; i < project.data.storyboards.length; i++) {
      const sb = project.data.storyboards[i];
      if (sb.selected_image_index !== null && sb.videos.length === 0) {
        await handleGenerateVideo(i);
      }
    }
  };

  // 清理未选中的图片
  const handleCleanupImages = async () => {
    if (!project) return;

    setCleaningImages(true);
    try {
      const result = await cleanupMedia(projectId, 'images');
      if (result.success) {
        toast({
          title: '清理完成',
          description: `已删除 ${result.deleted_images} 张未选中图片，释放 ${result.freed_size}`
        });
        loadData();
      } else {
        toast({
          title: '清理失败',
          description: result.errors.join(', ') || '清理图片失败',
          variant: 'destructive'
        });
      }
    } catch (err) {
      toast({
        title: '清理失败',
        description: err instanceof Error ? err.message : '清理图片失败',
        variant: 'destructive'
      });
    } finally {
      setCleaningImages(false);
    }
  };

  // 清理未选中的视频
  const handleCleanupVideos = async () => {
    if (!project) return;

    setCleaningVideos(true);
    try {
      const result = await cleanupMedia(projectId, 'videos');
      if (result.success) {
        toast({
          title: '清理完成',
          description: `已删除 ${result.deleted_videos} 个未选中视频，释放 ${result.freed_size}`
        });
        loadData();
      } else {
        toast({
          title: '清理失败',
          description: result.errors.join(', ') || '清理视频失败',
          variant: 'destructive'
        });
      }
    } catch (err) {
      toast({
        title: '清理失败',
        description: err instanceof Error ? err.message : '清理视频失败',
        variant: 'destructive'
      });
    } finally {
      setCleaningVideos(false);
    }
  };

  // 计算进度
  const getImageProgress = () => {
    if (!project) return { selected: 0, total: 0 };
    const storyboards = project.data.storyboards;
    const selected = storyboards.filter(
      (sb) => sb.selected_image_index !== null
    ).length;
    return { selected, total: storyboards.length };
  };

  const getVideoProgress = () => {
    if (!project) return { selected: 0, total: 0 };
    const storyboards = project.data.storyboards;
    const selected = storyboards.filter(
      (sb) => sb.selected_video_index !== null
    ).length;
    return { selected, total: storyboards.length };
  };

  // 获取分镜的任务状态
  const getStoryboardTaskStatus = (
    storyboardIndex: number,
    type: 'image' | 'video'
  ): TaskStatus | null => {
    // 从任务映射中查找对应分镜的任务
    for (const task of taskMap.values()) {
      if (
        task.module_name ===
          (type === 'image' ? 'image_generation' : 'video_generation') &&
        task.task_type === `generate_storyboard_${type}`
      ) {
        // 检查任务数据中的 storyboard_index
        // 注意: 这里需要根据实际的任务数据结构调整
        return task.status as TaskStatus;
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className='container mx-auto'>
        <div className='flex h-64 items-center justify-center'>
          <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className='container mx-auto'>
        <div className='flex h-64 flex-col items-center justify-center gap-4'>
          <p className='text-destructive'>{error || '项目不存在'}</p>
          <Button
            variant='outline'
            onClick={() => router.push('/dashboard/youtube/projects')}
          >
            返回项目列表
          </Button>
        </div>
      </div>
    );
  }

  const storyboards = project.data.storyboards;
  const imageProgress = getImageProgress();
  const videoProgress = getVideoProgress();

  return (
    <div className='container mx-auto space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() =>
              router.push(`/dashboard/youtube/project/${projectId}`)
            }
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div>
            <h1 className='text-2xl font-bold'>素材生成</h1>
            <p className='text-muted-foreground text-sm'>{project.data.name}</p>
          </div>
        </div>
        <AspectRatioSelector
          value={aspectRatio}
          onChange={handleAspectRatioChange}
          disabled={savingAspectRatio || isPolling}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value='image' className='gap-2'>
            <Image className='h-4 w-4' />
            图片生成
          </TabsTrigger>
          <TabsTrigger value='video' className='gap-2'>
            <Video className='h-4 w-4' />
            视频生成
          </TabsTrigger>
        </TabsList>

        {/* Image Generation Tab */}
        <TabsContent value='image' className='space-y-6'>
          {/* Progress */}
          <div className='bg-card space-y-4 rounded-lg border p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium'>生成进度</p>
                <p className='text-muted-foreground text-xs'>
                  已选择: {imageProgress.selected}/{imageProgress.total} 个分镜
                  {isPolling && ' (任务进行中)'}
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={handleCleanupImages}
                  disabled={cleaningImages || isPolling}
                  className='gap-1'
                >
                  {cleaningImages ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Trash2 className='h-4 w-4' />
                  )}
                  清理未选中
                </Button>
                <Button
                  size='sm'
                  onClick={handleGenerateAllImages}
                  disabled={isPolling}
                  className='gap-1'
                >
                  {isPolling ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <RefreshCw className='h-4 w-4' />
                  )}
                  批量生成
                </Button>
              </div>
            </div>
            <Progress
              value={
                (imageProgress.selected / Math.max(imageProgress.total, 1)) *
                100
              }
              className='h-2'
            />
          </div>

          {/* Storyboard Cards */}
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
            {storyboards.map((storyboard, index) => {
              const hasImages = storyboard.images.length > 0;
              const isSelected = storyboard.selected_image_index !== null;
              const taskStatus = getStoryboardTaskStatus(index, 'image');

              let status: 'selected' | 'generating' | 'pending' | 'has_images';
              if (isSelected) {
                status = 'selected';
              } else if (taskStatus === 'running' || taskStatus === 'pending') {
                status = 'generating';
              } else if (hasImages) {
                status = 'has_images';
              } else {
                status = 'pending';
              }

              return (
                <ImageGenerationCard
                  key={index}
                  storyboard={storyboard}
                  status={status}
                  taskStatus={taskStatus}
                  onSelectImage={(imageIndex) =>
                    handleSelectImage(index, imageIndex)
                  }
                  onRegenerate={() => handleGenerateImage(index)}
                  isGenerating={isPolling}
                />
              );
            })}
          </div>
        </TabsContent>

        {/* Video Generation Tab */}
        <TabsContent value='video' className='space-y-6'>
          {/* Progress */}
          <div className='bg-card space-y-4 rounded-lg border p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium'>生成进度</p>
                <p className='text-muted-foreground text-xs'>
                  已选择: {videoProgress.selected}/{videoProgress.total} 个分镜
                  {isPolling && ' (任务进行中)'}
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={handleCleanupVideos}
                  disabled={cleaningVideos || isPolling}
                  className='gap-1'
                >
                  {cleaningVideos ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Trash2 className='h-4 w-4' />
                  )}
                  清理未选中
                </Button>
                <Button
                  size='sm'
                  onClick={handleGenerateAllVideos}
                  disabled={isPolling}
                  className='gap-1'
                >
                  {isPolling ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <RefreshCw className='h-4 w-4' />
                  )}
                  批量生成
                </Button>
              </div>
            </div>
            <Progress
              value={
                (videoProgress.selected / Math.max(videoProgress.total, 1)) *
                100
              }
              className='h-2'
            />
          </div>

          {/* Storyboard Cards */}
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {storyboards.map((storyboard, index) => {
              const hasVideos = storyboard.videos.length > 0;
              const isSelected = storyboard.selected_video_index !== null;
              const taskStatus = getStoryboardTaskStatus(index, 'video');

              let status: 'selected' | 'generating' | 'pending' | 'has_videos';
              if (isSelected) {
                status = 'selected';
              } else if (taskStatus === 'running' || taskStatus === 'pending') {
                status = 'generating';
              } else if (hasVideos) {
                status = 'has_videos';
              } else {
                status = 'pending';
              }

              return (
                <VideoGenerationCard
                  key={index}
                  storyboard={storyboard}
                  status={status}
                  taskStatus={taskStatus}
                  onSelectVideo={(videoIndex) =>
                    handleSelectVideo(index, videoIndex)
                  }
                  onRegenerate={() => handleGenerateVideo(index)}
                  isGenerating={isPolling}
                />
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Conflict Dialog */}
      <ConflictDialog
        open={showConflictDialog}
        onOpenChange={setShowConflictDialog}
        message={conflictMessage}
        onRefetch={handleRefetch}
      />
    </div>
  );
}
