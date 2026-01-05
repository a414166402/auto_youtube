'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Wand2, Image, Video, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WorkflowStep } from '@/components/youtube/workflow-step';
import { useToast } from '@/components/ui/use-toast';
import { getProject, generatePrompts, getStatusText } from '@/lib/api/youtube';
import type {
  ProjectResponse,
  ProjectStatus,
  WorkflowStepStatus
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
  getStatus: (project: ProjectResponse) => WorkflowStepStatus;
  getDescription: (project: ProjectResponse) => string;
  getActionLabel: (project: ProjectResponse) => string | undefined;
  getActionUrl?: (project: ProjectResponse) => string | undefined;
  canTriggerAction?: (project: ProjectResponse) => boolean;
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
  // 与后端状态枚举对齐
  const allStatuses: ProjectStatus[] = [
    'created',
    'prompts_ready',
    'images_partial',
    'images_ready',
    'videos_partial',
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
function calculateOverallProgress(project: ProjectResponse): number {
  const statusProgress: Record<ProjectStatus, number> = {
    created: 0,
    prompts_ready: 33,
    images_partial: 50,
    images_ready: 66,
    videos_partial: 83,
    completed: 100,
    failed: 0
  };
  return statusProgress[project.data.status] || 0;
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { projectId } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPrompts, setGeneratingPrompts] = useState(false);
  const [instruction, setInstruction] = useState('不需要改编');

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

  // 生成提示词
  const handleGeneratePrompts = async () => {
    if (!project) return;

    setGeneratingPrompts(true);
    try {
      const result = await generatePrompts(project.id, { instruction });
      if (result.success) {
        toast({
          title: '生成成功',
          description: `已生成 ${result.storyboard_count} 个分镜提示词`
        });
        loadProject();
      } else {
        toast({
          title: '生成失败',
          description: result.error || '生成提示词失败',
          variant: 'destructive'
        });
      }
    } catch (err) {
      toast({
        title: '生成失败',
        description: err instanceof Error ? err.message : '生成提示词失败',
        variant: 'destructive'
      });
    } finally {
      setGeneratingPrompts(false);
    }
  };

  // 工作流步骤配置 - 3个步骤（简化版）
  const workflowSteps: WorkflowStepConfig[] = [
    {
      id: 'prompts',
      title: '提示词生成',
      icon: <Wand2 className='h-4 w-4' />,
      getStatus: (p) =>
        getStepStatusFromProjectStatus(
          p.data.status,
          [],
          [
            'prompts_ready',
            'images_partial',
            'images_ready',
            'videos_partial',
            'completed'
          ]
        ),
      getDescription: (p) => {
        if (p.data.status === 'created') return '点击生成提示词开始';
        const count = p.data.storyboards.length;
        return `已生成 ${count} 个分镜提示词`;
      },
      getActionLabel: (p) => {
        if (p.data.status === 'created') return '生成提示词';
        return '编辑提示词';
      },
      getActionUrl: (p) => {
        if (p.data.status !== 'created') {
          return `/dashboard/youtube/prompts/${p.id}`;
        }
        return undefined;
      },
      canTriggerAction: (p) => p.data.status === 'created',
      note: '调用AI分析YouTube视频并生成分镜提示词'
    },
    {
      id: 'images',
      title: '图片生成',
      icon: <Image className='h-4 w-4' />,
      getStatus: (p) => {
        // 待开始：只在提示词未生成时
        if (p.data.status === 'created') return 'pending';
        const storyboards = p.data.storyboards;
        if (storyboards.length === 0) return 'pending';
        // 已完成：所有分镜都有图片且都已选中
        const allHaveImages = storyboards.every((sb) => sb.images.length > 0);
        const allSelected = storyboards.every(
          (sb) => sb.selected_image_index !== null
        );
        if (allHaveImages && allSelected) return 'completed';
        // 进行中：提示词已生成后，只要没全部完成就是进行中
        return 'in_progress';
      },
      getDescription: (p) => {
        if (p.data.status === 'created') return '等待提示词生成';
        const storyboards = p.data.storyboards;
        const withImages = storyboards.filter(
          (sb) => sb.images.length > 0
        ).length;
        const selected = storyboards.filter(
          (sb) => sb.selected_image_index !== null
        ).length;
        if (withImages === 0) return '前置条件：提示词编辑完成';
        return `已生成 ${withImages}/${storyboards.length} | 已选择 ${selected}/${storyboards.length}`;
      },
      getActionLabel: (p) => {
        if (p.data.status === 'created') return undefined;
        const storyboards = p.data.storyboards;
        if (storyboards.length === 0) return undefined;
        // 已完成或进行中都显示"查看/选择图片"
        const anyHasImages = storyboards.some((sb) => sb.images.length > 0);
        if (anyHasImages) return '查看/选择图片';
        // 待开始
        if (p.data.status === 'prompts_ready') return '开始生成图片';
        return undefined;
      },
      getActionUrl: (p) => {
        if (p.data.status !== 'created') {
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
      getStatus: (p) => {
        // 待开始：只在提示词未生成时
        if (p.data.status === 'created') return 'pending';
        const storyboards = p.data.storyboards;
        if (storyboards.length === 0) return 'pending';
        // 已完成：所有分镜都有视频且都已选中
        const allHaveVideos = storyboards.every((sb) => sb.videos.length > 0);
        const allSelected = storyboards.every(
          (sb) => sb.selected_video_index !== null
        );
        if (allHaveVideos && allSelected) return 'completed';
        // 进行中：提示词已生成后，只要没全部完成就是进行中
        return 'in_progress';
      },
      getDescription: (p) => {
        if (p.data.status === 'created') return '等待提示词生成';
        const storyboards = p.data.storyboards;
        if (storyboards.length === 0) return '等待提示词生成';
        const withVideos = storyboards.filter(
          (sb) => sb.videos.length > 0
        ).length;
        const selected = storyboards.filter(
          (sb) => sb.selected_video_index !== null
        ).length;
        // 显示有多少分镜的图片已选中（可以生成视频）
        const imagesSelected = storyboards.filter(
          (sb) => sb.selected_image_index !== null
        ).length;
        if (withVideos === 0) {
          return `可生成: ${imagesSelected}/${storyboards.length} (需先选择图片)`;
        }
        return `已生成 ${withVideos}/${storyboards.length} | 已选择 ${selected}/${storyboards.length}`;
      },
      getActionLabel: (p) => {
        if (p.data.status === 'created') return undefined;
        const storyboards = p.data.storyboards;
        if (storyboards.length === 0) return undefined;
        // 已完成或进行中都显示"查看/选择视频"
        const anyHasVideos = storyboards.some((sb) => sb.videos.length > 0);
        if (anyHasVideos) return '查看/选择视频';
        // 检查是否有任何分镜的图片已选中
        const anyImageSelected = storyboards.some(
          (sb) => sb.selected_image_index !== null
        );
        if (anyImageSelected) return '开始生成视频';
        return '去选择图片';
      },
      getActionUrl: (p) => {
        if (p.data.status === 'created') return undefined;
        if (p.data.storyboards.length === 0) return undefined;
        // 检查是否有任何分镜的图片已选中
        const anyImageSelected = p.data.storyboards.some(
          (sb) => sb.selected_image_index !== null
        );
        if (anyImageSelected) {
          return `/dashboard/youtube/generate/${p.id}?tab=video`;
        }
        // 没有图片选中，跳转到图片生成页面
        return `/dashboard/youtube/generate/${p.id}`;
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
          <h1 className='text-2xl font-bold'>{project.data.name}</h1>
          <p className='text-muted-foreground text-sm'>
            状态: {getStatusText(project.data.status)} | 创建于{' '}
            {new Date(project.created_at).toLocaleDateString('zh-CN')}
          </p>
        </div>
      </div>

      {/* YouTube URL */}
      <div className='bg-muted rounded-lg p-4'>
        <p className='text-sm'>
          <span className='font-medium'>YouTube URL: </span>
          <a
            href={project.data.youtube_url}
            target='_blank'
            rel='noopener noreferrer'
            className='text-blue-500 hover:underline'
          >
            {project.data.youtube_url}
          </a>
        </p>
      </div>

      {/* 整体进度条 */}
      <div className='space-y-2'>
        <div className='flex items-center justify-between text-sm'>
          <span className='font-medium'>工作流进度</span>
          <span className='text-muted-foreground'>{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className='h-2' />
        <div className='text-muted-foreground flex justify-between text-xs'>
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

          const isPromptsStep = step.id === 'prompts';

          return (
            <WorkflowStep
              key={step.id}
              stepNumber={index + 1}
              title={step.title}
              status={status}
              description={description}
              actionLabel={actionLabel}
              actionUrl={actionUrl}
              onAction={
                isPromptsStep && canTrigger ? handleGeneratePrompts : undefined
              }
              isLoading={isPromptsStep && generatingPrompts}
              disabled={isPromptsStep && generatingPrompts}
              details={
                <>
                  {/* 提示词生成步骤的instruction输入框 */}
                  {isPromptsStep && canTrigger && (
                    <div className='mb-3 space-y-2'>
                      <Label htmlFor='instruction' className='text-sm'>
                        生成指令
                      </Label>
                      <Input
                        id='instruction'
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        placeholder='不需要改编'
                        className='max-w-md'
                      />
                      <p className='text-muted-foreground text-xs'>
                        此指令将影响AI生成提示词的风格和内容
                      </p>
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
