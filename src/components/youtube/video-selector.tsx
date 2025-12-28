'use client';

import { useState } from 'react';
import { Check, Play, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GeneratedVideo } from '@/types/youtube';

export interface VideoSelectorProps {
  /** The generated video data */
  video: GeneratedVideo;
  /** Whether this video is currently selected */
  isSelected: boolean;
  /** Callback when the video selection state changes */
  onSelect: (isSelected: boolean) => Promise<void>;
  /** Callback when play button is clicked */
  onPlay?: () => void;
  /** Optional className for the container */
  className?: string;
}

export function VideoSelector({
  video,
  isSelected,
  onSelect,
  onPlay,
  className
}: VideoSelectorProps) {
  const [isSelecting, setIsSelecting] = useState(false);

  const handleSelect = async () => {
    if (isSelecting) return;

    setIsSelecting(true);
    try {
      await onSelect(!isSelected);
    } finally {
      setIsSelecting(false);
    }
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay?.();
  };

  return (
    <div
      className={cn(
        'group relative aspect-video cursor-pointer overflow-hidden rounded-md',
        'border-2 transition-all duration-200',
        isSelected
          ? 'border-primary ring-primary/20 ring-2'
          : 'hover:border-muted-foreground/30 border-transparent',
        className
      )}
      onClick={handleSelect}
      role='button'
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`选择视频${isSelected ? ' (已选中)' : ''}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSelect();
        }
      }}
    >
      {/* Video thumbnail - using poster or first frame */}
      <video
        src={video.video_url}
        className='h-full w-full object-cover'
        muted
        playsInline
        preload='metadata'
      />

      {/* Play icon overlay */}
      <div className='absolute inset-0 flex items-center justify-center'>
        <div className='rounded-full bg-black/50 p-2'>
          <Play className='h-4 w-4 fill-white text-white' />
        </div>
      </div>

      {/* Selection overlay */}
      {isSelected && (
        <div className='bg-primary/20 absolute inset-0 flex items-center justify-center'>
          <div className='bg-primary text-primary-foreground rounded-full p-1'>
            <Check className='h-4 w-4' />
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isSelecting && (
        <div className='bg-background/50 absolute inset-0 flex items-center justify-center'>
          <Loader2 className='text-primary h-5 w-5 animate-spin' />
        </div>
      )}

      {/* Hover overlay with play button */}
      <div
        className={cn(
          'absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100',
          'flex items-center justify-center gap-2',
          isSelected && 'bg-black/20'
        )}
      >
        {onPlay && (
          <button
            onClick={handlePlay}
            className='rounded-full bg-white/90 p-2 transition-colors hover:bg-white'
            aria-label='播放视频'
          >
            <Play className='h-4 w-4 fill-gray-800 text-gray-800' />
          </button>
        )}
      </div>

      {/* Video badge */}
      <div className='absolute bottom-1 left-1'>
        <span className='rounded bg-green-500/80 px-1.5 py-0.5 text-[10px] text-white'>
          视频
        </span>
      </div>
    </div>
  );
}
