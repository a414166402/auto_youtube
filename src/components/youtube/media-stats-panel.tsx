'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  HardDrive,
  Image,
  Video,
  RefreshCw,
  Trash2,
  FolderOpen
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { getProjects, getMediaStats, cleanupMedia } from '@/lib/api/youtube';
import type {
  ProjectListItem,
  MediaStatsResponse,
  MediaCleanupType
} from '@/types/youtube';

export function MediaStatsPanel() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [mediaStats, setMediaStats] = useState<MediaStatsResponse | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  // 加载项目列表
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoadingProjects(true);
        const result = await getProjects({ page_size: 100 });
        setProjects(result.items);
      } catch (error) {
        console.error('Failed to load projects:', error);
        toast.error('加载项目列表失败');
      } finally {
        setLoadingProjects(false);
      }
    };
    loadProjects();
  }, []);

  // 加载媒体统计
  const loadMediaStats = useCallback(async () => {
    if (!selectedProjectId) {
      setMediaStats(null);
      return;
    }

    try {
      setLoadingStats(true);
      const stats = await getMediaStats(selectedProjectId);
      setMediaStats(stats);
    } catch (error) {
      console.error('Failed to load media stats:', error);
      toast.error('加载媒体统计失败');
      setMediaStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadMediaStats();
  }, [loadMediaStats]);

  // 清理媒体
  const handleCleanup = async (mediaType: MediaCleanupType) => {
    if (!selectedProjectId) return;

    setCleaning(true);
    try {
      const result = await cleanupMedia(selectedProjectId, mediaType);
      if (result.success) {
        const typeText =
          mediaType === 'all'
            ? '所有未选中素材'
            : mediaType === 'images'
              ? '未选中图片'
              : '未选中视频';
        toast.success(`${typeText}清理完成，释放 ${result.freed_size}`, {
          description: `删除图片: ${result.deleted_images}，删除视频: ${result.deleted_videos}`
        });
        // 刷新统计
        loadMediaStats();
      } else {
        toast.error('清理失败', {
          description: result.errors.join(', ')
        });
      }
    } catch (error) {
      toast.error('清理失败', {
        description: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      setCleaning(false);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <HardDrive className='h-5 w-5' />
          项目媒体占用
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* 项目选择 */}
        <div className='space-y-2'>
          <label className='text-sm font-medium'>选择项目</label>
          <Select
            value={selectedProjectId}
            onValueChange={setSelectedProjectId}
            disabled={loadingProjects}
          >
            <SelectTrigger>
              <SelectValue placeholder='选择要查看的项目...' />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 统计信息 */}
        {loadingStats ? (
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
          </div>
        ) : mediaStats ? (
          <div className='space-y-4'>
            {/* 总占用 */}
            <div className='bg-muted/50 rounded-lg p-4'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>总占用空间</span>
                <Badge variant='secondary' className='text-base'>
                  {mediaStats.total_size}
                </Badge>
              </div>
            </div>

            {/* 图片统计 */}
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <Image className='h-4 w-4' />
                <span className='text-sm font-medium'>图片</span>
                <Badge variant='outline'>{mediaStats.images.total_size}</Badge>
              </div>
              <div className='grid grid-cols-3 gap-2 text-xs'>
                <div className='bg-muted rounded p-2 text-center'>
                  <div className='text-muted-foreground'>总数</div>
                  <div className='font-medium'>
                    {mediaStats.images.total_count}
                  </div>
                </div>
                <div className='rounded bg-green-50 p-2 text-center dark:bg-green-950'>
                  <div className='text-muted-foreground'>已选中</div>
                  <div className='font-medium text-green-600'>
                    {mediaStats.images.selected_count}
                  </div>
                </div>
                <div className='rounded bg-orange-50 p-2 text-center dark:bg-orange-950'>
                  <div className='text-muted-foreground'>未选中</div>
                  <div className='font-medium text-orange-600'>
                    {mediaStats.images.unselected_count}
                  </div>
                </div>
              </div>
            </div>

            {/* 视频统计 */}
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <Video className='h-4 w-4' />
                <span className='text-sm font-medium'>视频</span>
                <Badge variant='outline'>{mediaStats.videos.total_size}</Badge>
              </div>
              <div className='grid grid-cols-3 gap-2 text-xs'>
                <div className='bg-muted rounded p-2 text-center'>
                  <div className='text-muted-foreground'>总数</div>
                  <div className='font-medium'>
                    {mediaStats.videos.total_count}
                  </div>
                </div>
                <div className='rounded bg-green-50 p-2 text-center dark:bg-green-950'>
                  <div className='text-muted-foreground'>已选中</div>
                  <div className='font-medium text-green-600'>
                    {mediaStats.videos.selected_count}
                  </div>
                </div>
                <div className='rounded bg-orange-50 p-2 text-center dark:bg-orange-950'>
                  <div className='text-muted-foreground'>未选中</div>
                  <div className='font-medium text-orange-600'>
                    {mediaStats.videos.unselected_count}
                  </div>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className='flex items-center gap-2 border-t pt-4'>
              <Button
                variant='outline'
                size='sm'
                onClick={loadMediaStats}
                disabled={loadingStats}
                className='gap-1'
              >
                <RefreshCw className='h-4 w-4' />
                刷新
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant='destructive'
                    size='sm'
                    disabled={
                      cleaning ||
                      (mediaStats.images.unselected_count === 0 &&
                        mediaStats.videos.unselected_count === 0)
                    }
                    className='gap-1'
                  >
                    {cleaning ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      <Trash2 className='h-4 w-4' />
                    )}
                    清理未选中素材
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认清理</AlertDialogTitle>
                    <AlertDialogDescription>
                      此操作将删除项目「{selectedProject?.name}
                      」中所有未选中的图片和视频文件。
                      <br />
                      <br />
                      预计删除：
                      <br />• 图片: {mediaStats.images.unselected_count} 张
                      <br />• 视频: {mediaStats.videos.unselected_count} 个
                      <br />
                      <br />
                      此操作不可撤销，确定要继续吗？
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleCleanup('all')}
                      className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    >
                      确认清理
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ) : selectedProjectId ? (
          <div className='text-muted-foreground py-8 text-center text-sm'>
            无法加载媒体统计信息
          </div>
        ) : (
          <div className='text-muted-foreground flex flex-col items-center gap-2 py-8 text-sm'>
            <FolderOpen className='h-8 w-8' />
            请选择一个项目查看媒体占用情况
          </div>
        )}
      </CardContent>
    </Card>
  );
}
