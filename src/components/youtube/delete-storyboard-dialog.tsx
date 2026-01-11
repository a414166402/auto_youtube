'use client';

import { useState } from 'react';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Storyboard } from '@/types/youtube';

interface DeleteStoryboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyboard: Storyboard | null;
  onConfirm: (index: number) => Promise<void>;
}

export function DeleteStoryboardDialog({
  open,
  onOpenChange,
  storyboard,
  onConfirm
}: DeleteStoryboardDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!storyboard) return;

    setIsLoading(true);
    try {
      await onConfirm(storyboard.index);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(newOpen);
    }
  };

  if (!storyboard) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='text-destructive flex items-center gap-2'>
            <Trash2 className='h-5 w-5' />
            确认删除分镜
          </DialogTitle>
          <DialogDescription>
            确定要删除分镜 #{storyboard.index + 1} 吗？
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* 提示词预览 */}
          <div className='space-y-3'>
            <p className='text-sm font-medium'>提示词预览：</p>
            <ScrollArea className='h-48 rounded-md border p-3'>
              <div className='space-y-3'>
                <div className='space-y-1'>
                  <p className='text-muted-foreground text-xs font-medium'>
                    文生图提示词
                  </p>
                  <p className='bg-muted/50 rounded p-2 text-sm whitespace-pre-wrap'>
                    {storyboard.text_to_image || '(空)'}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-muted-foreground text-xs font-medium'>
                    图生视频提示词
                  </p>
                  <p className='bg-muted/50 rounded p-2 text-sm whitespace-pre-wrap'>
                    {storyboard.image_to_video || '(空)'}
                  </p>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* 警告信息 */}
          <Alert>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>
              删除后，后续分镜将重新编号。此操作不可撤销。
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button
            variant='destructive'
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                删除中...
              </>
            ) : (
              <>确认删除</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
