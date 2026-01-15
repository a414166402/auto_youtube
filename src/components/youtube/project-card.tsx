'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MoreHorizontal, Eye, Trash2, Video, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { AlertModal } from '@/components/modal/alert-modal';
import { CopyProjectDialog } from './copy-project-dialog';
import type { ProjectListItem, ProjectStatus } from '@/types/youtube';

interface ProjectCardProps {
  project: ProjectListItem;
  onDelete: (id: string) => Promise<void>;
  onCopy?: (id: string, newName: string) => Promise<void>;
}

// 与后端ProjectStatus枚举对齐
const statusConfig: Record<
  ProjectStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
  }
> = {
  created: { label: '已创建', variant: 'secondary' },
  prompts_ready: { label: '提示词就绪', variant: 'default' },
  images_partial: { label: '图片生成中', variant: 'default' },
  images_ready: { label: '图片就绪', variant: 'secondary' },
  videos_partial: { label: '视频生成中', variant: 'default' },
  completed: { label: '已完成', variant: 'success' },
  failed: { label: '失败', variant: 'destructive' }
};

export function ProjectCard({ project, onDelete, onCopy }: ProjectCardProps) {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);

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

  const handleCopy = async (newName: string) => {
    if (onCopy) {
      await onCopy(project.id, newName);
    }
  };

  // 判断是否有有效的封面图片
  const hasCoverImage = project.cover_url && !imageError;

  return (
    <>
      <Card className='group cursor-pointer overflow-hidden transition-shadow hover:shadow-md'>
        <div className='bg-muted relative aspect-video' onClick={handleView}>
          {hasCoverImage ? (
            <Image
              src={project.cover_url!}
              alt={project.name}
              fill
              className='object-cover'
              onError={() => setImageError(true)}
              unoptimized
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
                {onCopy && (
                  <DropdownMenuItem onClick={() => setCopyDialogOpen(true)}>
                    <Copy className='mr-2 h-4 w-4' />
                    复制
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
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
              分镜数:{' '}
              {project.storyboard_count > 0
                ? `${project.storyboard_count} 个`
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

      {onCopy && (
        <CopyProjectDialog
          open={copyDialogOpen}
          onOpenChange={setCopyDialogOpen}
          originalName={project.name}
          onConfirm={handleCopy}
        />
      )}
    </>
  );
}
