'use client';

import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { ViralVideo, CreateViralVideoRequest } from '@/types/viral';

interface ViralVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video?: ViralVideo;
  availableTags?: string[];
  onSubmit: (data: CreateViralVideoRequest) => Promise<void>;
}

export function ViralVideoDialog({
  open,
  onOpenChange,
  video,
  availableTags = [],
  onSubmit
}: ViralVideoDialogProps) {
  const [formData, setFormData] = useState<CreateViralVideoRequest>({
    name: '',
    youtube_url: '',
    view_count: undefined,
    tags: [],
    analysis_text: '',
    storyboard_descriptions: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStoryboard, setNewStoryboard] = useState('');

  // 初始化表单数据
  useEffect(() => {
    if (video) {
      setFormData({
        name: video.data.name,
        youtube_url: video.data.youtube_url,
        view_count: video.data.view_count,
        tags: video.data.tags || [],
        analysis_text: video.data.analysis_text || '',
        storyboard_descriptions: video.data.storyboard_descriptions || []
      });
    } else {
      setFormData({
        name: '',
        youtube_url: '',
        view_count: undefined,
        tags: [],
        analysis_text: '',
        storyboard_descriptions: []
      });
    }
  }, [video, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddStoryboard = () => {
    if (newStoryboard.trim()) {
      setFormData({
        ...formData,
        storyboard_descriptions: [
          ...(formData.storyboard_descriptions || []),
          newStoryboard.trim()
        ]
      });
      setNewStoryboard('');
    }
  };

  const handleRemoveStoryboard = (index: number) => {
    setFormData({
      ...formData,
      storyboard_descriptions: formData.storyboard_descriptions?.filter(
        (_, i) => i !== index
      )
    });
  };

  const handleToggleTag = (tag: string) => {
    const currentTags = formData.tags || [];
    if (currentTags.includes(tag)) {
      setFormData({
        ...formData,
        tags: currentTags.filter((t) => t !== tag)
      });
    } else {
      setFormData({
        ...formData,
        tags: [...currentTags, tag]
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[90vh] max-w-2xl flex-col'>
        <DialogHeader className='flex-shrink-0'>
          <DialogTitle>{video ? '编辑爆款视频' : '新增爆款视频'}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className='flex flex-1 flex-col overflow-hidden'
        >
          <div className='flex-1 space-y-4 overflow-y-auto'>
            {/* 视频名称 */}
            <div className='space-y-2'>
              <Label htmlFor='name'>
                视频名称 <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='name'
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder='请输入视频名称'
                required
                maxLength={200}
              />
            </div>

            {/* YouTube URL */}
            <div className='space-y-2'>
              <Label htmlFor='youtube_url'>
                YouTube URL <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='youtube_url'
                type='url'
                value={formData.youtube_url}
                onChange={(e) =>
                  setFormData({ ...formData, youtube_url: e.target.value })
                }
                placeholder='https://www.youtube.com/watch?v=...'
                required
              />
            </div>

            {/* 播放量 */}
            <div className='space-y-2'>
              <Label htmlFor='view_count'>播放量</Label>
              <Input
                id='view_count'
                type='number'
                value={formData.view_count || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    view_count: e.target.value
                      ? parseInt(e.target.value)
                      : undefined
                  })
                }
                placeholder='请输入播放量'
                min={0}
              />
            </div>

            {/* 标签选择 */}
            <div className='space-y-2'>
              <Label>标签</Label>
              <div className='flex flex-wrap gap-2'>
                {availableTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={
                      formData.tags?.includes(tag) ? 'default' : 'outline'
                    }
                    className='cursor-pointer'
                    onClick={() => handleToggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 爆款分析 */}
            <div className='space-y-2'>
              <Label htmlFor='analysis_text'>爆款分析</Label>
              <Textarea
                id='analysis_text'
                value={formData.analysis_text}
                onChange={(e) =>
                  setFormData({ ...formData, analysis_text: e.target.value })
                }
                placeholder='请输入爆款分析文本...'
                rows={4}
              />
            </div>

            {/* 分镜描述 */}
            <div className='space-y-2'>
              <Label>分镜描述</Label>
              <div className='space-y-2'>
                {formData.storyboard_descriptions?.map((desc, index) => (
                  <div key={index} className='flex items-start gap-2'>
                    <div className='bg-muted flex-1 rounded-md p-2 text-sm'>
                      {index + 1}. {desc}
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => handleRemoveStoryboard(index)}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                ))}

                <div className='flex gap-2'>
                  <Input
                    value={newStoryboard}
                    onChange={(e) => setNewStoryboard(e.target.value)}
                    placeholder='输入分镜描述...'
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddStoryboard();
                      }
                    }}
                  />
                  <Button
                    type='button'
                    variant='outline'
                    onClick={handleAddStoryboard}
                  >
                    <Plus className='mr-1 h-4 w-4' />
                    添加
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className='flex flex-shrink-0 justify-end gap-2 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? '保存中...' : '保存'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
