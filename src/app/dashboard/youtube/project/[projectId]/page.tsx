'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  FileText,
  Image,
  Video,
  Wand2,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { WorkflowStep } from '@/components/youtube/workflow-step';
import { useToast } from '@/components/ui/use-toast';
import {
  getProject,
  startDownload,
  getDownloadStatus,
  getTask
} from '@/lib/api/youtube';
import type {
  VideoProject,
  ProjectStatus,
  WorkflowStepStatus,
  GenerationTask
} from '@/types/youtube';

interface ProjectDetailPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

// 工作流步骤定义
interface WorkflowStepConfig {
  id: string;
  title: string;
  icon: React.ReactNode;
  getStatus: (project: VideoProject) => WorkflowStepStatus;
  getDescription: (project: VideoProject) => string;
  getActionLabel: (project: VideoProject) => string | undefined;
  getActionUrl?: (project: VideoProject) => string | undefined;
  canTriggerAction?: (project: VideoProject) => boolean;
  note?: string;
}

// 根据项目状态获取工作流步骤状态
function getStepStatusFromProjectStatus(
  projectStatus: ProjectStatus,
  stepStatuses: ProjectStatus[],
  completedStatuses: ProjectStatus[]
): WorkflowStepStatus {
  if (completedStatuses.includes(projectStatus)) {
    return 'completed';
  }
  if (stepStatuses.includes(projectStatus)) {
    return 'in_progress';
  }
  const allStatuses: ProjectStatus[] = [
    'created',
    'downloading',
    'downloaded',
    'parsing',
    'parsed',
    'generating_prompts',
    'prompts_ready',
    'generating_images',
    'images_ready',
    'generating_videos',
    'completed',
    'failed'
  ];
  const currentIndex = allStatuses.indexOf(projectStatus);
  const stepCompletedIndex = Math.max(
    ...completedStatuses.map((s) => allStatuses.indexOf(s))
  );

  if (currentIndex > stepCompletedIndex) {
    return 'completed';
  }

  return 'pending';
}

// 计算整体工作流进度
function calculateOverallProgress(project: VideoProject): number {
  const statusProgress: Record<ProjectStatus, number> = {
    created: 0,
    downloading: 10,
    downloaded: 20,
    parsing: 30,
    parsed: 40,
    generating_prompts: 50,
    prompts_ready: 60,
    generating_images: 70,
    images_ready: 80,
    generating_videos: 90,
    completed: 100,
    failed: 0
  };
  return statusProgress[project.status] || 0;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { projectId } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [project, setProject] = useState<VideoProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingVideo, setDownloadingVideo] = useState(false);
  const [downloadTask, setDownloadTask] = useState<GenerationTask | null>(null);

  const loadProject = useCallback(async () => {
    try {
      const data = await getProject(projectId);
      setProject(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载项目失败');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useEffect(() => {
    if (
      !downloadTask ||
      downloadTask.status === 'completed' ||
      downloadTask.status === 'failed'
    ) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const task = await getTask(downloadTask.id);
        setDownloadTask(task);

        if (task.status === 'completed') {
          toast({
            title: '下载完成',
            description: '视频下载成功，正在解析分镜...'
          });
          setDownloadingVideo(false);
          loadProject();
        } else if (task.status === 'failed') {
          toast({
            title: '下载失败',
            description: task.error_message || '视频下载失败，请重试',
            variant: 'destructive'
          });
          setDownloadingVideo(false);
        }
      } catch (err) {
        console.error('获取下载状态失败:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [downloadTask, toast, loadProject]);

  const handleStartDownload = async () => {
    if (!project) return;

    setDownloadingVideo(true);
    try {
      await startDownload(project.id);
      toast({
        title: '开始下载',
        description: '视频下载已开始，请稍候...'
      });

      const task = await getDownloadStatus(project.id);
      setDownloadTask(task);
      loadProject();
    } catch (err) {
      toast({
        title: '下载失败',
        description: err instanceof Error ? err.message : '启动下载失败',
        variant: 'destructive'
      });
      setDownloadingVideo(false);
    }
  };

  // 工作流步骤配置 - 5个步骤（移除角色映射步骤）
  const workflowSteps: WorkflowStepConfig[] = [
    {
      id: 'download',
      title: '视频下载',
      icon: <Download className='h-4 w-4' />,
      getStatus: (p) =>
        getStepStatusFromProjectStatus(
          p.status,
          ['downloading'],
          [
            'downloaded',
            'parsing',
            'parsed',
            'generating_prompts',
            'prompts_ready',
            'generating_images',
            'images_ready',
            'generating_videos',
            'completed'
          ]
        ),
      getDescription: (p) => {
        if (p.status === 'created') return `YouTube URL: ${p.youtube_url}`;
        if (p.status === 'downloading') return '正在下载视频...';
        if (p.video_path) return `视频时长: ${formatDuration(p.duration)}`;
        return `YouTube URL: ${p.youtube_url}`;
      },
      getActionLabel: (p) => {
        if (p.status === 'created') return '开始下载';
        if (p.status === 'downloading') return '下载中...';
        return undefined;
      },
      canTriggerAction: (p) => p.status === 'created'
    },
    {
      id: 'storyboard',
      title: '分镜解析（可选，仅供参考）',
      icon: <FileText className='h-4 w-4' />,
      getStatus: (p) =>
        getStepStatusFromProjectStatus(
          p.status,
          ['parsing'],
          [
            'parsed',
            'generating_prompts',
            'prompts_ready',
            'generating_images',
            'images_ready',
            'generating_videos',
            'completed'
          ]
        ),
      getDescription: (p) => {
        if (p.source_storyboard_count)
          return `已解析 ${p.source_storyboard_count} 个源视频分镜`;
        if (p.status === 'parsing') return '正在解析分镜...';
        return '等待视频下载完成';
      },
      getActionLabel: (p) => {
        const status = getStepStatusFromProjectStatus(
          p.status,
          ['parsing'],
          [
            'parsed',
            'generating_prompts',
            'prompts_ready',
            'generating_images',
            'images_ready',
            'generating_videos',
            'completed'
          ]
        );
        if (status === 'completed') return '查看/编辑分镜';
        return undefined;
      },
      getActionUrl: (p) => {
        const status = getStepStatusFromProjectStatus(
          p.status,
          ['parsing'],
          [
            'parsed',
            'generating_prompts',
            'prompts_ready',
            'generating_images',
            'images_ready',
            'generating_videos',
            'completed'
          ]
        );
        if (status === 'completed')
          return `/dashboard/youtube/storyboard/${p.id}`;
        return undefined;
      },
      note: '源视频分镜仅供参考，不影响后续流程'
    },
    {
      id: 'prompts',
      title: '提示词编辑',
      icon: <Wand2 className='h-4 w-4' />,
      getStatus: (p) =>
        getStepStatusFromProjectStatus(
          p.status,
          ['generating_prompts'],
          [
            'prompts_ready',
            'generating_images',
            'images_ready',
            'generating_videos',
            'completed'
          ]
        ),
      getDescription: (p) => {
        if (p.status === 'generating_prompts') return '正在生成提示词...';
        if (
          [
            'prompts_ready',
            'generating_images',
            'images_ready',
            'generating_videos',
            'completed'
          ].includes(p.status)
        ) {
          const count = p.innovation_storyboard_count || 0;
          return `已生成 ${count} 个微创新分镜提示词 | 版本: ${p.prompt_version || 'V1'}`;
        }
        return '等待分镜解析完成';
      },
      getActionLabel: (p) => {
        const status = getStepStatusFromProjectStatus(
          p.status,
          ['generating_prompts'],
          [
            'prompts_ready',
            'generating_images',
            'images_ready',
            'generating_videos',
            'completed'
          ]
        );
        if (status === 'completed') return '编辑提示词和角色引用';
        if (status === 'pending' && p.status === 'parsed') return '生成提示词';
        return undefined;
      },
      getActionUrl: (p) => {
        const status = getStepStatusFromProjectStatus(
          p.status,
          ['generating_prompts'],
          [
            'prompts_ready',
            'generating_images',
            'images_ready',
            'generating_videos',
            'completed'
          ]
        );
        if (
          status === 'completed' ||
          (status === 'pending' && p.status === 'parsed')
        ) {
          return `/dashboard/youtube/prompts/${p.id}`;
        }
        return undefined;
      },
      note: '微创新分镜数量由AI决定，与源视频分镜数量无关'
    },
    {
      id: 'images',
      title: '图片生成',
      icon: <Image className='h-4 w-4' />,
      getStatus: (p) =>
        getStepStatusFromProjectStatus(
          p.status,
          ['generating_images'],
          ['images_ready', 'generating_videos', 'completed']
        ),
      getDescription: (p) => {
        if (p.status === 'generating_images') return '正在生成图片...';
        if (
          ['images_ready', 'generating_videos', 'completed'].includes(p.status)
        ) {
          return '图片生成完成';
        }
        return '前置条件：提示词编辑完成';
      },
      getActionLabel: (p) => {
        const status = getStepStatusFromProjectStatus(
          p.status,
          ['generating_images'],
          ['images_ready', 'generating_videos', 'completed']
        );
        if (status === 'completed') return '查看/选择图片';
        if (status === 'pending' && p.status === 'prompts_ready')
          return '开始生成图片';
        return undefined;
      },
      getActionUrl: (p) => {
        const status = getStepStatusFromProjectStatus(
          p.status,
          ['generating_images'],
          ['images_ready', 'generating_videos', 'completed']
        );
        if (
          status === 'completed' ||
          (status === 'pending' && p.status === 'prompts_ready')
        ) {
          return `/dashboard/youtube/generate/${p.id}`;
        }
        return undefined;
      },
      note: '有角色引用→图文生图；无角色引用→文生图'
    },
    {
      id: 'videos',
      title: '视频生成',
      icon: <Video className='h-4 w-4' />,
      getStatus: (p) =>
        getStepStatusFromProjectStatus(
          p.status,
          ['generating_videos'],
          ['completed']
        ),
      getDescription: (p) => {
        if (p.status === 'generating_videos') return '正在生成视频...';
        if (p.status === 'completed') return '视频生成完成';
        return '前置条件：所有分镜图片已生成且已选择';
      },
      getActionLabel: (p) => {
        const status = getStepStatusFromProjectStatus(
          p.status,
          ['generating_videos'],
          ['completed']
        );
        if (status === 'completed') return '查看/下载视频';
        if (status === 'pending' && p.status === 'images_ready')
          return '开始生成视频';
        return undefined;
      },
      getActionUrl: (p) => {
        const status = getStepStatusFromProjectStatus(
          p.status,
          ['generating_videos'],
          ['completed']
        );
        if (
          status === 'completed' ||
          (status === 'pending' && p.status === 'images_ready')
        ) {
          return `/dashboard/youtube/generate/${p.id}?tab=video`;
        }
        return undefined;
      },
      note: '使用用户选择的图片 + image_to_video提示词'
    }
  ];

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

  const overallProgress = calculateOverallProgress(project);

  return (
    <div className='container mx-auto space-y-6'>
      {/* 头部 */}
      <div className='flex items-center gap-4'>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => router.push('/dashboard/youtube/projects')}
        >
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <div>
          <h1 className='text-2xl font-bold'>{project.name}</h1>
          <p className='text-muted-foreground text-sm'>
            创建于 {new Date(project.created_at).toLocaleDateString('zh-CN')}
          </p>
        </div>
      </div>

      {/* 整体进度条 */}
      <div className='space-y-2'>
        <div className='flex items-center justify-between text-sm'>
          <span className='font-medium'>工作流进度</span>
          <span className='text-muted-foreground'>{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className='h-2' />
        <div className='text-muted-foreground flex justify-between text-xs'>
          <span>下载</span>
          <span>分镜</span>
          <span>提示词</span>
          <span>图片</span>
          <span>视频</span>
        </div>
      </div>

      {/* 工作流步骤卡片 */}
      <div className='space-y-4'>
        {workflowSteps.map((step, index) => {
          const status = step.getStatus(project);
          const description = step.getDescription(project);
          const actionLabel = step.getActionLabel(project);
          const actionUrl = step.getActionUrl?.(project);
          const canTrigger = step.canTriggerAction?.(project);

          const isDownloadStep = step.id === 'download';
          const showDownloadProgress =
            isDownloadStep && downloadTask && downloadTask.status === 'running';

          return (
            <WorkflowStep
              key={step.id}
              stepNumber={index + 1}
              title={step.title}
              status={status}
              description={description}
              progress={
                showDownloadProgress ? downloadTask.progress : undefined
              }
              actionLabel={actionLabel}
              actionUrl={actionUrl}
              onAction={
                isDownloadStep && canTrigger ? handleStartDownload : undefined
              }
              isLoading={isDownloadStep && downloadingVideo}
              disabled={isDownloadStep && downloadingVideo}
              details={
                <>
                  {isDownloadStep && project.video_path && (
                    <div className='text-muted-foreground'>
                      视频时长: {formatDuration(project.duration)}
                    </div>
                  )}
                  {step.note && (
                    <div className='text-muted-foreground mt-1 text-xs'>
                      注：{step.note}
                    </div>
                  )}
                </>
              }
            />
          );
        })}
      </div>
    </div>
  );
}
