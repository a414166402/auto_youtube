'use client';

import { useState } from 'react';
import { ExternalLink, Download, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { ViralVideo } from '@/types/viral';

interface ViralVideoDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video?: ViralVideo;
  onDownloadMedia?: (video: ViralVideo) => void;
  onEdit?: (video: ViralVideo) => void;
  onCreateProject?: (video: ViralVideo) => void;
}

export function ViralVideoDetail({
  open,
  onOpenChange,
  video,
  onDownloadMedia,
  onEdit,
  onCreateProject
}: ViralVideoDetailProps) {
  const [videoError, setVideoError] = useState(false);

  if (!video) return null;

  const { data, created_at } = video;
  const hasMedia = !!data.image_host_video_url || !!data.image_host_cover_url;

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
    if (!count) return '未知';
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}万`;
    }
    return count.toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] max-w-3xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{data.name}</DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* 视频预览 */}
          {data.image_host_video_url && !videoError ? (
            <div className='aspect-video overflow-hidden rounded-lg bg-black'>
              <video
                src={data.image_host_video_url}
                controls
                className='h-full w-full'
                onError={() => setVideoError(true)}
              />
            </div>
          ) : data.image_host_cover_url ? (
            <div className='bg-muted aspect-video overflow-hidden rounded-lg'>
              <img
                src={data.image_host_cover_url}
                alt={data.name}
                className='h-full w-full object-cover'
              />
            </div>
          ) : (
            <div className='bg-muted flex aspect-video items-center justify-center rounded-lg'>
              <p className='text-muted-foreground'>暂无预览</p>
            </div>
          )}

          {/* 基本信息 */}
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-medium'>YouTube URL:</span>
              <a
                href={data.youtube_url}
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary flex items-center gap-1 text-sm hover:underline'
              >
                {data.youtube_url}
                <ExternalLink className='h-3 w-3' />
              </a>
            </div>

            <div className='flex items-center gap-4 text-sm'>
              <div>
                <span className='font-medium'>播放量:</span>{' '}
                <span className='text-muted-foreground'>
                  {formatViewCount(data.view_count)}
                </span>
              </div>
              <div>
                <span className='font-medium'>创建时间:</span>{' '}
                <span className='text-muted-foreground'>
                  {formatDate(created_at)}
                </span>
              </div>
            </div>

            {/* 标签 */}
            {data.tags && data.tags.length > 0 && (
              <div>
                <span className='text-sm font-medium'>标签:</span>
                <div className='mt-2 flex flex-wrap gap-2'>
                  {data.tags.map((tag, index) => (
                    <Badge key={index} variant='secondary'>
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 图床状态 */}
            <div className='flex items-center gap-2 text-sm'>
              <span className='font-medium'>图床状态:</span>
              {hasMedia ? (
                <div className='flex items-center gap-1 text-green-600'>
                  <CheckCircle className='h-4 w-4' />
                  <span>已下载</span>
                </div>
              ) : (
                <div className='flex items-center gap-1 text-amber-600'>
                  <AlertCircle className='h-4 w-4' />
                  <span>未下载</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* 爆款分析 */}
          {data.analysis_text && (
            <div className='space-y-2'>
              <h3 className='font-semibold'>爆款分析</h3>
              <p className='text-muted-foreground text-sm whitespace-pre-wrap'>
                {data.analysis_text}
              </p>
            </div>
          )}

          {/* 分镜描述 */}
          {data.storyboard_descriptions &&
            data.storyboard_descriptions.length > 0 && (
              <div className='space-y-2'>
                <h3 className='font-semibold'>
                  分镜描述 ({data.storyboard_descriptions.length})
                </h3>
                <div className='space-y-2'>
                  {data.storyboard_descriptions.map((desc, index) => (
                    <div
                      key={index}
                      className='bg-muted rounded-md p-3 text-sm'
                    >
                      <span className='font-medium'>{index + 1}.</span> {desc}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* 操作按钮 */}
          <div className='flex justify-end gap-2 pt-4'>
            {!hasMedia && (
              <Button
                variant='outline'
                onClick={() => {
                  onDownloadMedia?.(video);
                  onOpenChange(false);
                }}
              >
                <Download className='mr-2 h-4 w-4' />
                下载到图床
              </Button>
            )}
            <Button
              variant='outline'
              onClick={() => {
                onEdit?.(video);
                onOpenChange(false);
              }}
            >
              编辑
            </Button>
            <Button
              onClick={() => {
                onCreateProject?.(video);
                onOpenChange(false);
              }}
            >
              创建项目
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
