'use client';

import { useState } from 'react';
import { MoreVertical, Play, Download, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { ViralVideo } from '@/types/viral';

interface ViralVideoCardProps {
  video: ViralVideo;
  onEdit?: (video: ViralVideo) => void;
  onDelete?: (video: ViralVideo) => void;
  onDownloadMedia?: (video: ViralVideo) => void;
  onCreateProject?: (video: ViralVideo) => void;
  onViewDetail?: (video: ViralVideo) => void;
}

export function ViralVideoCard({
  video,
  onEdit,
  onDelete,
  onDownloadMedia,
  onCreateProject,
  onViewDetail
}: ViralVideoCardProps) {
  const { data, created_at } = video;
  const [imageError, setImageError] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatViewCount = (count?: number) => {
    if (!count) return null;
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}万`;
    }
    return count.toLocaleString();
  };

  return (
    <Card className='overflow-hidden transition-shadow hover:shadow-lg'>
      <CardContent className='p-4'>
        <div className='flex gap-4'>
          {/* 封面图 */}
          <div className='bg-muted relative h-24 w-40 flex-shrink-0 overflow-hidden rounded-md'>
            {data.image_host_cover_url && !imageError ? (
              <img
                src={data.image_host_cover_url}
                alt={data.name}
                className='h-full w-full object-cover'
                onError={() => setImageError(true)}
              />
            ) : (
              <div className='flex h-full w-full items-center justify-center'>
                <Play className='text-muted-foreground h-8 w-8' />
              </div>
            )}
          </div>

          {/* 内容区域 */}
          <div className='min-w-0 flex-1'>
            <div className='flex items-start justify-between gap-2'>
              <div className='min-w-0 flex-1'>
                <h3
                  className='hover:text-primary cursor-pointer truncate text-lg font-semibold'
                  onClick={() => onViewDetail?.(video)}
                >
                  {data.name}
                </h3>

                {/* 标签 */}
                {data.tags && data.tags.length > 0 && (
                  <div className='mt-2 flex flex-wrap gap-1'>
                    {data.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant='secondary'
                        className='text-xs'
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* 元信息 */}
                <div className='text-muted-foreground mt-2 flex items-center gap-4 text-sm'>
                  <span>创建时间: {formatDate(created_at)}</span>
                  {data.view_count && (
                    <span>播放量: {formatViewCount(data.view_count)}</span>
                  )}
                  {data.storyboard_descriptions && (
                    <span>分镜数: {data.storyboard_descriptions.length}</span>
                  )}
                </div>
              </div>

              {/* 操作按钮 */}
              <div className='flex items-center gap-2'>
                <Button size='sm' onClick={() => onCreateProject?.(video)}>
                  创建项目
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='icon'>
                      <MoreVertical className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem onClick={() => onViewDetail?.(video)}>
                      查看详情
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit?.(video)}>
                      <Edit className='mr-2 h-4 w-4' />
                      编辑
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDownloadMedia?.(video)}>
                      <Download className='mr-2 h-4 w-4' />
                      下载到图床
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete?.(video)}
                      className='text-destructive'
                    >
                      <Trash2 className='mr-2 h-4 w-4' />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
