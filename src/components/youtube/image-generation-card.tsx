'use client';

import { RefreshCw, Check, Loader2, Plus, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Prompt, GeneratedImage } from '@/types/youtube';
import { ImageSelector } from '@/components/youtube/image-selector';

export type StoryboardGenerationStatus =
  | 'selected'
  | 'generating'
  | 'pending'
  | 'has_images';

export interface ImageGenerationCardProps {
  /** The prompt data (微创新分镜) */
  prompt: Prompt;
  /** Array of generated images for this prompt */
  images: GeneratedImage[];
  /** Current status of the generation */
  status: StoryboardGenerationStatus;
  /** Callback when an image is selected/deselected */
  onSelectImage: (imageId: string, isSelected: boolean) => Promise<void>;
  /** Callback to regenerate images for this prompt */
  onRegenerate: () => void;
  /** Whether generation is currently in progress globally */
  isGenerating?: boolean;
}

// Get status badge variant and text
function getStatusBadge(status: StoryboardGenerationStatus): {
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  text: string;
} {
  switch (status) {
    case 'selected':
      return { variant: 'default', text: '已选择' };
    case 'generating':
      return { variant: 'secondary', text: '生成中...' };
    case 'has_images':
      return { variant: 'outline', text: '待选择' };
    case 'pending':
    default:
      return { variant: 'outline', text: '待生成' };
  }
}

// Get generation type display
function getGenerationTypeDisplay(prompt: Prompt): {
  text: string;
  hasCharacterRefs: boolean;
} {
  const hasCharacterRefs =
    prompt.character_refs && prompt.character_refs.length > 0;
  if (hasCharacterRefs) {
    return {
      text: `图文生图 (角色: ${prompt.character_refs!.join(', ')})`,
      hasCharacterRefs: true
    };
  }
  return {
    text: '文生图 (无角色引用)',
    hasCharacterRefs: false
  };
}

export function ImageGenerationCard({
  prompt,
  images,
  status,
  onSelectImage,
  onRegenerate,
  isGenerating = false
}: ImageGenerationCardProps) {
  const statusBadge = getStatusBadge(status);
  const hasImages = images.length > 0;
  const generationType = getGenerationTypeDisplay(prompt);

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
        {/* 显示生成方式 */}
        <div className='text-muted-foreground flex items-center gap-2 text-sm'>
          <span>生成方式:</span>
          <span
            className={cn(
              generationType.hasCharacterRefs ? 'text-primary' : ''
            )}
          >
            {generationType.text}
          </span>
          {generationType.hasCharacterRefs && (
            <div className='flex gap-1'>
              {prompt.character_refs!.map((ref) => (
                <Badge key={ref} variant='outline' className='gap-1 text-xs'>
                  <User className='h-2.5 w-2.5' />
                  {ref}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Generated images grid */}
        <div>
          <div className='mb-2 flex items-center justify-between'>
            <p className='text-muted-foreground text-xs'>
              生成的图片 ({images.length})
            </p>
            <Button
              variant='ghost'
              size='sm'
              onClick={onRegenerate}
              disabled={isGenerating}
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

          {hasImages ? (
            <div className='grid grid-cols-4 gap-2'>
              {images.map((image) => (
                <ImageSelector
                  key={image.id}
                  image={image}
                  isSelected={image.is_selected}
                  onSelect={(isSelected: boolean) =>
                    onSelectImage(image.id, isSelected)
                  }
                />
              ))}
            </div>
          ) : (
            <div
              className={cn(
                'flex h-24 items-center justify-center rounded-md border-2 border-dashed',
                status === 'generating'
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-muted'
              )}
            >
              {status === 'generating' ? (
                <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  正在生成...
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

        {/* 提示词预览 */}
        <div className='text-muted-foreground bg-muted/50 rounded-md p-2 text-sm'>
          <p className='mb-1 text-xs font-medium'>文生图提示词:</p>
          <p className='line-clamp-2'>{prompt.text_to_image || '暂无'}</p>
        </div>
      </CardContent>
    </Card>
  );
}
