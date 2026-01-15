'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface InstructionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoName?: string;
  onSubmit: (instruction: string) => Promise<void>;
}

export function InstructionDialog({
  open,
  onOpenChange,
  videoName,
  onSubmit
}: InstructionDialogProps) {
  const [instruction, setInstruction] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!instruction.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(instruction.trim());
      setInstruction('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[85vh] max-w-lg flex-col'>
        <DialogHeader className='flex-shrink-0'>
          <DialogTitle>创建项目</DialogTitle>
          <DialogDescription>
            从爆款视频&quot;{videoName}&quot;创建新项目，请输入改编指令
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className='flex flex-1 flex-col overflow-hidden'
        >
          <div className='flex-1 space-y-2 overflow-y-auto'>
            <Label htmlFor='instruction'>
              改编指令 <span className='text-destructive'>*</span>
            </Label>
            <Textarea
              id='instruction'
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder='请输入改编指令，例如：将这个视频改编成科幻风格，保留核心剧情但更换场景为太空站...'
              rows={6}
              required
            />
            <p className='text-muted-foreground text-sm'>
              改编指令将帮助AI理解您想要如何改编这个爆款视频
            </p>
          </div>

          <div className='flex flex-shrink-0 justify-end gap-2 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              type='submit'
              disabled={isSubmitting || !instruction.trim()}
            >
              {isSubmitting ? '创建中...' : '创建项目'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
