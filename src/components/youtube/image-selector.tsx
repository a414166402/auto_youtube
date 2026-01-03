'use client';

import { useState } from 'react';
import { Check, ZoomIn, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { getProxiedImageUrl } from '@/lib/utils/media-proxy';
import type { GeneratedImage } from '@/types/youtube';

export interface ImageSelectorProps {
  /** The generated image data */
  image: GeneratedImage;
  /** Whether this image is currently selected */
  isSelected: boolean;
  /** Callback when the image selection state changes */
  onSelect: (isSelected: boolean) => Promise<void>;
  /** Optional className for the container */
  className?: string;
}

export function ImageSelector({
  image,
  isSelected,
  onSelect,
  className
}: ImageSelectorProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleSelect = async () => {
    if (isSelecting) return;

    setIsSelecting(true);
    try {
      await onSelect(!isSelected);
    } finally {
      setIsSelecting(false);
    }
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPreviewOpen(true);
  };

  return (
    <>
      <div
        className={cn(
          'group relative aspect-square cursor-pointer overflow-hidden rounded-md',
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
        aria-label={`选择图片${isSelected ? ' (已选中)' : ''}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSelect();
          }
        }}
      >
        {/* Image */}
        <img
          src={getProxiedImageUrl(image.url)}
          alt={`生成的图片`}
          className='h-full w-full object-cover'
        />

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

        {/* Hover overlay with preview button */}
        <div
          className={cn(
            'absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100',
            'flex items-center justify-center gap-2',
            isSelected && 'bg-black/20'
          )}
        >
          <button
            onClick={handlePreview}
            className='rounded-full bg-white/90 p-2 transition-colors hover:bg-white'
            aria-label='预览图片'
          >
            <ZoomIn className='h-4 w-4 text-gray-800' />
          </button>
        </div>

        {/* Generation type badge */}
        <div className='absolute bottom-1 left-1'>
          <span
            className={cn(
              'rounded px-1.5 py-0.5 text-[10px]',
              image.generation_type === 'text_to_image'
                ? 'bg-blue-500/80 text-white'
                : 'bg-purple-500/80 text-white'
            )}
          >
            {image.generation_type === 'text_to_image' ? '文生图' : '图文生图'}
          </span>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className='max-w-4xl'>
          <DialogHeader>
            <DialogTitle>图片预览</DialogTitle>
          </DialogHeader>
          <div className='bg-muted relative aspect-video overflow-hidden rounded-md'>
            <img
              src={getProxiedImageUrl(image.url)}
              alt='图片预览'
              className='h-full w-full object-contain'
            />
          </div>
          <div className='text-muted-foreground flex items-center justify-between text-sm'>
            <span>
              类型:{' '}
              {image.generation_type === 'text_to_image'
                ? '文生图'
                : '图文生图'}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
