'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  ViralVideoCard,
  ViralVideoDialog,
  ViralVideoDetail,
  ViralFilter,
  InstructionDialog
} from '@/components/viral';
import {
  getViralVideos,
  createViralVideo,
  updateViralVideo,
  deleteViralVideo,
  downloadViralMedia,
  createProjectFromViral,
  getViralTags
} from '@/lib/api/viral';
import type {
  ViralVideo,
  ViralFilterParams,
  CreateViralVideoRequest
} from '@/types/viral';

export default function ViralLibraryPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [videos, setVideos] = useState<ViralVideo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ViralFilterParams>({
    page: 1,
    page_size: 10
  });
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<ViralVideo | undefined>();
  const [instructionDialogOpen, setInstructionDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedVideoForProject, setSelectedVideoForProject] = useState<
    ViralVideo | undefined
  >();
  const [selectedVideoForDetail, setSelectedVideoForDetail] = useState<
    ViralVideo | undefined
  >();

  // 加载爆款视频列表
  const loadVideos = async () => {
    try {
      setLoading(true);
      const response = await getViralVideos(filters);
      setVideos(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load videos:', error);
      toast({
        title: '加载失败',
        description: '无法加载爆款视频列表',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // 加载标签列表
  const loadTags = async () => {
    try {
      const response = await getViralTags();
      setAvailableTags(response.tags.map((tag) => tag.name));
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  useEffect(() => {
    loadVideos();
  }, [filters]);

  useEffect(() => {
    loadTags();
  }, []);

  // 创建或更新爆款视频
  const handleSubmit = async (data: CreateViralVideoRequest) => {
    try {
      if (editingVideo) {
        await updateViralVideo(editingVideo.id, data);
        toast({
          title: '更新成功',
          description: '爆款视频已更新'
        });
      } else {
        await createViralVideo(data);
        toast({
          title: '创建成功',
          description: '爆款视频已创建'
        });
      }
      loadVideos();
    } catch (error) {
      console.error('Failed to submit:', error);
      toast({
        title: '操作失败',
        description: editingVideo ? '更新失败' : '创建失败',
        variant: 'destructive'
      });
      throw error;
    }
  };

  // 删除爆款视频
  const handleDelete = async (video: ViralVideo) => {
    if (!confirm('确定要删除这个爆款视频吗？')) {
      return;
    }

    try {
      await deleteViralVideo(video.id);
      toast({
        title: '删除成功',
        description: '爆款视频已删除'
      });
      loadVideos();
    } catch (error) {
      console.error('Failed to delete:', error);
      toast({
        title: '删除失败',
        description: '无法删除爆款视频',
        variant: 'destructive'
      });
    }
  };

  // 下载媒体到图床
  const handleDownloadMedia = async (video: ViralVideo) => {
    try {
      toast({
        title: '开始下载',
        description: '正在下载媒体到图床...'
      });

      const response = await downloadViralMedia(video.id);

      if (response.success) {
        toast({
          title: '下载成功',
          description: '媒体已下载到图床'
        });
        loadVideos();
      } else {
        toast({
          title: '下载失败',
          description: response.message || '下载失败',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to download media:', error);
      toast({
        title: '下载失败',
        description: '无法下载媒体',
        variant: 'destructive'
      });
    }
  };

  // 从爆款库创建项目
  const handleCreateProject = async (
    video: ViralVideo,
    instruction: string
  ) => {
    try {
      const response = await createProjectFromViral(video.id, instruction);

      if (response.success) {
        toast({
          title: '项目创建成功',
          description: '正在跳转到项目页面...'
        });

        // 跳转到项目详情页
        router.push(`/dashboard/youtube/project/${response.project_id}`);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      toast({
        title: '创建失败',
        description: '无法创建项目',
        variant: 'destructive'
      });
    }
  };

  // 打开编辑对话框
  const handleEdit = (video: ViralVideo) => {
    setEditingVideo(video);
    setIsCreateDialogOpen(true);
  };

  // 关闭对话框时重置编辑状态
  const handleDialogClose = (open: boolean) => {
    setIsCreateDialogOpen(open);
    if (!open) {
      setEditingVideo(undefined);
    }
  };

  return (
    <div className='container mx-auto p-6'>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>爆款库</h1>
          <p className='text-muted-foreground mt-1'>收集和管理爆款视频素材</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className='mr-2 h-4 w-4' />
          新增爆款
        </Button>
      </div>

      {/* 筛选条件 */}
      <div className='mb-6'>
        <ViralFilter
          filters={filters}
          onFiltersChange={setFilters}
          tags={availableTags}
        />
      </div>

      {/* 爆款视频列表 */}
      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
        </div>
      ) : videos.length === 0 ? (
        <div className='text-muted-foreground py-12 text-center'>
          <p className='text-lg'>暂无爆款视频</p>
          <p className='mt-2 text-sm'>点击&quot;新增爆款&quot;开始添加</p>
        </div>
      ) : (
        <div className='grid gap-4'>
          {videos.map((video) => (
            <ViralVideoCard
              key={video.id}
              video={video}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDownloadMedia={handleDownloadMedia}
              onCreateProject={(video) => {
                setSelectedVideoForProject(video);
                setInstructionDialogOpen(true);
              }}
              onViewDetail={(video) => {
                setSelectedVideoForDetail(video);
                setDetailDialogOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* 分页 */}
      {total > (filters.page_size || 10) && (
        <div className='mt-6 flex items-center justify-center gap-2'>
          <Button
            variant='outline'
            disabled={filters.page === 1}
            onClick={() =>
              setFilters({ ...filters, page: (filters.page || 1) - 1 })
            }
          >
            上一页
          </Button>
          <span className='text-muted-foreground text-sm'>
            第 {filters.page} 页，共{' '}
            {Math.ceil(total / (filters.page_size || 10))} 页
          </span>
          <Button
            variant='outline'
            disabled={
              filters.page === Math.ceil(total / (filters.page_size || 10))
            }
            onClick={() =>
              setFilters({ ...filters, page: (filters.page || 1) + 1 })
            }
          >
            下一页
          </Button>
        </div>
      )}

      {/* 新增/编辑对话框 */}
      <ViralVideoDialog
        open={isCreateDialogOpen}
        onOpenChange={handleDialogClose}
        video={editingVideo}
        availableTags={availableTags}
        onSubmit={handleSubmit}
      />

      {/* 详情查看对话框 */}
      <ViralVideoDetail
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        video={selectedVideoForDetail}
        onDownloadMedia={handleDownloadMedia}
        onEdit={(video) => {
          setDetailDialogOpen(false);
          handleEdit(video);
        }}
        onCreateProject={(video) => {
          setDetailDialogOpen(false);
          setSelectedVideoForProject(video);
          setInstructionDialogOpen(true);
        }}
      />

      {/* 创建项目指令输入对话框 */}
      <InstructionDialog
        open={instructionDialogOpen}
        onOpenChange={setInstructionDialogOpen}
        videoName={selectedVideoForProject?.data.name}
        onSubmit={(instruction) =>
          selectedVideoForProject
            ? handleCreateProject(selectedVideoForProject, instruction)
            : Promise.resolve()
        }
      />
    </div>
  );
}
