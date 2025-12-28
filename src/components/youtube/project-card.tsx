'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Eye, Trash2, Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { AlertModal } from '@/components/modal/alert-modal';
import type { VideoProject, ProjectStatus } from '@/types/youtube';

interface ProjectCardProps {
  project: VideoProject;
  onDelete: (id: string) => Promise<void>;
}

const statusConfig: Record<
  ProjectStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
  }
> = {
  created: { label: '已创建', variant: 'secondary' },
  downloading: { label: '下载中', variant: 'default' },
  downloaded: { label: '已下载', variant: 'secondary' },
  parsing: { label: '解析中', variant: 'default' },
  parsed: { label: '已解析', variant: 'secondary' },
  generating_prompts: { label: '生成提示词', variant: 'default' },
  prompts_ready: { label: '提示词就绪', variant: 'secondary' },
  generating_images: { label: '生成图片', variant: 'default' },
  images_ready: { label: '图片就绪', variant: 'secondary' },
  generating_videos: { label: '生成视频', variant: 'default' },
  completed: { label: '已完成', variant: 'success' },
  failed: { label: '失败', variant: 'destructive' }
};

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const status = statusConfig[project.status] || {
    label: project.status,
    variant: 'secondary' as const
  };

  const handleView = () => {
    router.push(`/dashboard/youtube/project/${project.id}`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(project.id);
      setDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className='group cursor-pointer overflow-hidden transition-shadow hover:shadow-md'>
        <div className='bg-muted relative aspect-video' onClick={handleView}>
          {project.thumbnail_url ? (
            <img
              src={project.thumbnail_url}
              alt={project.name}
              className='h-full w-full object-cover'
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center'>
              <Video className='text-muted-foreground h-12 w-12' />
            </div>
          )}
          <div className='absolute top-2 right-2'>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </div>
        <CardHeader className='py-3'>
          <div className='flex items-start justify-between'>
            <CardTitle className='line-clamp-1 text-base' onClick={handleView}>
              {project.name}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon' className='h-8 w-8'>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={handleView}>
                  <Eye className='mr-2 h-4 w-4' />
                  查看
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteModalOpen(true)}
                  className='text-destructive focus:text-destructive'
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className='pt-0 pb-3'>
          <div className='text-muted-foreground space-y-0.5 text-sm'>
            <p>
              源视频:{' '}
              {project.source_storyboard_count !== undefined
                ? `${project.source_storyboard_count} 个分镜`
                : '--'}
            </p>
            <p>
              微创新:{' '}
              {project.innovation_storyboard_count !== undefined
                ? `${project.innovation_storyboard_count} 个分镜`
                : '--'}
            </p>
          </div>
        </CardContent>
      </Card>

      <AlertModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </>
  );
}
