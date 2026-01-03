'use client';

import { useState } from 'react';
import { Clock, Save, Loader2, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { SourceStoryboard } from '@/types/youtube';

export interface StoryboardCardProps {
  storyboard: SourceStoryboard;
  onSaveDescription: (id: string, description: string) => Promise<void>;
  onAdjustTime: (storyboard: SourceStoryboard) => void;
}

// 格式化时间为 MM:SS 格式
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function StoryboardCard({
  storyboard,
  onSaveDescription,
  onAdjustTime
}: StoryboardCardProps) {
  const [description, setDescription] = useState(storyboard.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    setHasChanges(value !== (storyboard.description || ''));
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    try {
      await onSaveDescription(storyboard.id, description);
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className='overflow-hidden'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-base'>
            分镜 #{storyboard.index}
          </CardTitle>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onAdjustTime(storyboard)}
            className='gap-1'
          >
            <Clock className='h-3.5 w-3.5' />
            {formatTime(storyboard.start_time)} -{' '}
            {formatTime(storyboard.end_time)}
          </Button>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* 首帧和尾帧图片 */}
        <div className='grid grid-cols-2 gap-3'>
          <div className='space-y-1.5'>
            <p className='text-muted-foreground text-xs'>首帧</p>
            <div className='bg-muted relative aspect-video overflow-hidden rounded-md'>
              {storyboard.start_frame_url ? (
                <img
                  src={storyboard.start_frame_url}
                  alt={`分镜 ${storyboard.index} 首帧`}
                  className='h-full w-full object-cover'
                />
              ) : (
                <div className='flex h-full w-full items-center justify-center'>
                  <ImageIcon className='text-muted-foreground h-8 w-8' />
                </div>
              )}
            </div>
          </div>
          <div className='space-y-1.5'>
            <p className='text-muted-foreground text-xs'>尾帧</p>
            <div className='bg-muted relative aspect-video overflow-hidden rounded-md'>
              {storyboard.end_frame_url ? (
                <img
                  src={storyboard.end_frame_url}
                  alt={`分镜 ${storyboard.index} 尾帧`}
                  className='h-full w-full object-cover'
                />
              ) : (
                <div className='flex h-full w-full items-center justify-center'>
                  <ImageIcon className='text-muted-foreground h-8 w-8' />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 内容描述输入框 */}
        <div className='space-y-2'>
          <label className='text-sm font-medium'>内容描述</label>
          <Textarea
            placeholder='请输入该分镜的内容描述...'
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            className='min-h-[80px] resize-none'
          />
        </div>

        {/* 保存按钮 */}
        <div className='flex justify-end'>
          <Button
            size='sm'
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={cn('gap-1.5', hasChanges && 'animate-pulse')}
          >
            {isSaving ? (
              <Loader2 className='h-3.5 w-3.5 animate-spin' />
            ) : (
              <Save className='h-3.5 w-3.5' />
            )}
            保存
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
