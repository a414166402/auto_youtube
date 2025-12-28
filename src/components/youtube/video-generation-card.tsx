'use client';

import { RefreshCw, Check, Loader2, ImageIcon, Plus, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Prompt, GeneratedImage, GeneratedVideo } from '@/types/youtube';
import { VideoSelector } from '@/components/youtube/video-selector';

export type VideoGenerationStatus =
  | 'selected'
  | 'generating'
  | 'pending'
  | 'has_videos';

export interface VideoGenerationCardProps {
  /** The prompt data (微创新分镜) */
  prompt: Prompt;
  /** The source image for video generation */
  sourceImage: GeneratedImage | null;
  /** Array of generated videos for this prompt */
  videos: GeneratedVideo[];
  /** Current status of the video generation */
  status: VideoGenerationStatus;
  /** Callback when a video is selected/deselected */
  onSelectVideo: (videoId: string, isSelected: boolean) => Promise<void>;
  /** Callback to regenerate videos for this prompt */
  onRegenerate: () => void;
  /** Callback when video play is requested */
  onPlayVideo?: (video: GeneratedVideo) => void;
  /** Whether generation is currently in progress globally */
  isGenerating?: boolean;
}

// Get status badge variant and text
function getStatusBadge(status: VideoGenerationStatus): {
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  text: string;
} {
  switch (status) {
    case 'selected':
      return { variant: 'default', text: '已选择' };
    case 'generating':
      return { variant: 'secondary', text: '生成中...' };
    case 'has_videos':
      return { variant: 'outline', text: '待选择' };
    case 'pending':
    default:
      return { variant: 'outline', text: '待生成' };
  }
}

export function VideoGenerationCard({
  prompt,
  sourceImage,
  videos,
  status,
  onSelectVideo,
  onRegenerate,
  onPlayVideo,
  isGenerating = false
}: VideoGenerationCardProps) {
  const statusBadge = getStatusBadge(status);
  const hasVideos = videos.length > 0;
  const hasCharacterRefs =
    prompt.character_refs && prompt.character_refs.length > 0;

  return (
    <Card className='overflow-hidden'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-base'>
            微创新分镜 #{prompt.storyboard_index}
          </CardTitle>
          <Badge variant={statusBadge.variant} className='gap-1'>
            {status === 'selected' && <Check className='h-3 w-3' />}
            {status === 'generating' && (
              <Loader2 className='h-3 w-3 animate-spin' />
            )}
            {statusBadge.text}
          </Badge>
        </div>
        {/* 显示角色引用 */}
        {hasCharacterRefs && (
          <div className='text-muted-foreground flex items-center gap-2 text-sm'>
            <span>角色引用:</span>
            <div className='flex gap-1'>
              {prompt.character_refs!.map((ref) => (
                <Badge key={ref} variant='outline' className='gap-1 text-xs'>
                  <User className='h-2.5 w-2.5' />
                  {ref}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Source image and generated videos */}
        <div className='flex gap-4'>
          {/* Source image */}
          <div className='w-32 flex-shrink-0'>
            <p className='text-muted-foreground mb-1 text-xs'>源图片</p>
            <div className='bg-muted relative aspect-video overflow-hidden rounded-md'>
              {sourceImage ? (
                <img
                  src={sourceImage.image_url}
                  alt={`分镜 ${prompt.storyboard_index} 源图片`}
                  className='h-full w-full object-cover'
                />
              ) : (
                <div className='flex h-full w-full flex-col items-center justify-center gap-1'>
                  <ImageIcon className='text-muted-foreground h-6 w-6' />
                  <span className='text-muted-foreground text-xs'>
                    未选择图片
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Generated videos grid */}
          <div className='flex-1'>
            <div className='mb-1 flex items-center justify-between'>
              <p className='text-muted-foreground text-xs'>
                生成的视频 ({videos.length})
              </p>
              <Button
                variant='ghost'
                size='sm'
                onClick={onRegenerate}
                disabled={isGenerating || !sourceImage}
                className='h-7 gap-1 text-xs'
              >
                {status === 'generating' ? (
                  <Loader2 className='h-3 w-3 animate-spin' />
                ) : (
                  <Plus className='h-3 w-3' />
                )}
                重新生成
              </Button>
            </div>

            {hasVideos ? (
              <div className='grid grid-cols-3 gap-2'>
                {videos.map((video) => (
                  <VideoSelector
                    key={video.id}
                    video={video}
                    isSelected={video.is_selected}
                    onSelect={(isSelected: boolean) =>
                      onSelectVideo(video.id, isSelected)
                    }
                    onPlay={onPlayVideo ? () => onPlayVideo(video) : undefined}
                  />
                ))}
              </div>
            ) : (
              <div
                className={cn(
                  'flex h-24 items-center justify-center rounded-md border-2 border-dashed',
                  status === 'generating'
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-muted',
                  !sourceImage && 'opacity-50'
                )}
              >
                {status === 'generating' ? (
                  <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    正在生成...
                  </div>
                ) : !sourceImage ? (
                  <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                    <ImageIcon className='h-4 w-4' />
                    请先选择源图片
                  </div>
                ) : (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={onRegenerate}
                    disabled={isGenerating}
                    className='gap-1'
                  >
                    <RefreshCw className='h-4 w-4' />
                    开始生成
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 图生视频提示词预览 */}
        <div className='text-muted-foreground bg-muted/50 rounded-md p-2 text-sm'>
          <p className='mb-1 text-xs font-medium'>图生视频提示词:</p>
          <p className='line-clamp-2'>{prompt.image_to_video || '暂无'}</p>
        </div>
      </CardContent>
    </Card>
  );
}
