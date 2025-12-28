'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Image,
  Video,
  Loader2,
  Pause,
  Play,
  X,
  RefreshCw,
  Download,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
  ImageGenerationCard,
  VideoGenerationCard,
  VideoPlayer
} from '@/components/youtube';
import {
  getProject,
  getPrompts,
  getGeneratedImages,
  getGeneratedVideos,
  generateImages,
  generateVideos,
  selectImage,
  selectVideo,
  downloadVideos,
  getTask,
  pauseTask,
  resumeTask,
  cancelTask
} from '@/lib/api/youtube';
import type {
  VideoProject,
  Prompt,
  GeneratedImage,
  GeneratedVideo,
  GenerationTask,
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

  // Get initial tab from URL params
  const initialTab = searchParams.get('tab') === 'video' ? 'video' : 'image';

  const [project, setProject] = useState<VideoProject | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Task state for images
  const [imageTask, setImageTask] = useState<GenerationTask | null>(null);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);

  // Task state for videos
  const [videoTask, setVideoTask] = useState<GenerationTask | null>(null);
  const [isGeneratingVideos, setIsGeneratingVideos] = useState(false);

  // Download state
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Video player state
  const [playingVideo, setPlayingVideo] = useState<GeneratedVideo | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  // Load project data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [projectData, promptsData, imagesData, videosData] =
        await Promise.all([
          getProject(projectId),
          getPrompts(projectId),
          getGeneratedImages(projectId),
          getGeneratedVideos(projectId)
        ]);

      setProject(projectData);
      setPrompts(promptsData.data);
      setImages(imagesData.data);
      setVideos(videosData.data);
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

  // Check if task is active
  const isTaskActive = (status: TaskStatus): boolean => {
    return status === 'pending' || status === 'running';
  };

  // Poll image task status
  useEffect(() => {
    if (!imageTask || !isTaskActive(imageTask.status)) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const task = await getTask(imageTask.id);
        setImageTask(task);

        if (task.status === 'completed') {
          toast({ title: '生成完成', description: '图片生成已完成' });
          setIsGeneratingImages(false);
          loadData();
        } else if (task.status === 'failed') {
          toast({
            title: '生成失败',
            description: task.error_message || '图片生成失败',
            variant: 'destructive'
          });
          setIsGeneratingImages(false);
        }
      } catch (err) {
        console.error('获取任务状态失败:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [imageTask, toast, loadData]);

  // Poll video task status
  useEffect(() => {
    if (!videoTask || !isTaskActive(videoTask.status)) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const task = await getTask(videoTask.id);
        setVideoTask(task);

        if (task.status === 'completed') {
          toast({ title: '生成完成', description: '视频生成已完成' });
          setIsGeneratingVideos(false);
          loadData();
        } else if (task.status === 'failed') {
          toast({
            title: '生成失败',
            description: task.error_message || '视频生成失败',
            variant: 'destructive'
          });
          setIsGeneratingVideos(false);
        }
      } catch (err) {
        console.error('获取任务状态失败:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [videoTask, toast, loadData]);

  // ============ Image Generation Handlers ============

  const handleStartImageGeneration = async (promptIds?: string[]) => {
    try {
      setIsGeneratingImages(true);
      const response = await generateImages(projectId, {
        storyboard_ids: promptIds, // API still uses storyboard_ids for backward compatibility
        parallel_count: 3
      });

      toast({ title: '开始生成', description: '图片生成已开始' });
      const task = await getTask(response.task_id);
      setImageTask(task);
    } catch (err) {
      toast({
        title: '启动失败',
        description: err instanceof Error ? err.message : '启动生成失败',
        variant: 'destructive'
      });
      setIsGeneratingImages(false);
    }
  };

  const handlePauseImageTask = async () => {
    if (!imageTask) return;
    try {
      await pauseTask(imageTask.id);
      const task = await getTask(imageTask.id);
      setImageTask(task);
      toast({ title: '已暂停', description: '图片生成任务已暂停' });
    } catch (err) {
      toast({
        title: '暂停失败',
        description: err instanceof Error ? err.message : '暂停任务失败',
        variant: 'destructive'
      });
    }
  };

  const handleResumeImageTask = async () => {
    if (!imageTask) return;
    try {
      await resumeTask(imageTask.id);
      const task = await getTask(imageTask.id);
      setImageTask(task);
      toast({ title: '已继续', description: '图片生成任务已继续' });
    } catch (err) {
      toast({
        title: '继续失败',
        description: err instanceof Error ? err.message : '继续任务失败',
        variant: 'destructive'
      });
    }
  };

  const handleCancelImageTask = async () => {
    if (!imageTask) return;
    try {
      await cancelTask(imageTask.id);
      setImageTask(null);
      setIsGeneratingImages(false);
      toast({ title: '已取消', description: '图片生成任务已取消' });
    } catch (err) {
      toast({
        title: '取消失败',
        description: err instanceof Error ? err.message : '取消任务失败',
        variant: 'destructive'
      });
    }
  };

  const handleSelectImage = async (imageId: string, isSelected: boolean) => {
    try {
      const updatedImage = await selectImage(imageId, isSelected);
      setImages((prev) =>
        prev.map((img) => {
          if (
            isSelected &&
            img.storyboard_index === updatedImage.storyboard_index
          ) {
            return img.id === imageId
              ? updatedImage
              : { ...img, is_selected: false };
          }
          return img.id === imageId ? updatedImage : img;
        })
      );
    } catch (err) {
      toast({
        title: '选择失败',
        description: err instanceof Error ? err.message : '选择图片失败',
        variant: 'destructive'
      });
    }
  };

  const handleRegenerateImage = async (promptId: string) => {
    await handleStartImageGeneration([promptId]);
  };

  // ============ Video Generation Handlers ============

  const handleStartVideoGeneration = async (promptIds?: string[]) => {
    try {
      setIsGeneratingVideos(true);
      const response = await generateVideos(projectId, {
        storyboard_ids: promptIds, // API still uses storyboard_ids for backward compatibility
        parallel_count: 2
      });

      toast({ title: '开始生成', description: '视频生成已开始' });
      const task = await getTask(response.task_id);
      setVideoTask(task);
    } catch (err) {
      toast({
        title: '启动失败',
        description: err instanceof Error ? err.message : '启动生成失败',
        variant: 'destructive'
      });
      setIsGeneratingVideos(false);
    }
  };

  const handlePauseVideoTask = async () => {
    if (!videoTask) return;
    try {
      await pauseTask(videoTask.id);
      const task = await getTask(videoTask.id);
      setVideoTask(task);
      toast({ title: '已暂停', description: '视频生成任务已暂停' });
    } catch (err) {
      toast({
        title: '暂停失败',
        description: err instanceof Error ? err.message : '暂停任务失败',
        variant: 'destructive'
      });
    }
  };

  const handleResumeVideoTask = async () => {
    if (!videoTask) return;
    try {
      await resumeTask(videoTask.id);
      const task = await getTask(videoTask.id);
      setVideoTask(task);
      toast({ title: '已继续', description: '视频生成任务已继续' });
    } catch (err) {
      toast({
        title: '继续失败',
        description: err instanceof Error ? err.message : '继续任务失败',
        variant: 'destructive'
      });
    }
  };

  const handleCancelVideoTask = async () => {
    if (!videoTask) return;
    try {
      await cancelTask(videoTask.id);
      setVideoTask(null);
      setIsGeneratingVideos(false);
      toast({ title: '已取消', description: '视频生成任务已取消' });
    } catch (err) {
      toast({
        title: '取消失败',
        description: err instanceof Error ? err.message : '取消任务失败',
        variant: 'destructive'
      });
    }
  };

  const handleSelectVideo = async (videoId: string, isSelected: boolean) => {
    try {
      const updatedVideo = await selectVideo(videoId, isSelected);
      setVideos((prev) =>
        prev.map((vid) => {
          if (
            isSelected &&
            vid.storyboard_index === updatedVideo.storyboard_index
          ) {
            return vid.id === videoId
              ? updatedVideo
              : { ...vid, is_selected: false };
          }
          return vid.id === videoId ? updatedVideo : vid;
        })
      );
    } catch (err) {
      toast({
        title: '选择失败',
        description: err instanceof Error ? err.message : '选择视频失败',
        variant: 'destructive'
      });
    }
  };

  const handleRegenerateVideo = async (promptId: string) => {
    await handleStartVideoGeneration([promptId]);
  };

  const handlePlayVideo = (video: GeneratedVideo) => {
    setPlayingVideo(video);
    setIsPlayerOpen(true);
  };

  // ============ Download Handler ============

  const handleDownloadVideos = async () => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      // Simulate progress while waiting for download
      const progressInterval = setInterval(() => {
        setDownloadProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const response = await downloadVideos(projectId);

      clearInterval(progressInterval);
      setDownloadProgress(100);

      // Trigger download
      const link = document.createElement('a');
      link.href = response.download_url;
      link.download = `${project?.name || 'videos'}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: '下载完成',
        description: `已下载 ${response.file_count} 个视频，总大小 ${response.total_size}`
      });
    } catch (err) {
      toast({
        title: '下载失败',
        description: err instanceof Error ? err.message : '下载视频失败',
        variant: 'destructive'
      });
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  // ============ Helper Functions ============

  const getImagesForPrompt = (storyboardIndex: number): GeneratedImage[] => {
    return images.filter((img) => img.storyboard_index === storyboardIndex);
  };

  const getVideosForPrompt = (storyboardIndex: number): GeneratedVideo[] => {
    return videos.filter((vid) => vid.storyboard_index === storyboardIndex);
  };

  const getSelectedImageForPrompt = (
    storyboardIndex: number
  ): GeneratedImage | null => {
    return (
      images.find(
        (img) => img.storyboard_index === storyboardIndex && img.is_selected
      ) || null
    );
  };

  const getImagePromptStatus = (
    storyboardIndex: number
  ): 'selected' | 'generating' | 'pending' | 'has_images' => {
    const promptImages = getImagesForPrompt(storyboardIndex);
    const hasSelected = promptImages.some((img) => img.is_selected);

    if (hasSelected) return 'selected';
    if (isGeneratingImages && imageTask) return 'generating';
    if (promptImages.length > 0) return 'has_images';
    return 'pending';
  };

  const getVideoPromptStatus = (
    storyboardIndex: number
  ): 'selected' | 'generating' | 'pending' | 'has_videos' => {
    const promptVideos = getVideosForPrompt(storyboardIndex);
    const hasSelected = promptVideos.some((vid) => vid.is_selected);

    if (hasSelected) return 'selected';
    if (isGeneratingVideos && videoTask) return 'generating';
    if (promptVideos.length > 0) return 'has_videos';
    return 'pending';
  };

  // Calculate progress stats
  const imageSelectedCount = prompts.filter((p) =>
    getImagesForPrompt(p.storyboard_index).some((img) => img.is_selected)
  ).length;

  const videoSelectedCount = prompts.filter((p) =>
    getVideosForPrompt(p.storyboard_index).some((vid) => vid.is_selected)
  ).length;

  const totalCount = prompts.length;

  // ============ Render ============

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

  return (
    <div className='container mx-auto space-y-6'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => router.push(`/dashboard/youtube/project/${projectId}`)}
        >
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <div>
          <h1 className='text-2xl font-bold'>素材生成</h1>
          <p className='text-muted-foreground text-sm'>{project.name}</p>
        </div>
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
          {/* Progress Section */}
          <div className='bg-card space-y-4 rounded-lg border p-4'>
            <div className='flex items-center justify-between'>
              <div className='space-y-1'>
                <p className='text-sm font-medium'>生成进度</p>
                <p className='text-muted-foreground text-xs'>
                  已选择: {imageSelectedCount}/{totalCount} 个分镜
                </p>
              </div>

              {/* Task Controls */}
              <div className='flex items-center gap-2'>
                {imageTask && isTaskActive(imageTask.status) ? (
                  <>
                    {imageTask.status === 'running' ? (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={handlePauseImageTask}
                        className='gap-1'
                      >
                        <Pause className='h-4 w-4' />
                        暂停
                      </Button>
                    ) : imageTask.status === 'paused' ? (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={handleResumeImageTask}
                        className='gap-1'
                      >
                        <Play className='h-4 w-4' />
                        继续
                      </Button>
                    ) : null}
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleCancelImageTask}
                      className='gap-1'
                    >
                      <X className='h-4 w-4' />
                      取消
                    </Button>
                  </>
                ) : (
                  <Button
                    size='sm'
                    onClick={() => handleStartImageGeneration()}
                    disabled={isGeneratingImages}
                    className='gap-1'
                  >
                    {isGeneratingImages ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      <RefreshCw className='h-4 w-4' />
                    )}
                    批量生成
                  </Button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {imageTask && (
              <div className='space-y-2'>
                <Progress value={imageTask.progress} className='h-2' />
                <div className='text-muted-foreground flex justify-between text-xs'>
                  <span>
                    {imageTask.completed_items}/{imageTask.total_items} 完成
                    {imageTask.failed_items > 0 && (
                      <span className='text-destructive ml-2'>
                        {imageTask.failed_items} 失败
                      </span>
                    )}
                  </span>
                  <span>{imageTask.progress}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Storyboard Image Cards */}
          <div className='space-y-4'>
            {prompts.map((prompt) => (
              <ImageGenerationCard
                key={prompt.id}
                prompt={prompt}
                images={getImagesForPrompt(prompt.storyboard_index)}
                status={getImagePromptStatus(prompt.storyboard_index)}
                onSelectImage={handleSelectImage}
                onRegenerate={() => handleRegenerateImage(prompt.id)}
                isGenerating={isGeneratingImages}
              />
            ))}
          </div>

          {/* Bottom Actions */}
          <div className='flex items-center justify-between border-t pt-4'>
            <p className='text-muted-foreground text-sm'>
              已选择: {imageSelectedCount}/{totalCount} 个分镜
            </p>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                onClick={() => {
                  const unselectedIds = prompts
                    .filter(
                      (p) =>
                        !getImagesForPrompt(p.storyboard_index).some(
                          (img) => img.is_selected
                        )
                    )
                    .map((p) => p.id);
                  if (unselectedIds.length > 0) {
                    handleStartImageGeneration(unselectedIds);
                  }
                }}
                disabled={
                  isGeneratingImages || imageSelectedCount === totalCount
                }
              >
                批量生成剩余
              </Button>
              <Button
                onClick={() => setActiveTab('video')}
                disabled={imageSelectedCount === 0}
              >
                继续下一步: 视频生成
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Video Generation Tab */}
        <TabsContent value='video' className='space-y-6'>
          {/* Progress Section */}
          <div className='bg-card space-y-4 rounded-lg border p-4'>
            <div className='flex items-center justify-between'>
              <div className='space-y-1'>
                <p className='text-sm font-medium'>生成进度</p>
                <p className='text-muted-foreground text-xs'>
                  已选择: {videoSelectedCount}/{totalCount} 个分镜
                </p>
              </div>

              {/* Task Controls */}
              <div className='flex items-center gap-2'>
                {videoTask && isTaskActive(videoTask.status) ? (
                  <>
                    {videoTask.status === 'running' ? (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={handlePauseVideoTask}
                        className='gap-1'
                      >
                        <Pause className='h-4 w-4' />
                        暂停
                      </Button>
                    ) : videoTask.status === 'paused' ? (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={handleResumeVideoTask}
                        className='gap-1'
                      >
                        <Play className='h-4 w-4' />
                        继续
                      </Button>
                    ) : null}
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleCancelVideoTask}
                      className='gap-1'
                    >
                      <X className='h-4 w-4' />
                      取消
                    </Button>
                  </>
                ) : (
                  <Button
                    size='sm'
                    onClick={() => handleStartVideoGeneration()}
                    disabled={isGeneratingVideos || imageSelectedCount === 0}
                    className='gap-1'
                  >
                    {isGeneratingVideos ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      <RefreshCw className='h-4 w-4' />
                    )}
                    批量生成
                  </Button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {videoTask && (
              <div className='space-y-2'>
                <Progress value={videoTask.progress} className='h-2' />
                <div className='text-muted-foreground flex justify-between text-xs'>
                  <span>
                    {videoTask.completed_items}/{videoTask.total_items} 完成
                    {videoTask.failed_items > 0 && (
                      <span className='text-destructive ml-2'>
                        {videoTask.failed_items} 失败
                      </span>
                    )}
                  </span>
                  <span>{videoTask.progress}%</span>
                </div>
              </div>
            )}
          </div>

          {/* No selected images warning */}
          {imageSelectedCount === 0 && (
            <div className='bg-muted/50 flex h-32 flex-col items-center justify-center gap-2 rounded-lg border'>
              <Image className='text-muted-foreground h-8 w-8' />
              <p className='text-muted-foreground'>
                请先在图片生成页面选择源图片
              </p>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setActiveTab('image')}
              >
                返回图片生成
              </Button>
            </div>
          )}

          {/* Storyboard Video Cards */}
          {imageSelectedCount > 0 && (
            <div className='space-y-4'>
              {prompts.map((prompt) => {
                const sourceImage = getSelectedImageForPrompt(
                  prompt.storyboard_index
                );
                return (
                  <VideoGenerationCard
                    key={prompt.id}
                    prompt={prompt}
                    sourceImage={sourceImage}
                    videos={getVideosForPrompt(prompt.storyboard_index)}
                    status={getVideoPromptStatus(prompt.storyboard_index)}
                    onSelectVideo={handleSelectVideo}
                    onRegenerate={() => handleRegenerateVideo(prompt.id)}
                    onPlayVideo={handlePlayVideo}
                    isGenerating={isGeneratingVideos}
                  />
                );
              })}
            </div>
          )}

          {/* Bottom Actions */}
          <div className='flex items-center justify-between border-t pt-4'>
            <p className='text-muted-foreground text-sm'>
              已选择: {videoSelectedCount}/{totalCount} 个视频
            </p>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                onClick={() => {
                  const unselectedIds = prompts
                    .filter((p) => {
                      const hasSourceImage =
                        getSelectedImageForPrompt(p.storyboard_index) !== null;
                      const hasSelectedVideo = getVideosForPrompt(
                        p.storyboard_index
                      ).some((vid) => vid.is_selected);
                      return hasSourceImage && !hasSelectedVideo;
                    })
                    .map((p) => p.id);
                  if (unselectedIds.length > 0) {
                    handleStartVideoGeneration(unselectedIds);
                  }
                }}
                disabled={
                  isGeneratingVideos ||
                  videoSelectedCount === imageSelectedCount
                }
              >
                批量生成剩余
              </Button>
              <Button
                onClick={handleDownloadVideos}
                disabled={isDownloading || videoSelectedCount === 0}
                className='gap-1'
              >
                {isDownloading ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    下载中 {downloadProgress}%
                  </>
                ) : (
                  <>
                    <Download className='h-4 w-4' />
                    下载所有选中视频
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Download Progress */}
          {isDownloading && (
            <div className='bg-card space-y-2 rounded-lg border p-4'>
              <div className='flex items-center gap-2'>
                <Download className='text-primary h-4 w-4' />
                <span className='text-sm font-medium'>正在打包下载...</span>
              </div>
              <Progress value={downloadProgress} className='h-2' />
              <p className='text-muted-foreground text-xs'>
                {downloadProgress === 100 ? (
                  <span className='flex items-center gap-1 text-green-600'>
                    <CheckCircle className='h-3 w-3' />
                    下载完成
                  </span>
                ) : (
                  `正在准备 ${videoSelectedCount} 个视频文件...`
                )}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Video Player Dialog */}
      <VideoPlayer
        video={playingVideo}
        open={isPlayerOpen}
        onOpenChange={setIsPlayerOpen}
        title={playingVideo ? `分镜视频预览` : '视频预览'}
      />
    </div>
  );
}
