'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StoryboardCard } from '@/components/youtube/storyboard-card';
import { TimeAdjustDialog } from '@/components/youtube/time-adjust-dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  getProject,
  getStoryboards,
  updateStoryboard
} from '@/lib/api/youtube';
import type { VideoProject, Storyboard } from '@/types/youtube';

interface StoryboardPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default function StoryboardPage({ params }: StoryboardPageProps) {
  const { projectId } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [project, setProject] = useState<VideoProject | null>(null);
  const [storyboards, setStoryboards] = useState<Storyboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 时间调整对话框状态
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);
  const [selectedStoryboard, setSelectedStoryboard] =
    useState<Storyboard | null>(null);

  // 加载项目和分镜数据
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [projectData, storyboardsData] = await Promise.all([
        getProject(projectId),
        getStoryboards(projectId)
      ]);
      setProject(projectData);
      setStoryboards(storyboardsData.data);
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

  // 保存单个分镜描述
  const handleSaveDescription = async (id: string, description: string) => {
    try {
      await updateStoryboard(id, { description });

      // 更新本地状态
      setStoryboards((prev) =>
        prev.map((sb) => (sb.id === id ? { ...sb, description } : sb))
      );

      toast({
        title: '保存成功',
        description: '分镜描述已更新'
      });
    } catch (err) {
      toast({
        title: '保存失败',
        description: err instanceof Error ? err.message : '保存分镜描述失败',
        variant: 'destructive'
      });
      throw err;
    }
  };

  // 打开时间调整对话框
  const handleAdjustTime = (storyboard: Storyboard) => {
    setSelectedStoryboard(storyboard);
    setTimeDialogOpen(true);
  };

  // 保存时间调整
  const handleSaveTime = async (
    id: string,
    startTime: number,
    endTime: number
  ) => {
    try {
      await updateStoryboard(id, { start_time: startTime, end_time: endTime });

      // 更新本地状态
      setStoryboards((prev) =>
        prev.map((sb) =>
          sb.id === id
            ? { ...sb, start_time: startTime, end_time: endTime }
            : sb
        )
      );

      toast({
        title: '保存成功',
        description: '分镜时间已更新'
      });
    } catch (err) {
      toast({
        title: '保存失败',
        description: err instanceof Error ? err.message : '保存分镜时间失败',
        variant: 'destructive'
      });
      throw err;
    }
  };

  // 导航到下一步
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
            <h1 className='text-2xl font-bold'>分镜编辑</h1>
            <p className='text-muted-foreground text-sm'>
              共 {storyboards.length} 个分镜
            </p>
          </div>
        </div>
        <Button onClick={handleNextStep} className='gap-1'>
          继续下一步: 生成提示词
          <ChevronRight className='h-4 w-4' />
        </Button>
      </div>

      {/* 分镜列表 */}
      {storyboards.length === 0 ? (
        <div className='bg-muted/50 flex h-64 flex-col items-center justify-center gap-4 rounded-lg border'>
          <p className='text-muted-foreground'>暂无分镜数据</p>
          <Button
            variant='outline'
            onClick={() =>
              router.push(`/dashboard/youtube/project/${projectId}`)
            }
          >
            返回项目详情
          </Button>
        </div>
      ) : (
        <div className='space-y-4'>
          {storyboards.map((storyboard) => (
            <StoryboardCard
              key={storyboard.id}
              storyboard={storyboard}
              onSaveDescription={handleSaveDescription}
              onAdjustTime={handleAdjustTime}
            />
          ))}
        </div>
      )}

      {/* 底部操作栏 */}
      {storyboards.length > 0 && (
        <div className='sticky bottom-4 flex justify-end'>
          <Button
            onClick={handleNextStep}
            size='lg'
            className='gap-1 shadow-lg'
          >
            继续下一步: 生成提示词
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      )}

      {/* 时间调整对话框 */}
      <TimeAdjustDialog
        storyboard={selectedStoryboard}
        open={timeDialogOpen}
        onOpenChange={setTimeDialogOpen}
        onSave={handleSaveTime}
      />
    </div>
  );
}
