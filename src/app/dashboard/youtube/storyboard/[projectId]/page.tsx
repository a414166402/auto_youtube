'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, ChevronRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getProject } from '@/lib/api/youtube';
import type { ProjectResponse } from '@/types/youtube';

interface StoryboardPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

/**
 * 源视频分镜页面
 *
 * 注意：根据当前后端API设计，源视频分镜解析功能尚未实现。
 * 此页面仅作为占位，显示提示信息并引导用户进入提示词编辑流程。
 *
 * 业务逻辑说明：
 * - 源视频分镜：从原始YouTube视频解析出的分镜，仅供参考展示，不影响后续流程
 * - 微创新视频分镜：AI自动生成的提示词对应的分镜，数量与源视频分镜无关
 */
export default function StoryboardPage({ params }: StoryboardPageProps) {
  const { projectId } = use(params);
  const router = useRouter();

  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载项目数据
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const projectData = await getProject(projectId);
      setProject(projectData);
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

  // 导航到提示词编辑页面
  const handleNextStep = () => {
    router.push(`/dashboard/youtube/prompts/${projectId}`);
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

  return (
    <div className='container mx-auto space-y-6'>
      {/* 头部 */}
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
            <h1 className='text-2xl font-bold'>源视频分镜</h1>
            <p className='text-muted-foreground text-sm'>{project.data.name}</p>
          </div>
        </div>
        <Button onClick={handleNextStep} className='gap-1'>
          跳过，直接生成提示词
          <ChevronRight className='h-4 w-4' />
        </Button>
      </div>

      {/* 功能说明 */}
      <Alert>
        <Info className='h-4 w-4' />
        <AlertTitle>功能说明</AlertTitle>
        <AlertDescription className='space-y-2'>
          <p>
            源视频分镜解析功能用于从原始YouTube视频中提取分镜信息，仅供参考展示，不影响后续的AI创作流程。
          </p>
          <p>
            您可以直接跳过此步骤，进入提示词编辑页面，AI将根据视频内容自动生成微创新分镜和对应的提示词。
          </p>
        </AlertDescription>
      </Alert>

      {/* 占位内容 */}
      <div className='bg-muted/50 flex h-64 flex-col items-center justify-center gap-4 rounded-lg border border-dashed'>
        <p className='text-muted-foreground text-center'>
          源视频分镜解析功能正在开发中...
          <br />
          <span className='text-sm'>
            您可以直接进入下一步，AI将自动分析视频并生成微创新分镜
          </span>
        </p>
        <Button onClick={handleNextStep} variant='outline' className='gap-1'>
          继续下一步
          <ChevronRight className='h-4 w-4' />
        </Button>
      </div>

      {/* 底部操作栏 */}
      <div className='sticky bottom-4 flex justify-end'>
        <Button onClick={handleNextStep} size='lg' className='gap-1 shadow-lg'>
          继续下一步: 生成提示词
          <ChevronRight className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}
