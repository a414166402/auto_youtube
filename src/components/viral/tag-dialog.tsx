'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ViralTag, CreateTagRequest } from '@/types/viral';

interface TagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: ViralTag;
  onSubmit: (data: CreateTagRequest) => Promise<void>;
}

// 预设颜色
const PRESET_COLORS = [
  { name: '红色', value: '#ef4444' },
  { name: '橙色', value: '#f97316' },
  { name: '黄色', value: '#eab308' },
  { name: '绿色', value: '#22c55e' },
  { name: '蓝色', value: '#3b82f6' },
  { name: '紫色', value: '#8b5cf6' },
  { name: '粉色', value: '#ec4899' },
  { name: '灰色', value: '#6b7280' }
];

export function TagDialog({
  open,
  onOpenChange,
  tag,
  onSubmit
}: TagDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0].value);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 编辑模式时填充数据
  useEffect(() => {
    if (tag) {
      setName(tag.name);
      setColor(tag.color || PRESET_COLORS[0].value);
    } else {
      setName('');
      setColor(PRESET_COLORS[0].value);
    }
  }, [tag, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        color
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to submit tag:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>{tag ? '编辑标签' : '新增标签'}</DialogTitle>
          <DialogDescription>
            {tag ? '修改标签的名称和颜色' : '创建一个新的标签'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className='grid gap-4 py-4'>
            {/* 标签名称 */}
            <div className='grid gap-2'>
              <Label htmlFor='name'>
                标签名称 <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='name'
                placeholder='例如：搞笑、美食、旅行'
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* 标签颜色 */}
            <div className='grid gap-2'>
              <Label>标签颜色</Label>
              <div className='grid grid-cols-4 gap-2'>
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.value}
                    type='button'
                    className={`h-10 rounded-md border-2 transition-all ${
                      color === preset.value
                        ? 'border-primary ring-primary ring-2 ring-offset-2'
                        : 'hover:border-muted-foreground border-transparent'
                    }`}
                    style={{ backgroundColor: preset.value }}
                    onClick={() => setColor(preset.value)}
                    disabled={isSubmitting}
                    title={preset.name}
                  />
                ))}
              </div>
              <div className='mt-2 flex items-center gap-2'>
                <span className='text-muted-foreground text-sm'>
                  当前颜色：
                </span>
                <div
                  className='h-6 w-6 rounded border'
                  style={{ backgroundColor: color }}
                />
                <span className='text-muted-foreground text-sm'>{color}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type='submit' disabled={isSubmitting || !name.trim()}>
              {isSubmitting && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              {tag ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
