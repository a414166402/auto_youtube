'use client';

import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { InsertType } from '@/types/youtube';

interface AddStoryboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referenceIndex: number; // 参考分镜的索引
  onConfirm: (position: number, insertType: InsertType) => Promise<void>;
}

export function AddStoryboardDialog({
  open,
  onOpenChange,
  referenceIndex,
  onConfirm
}: AddStoryboardDialogProps) {
  const [insertType, setInsertType] = useState<InsertType>('after');
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm(referenceIndex, insertType);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setInsertType('after');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[400px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Plus className='h-5 w-5' />
            新增分镜
          </DialogTitle>
          <DialogDescription>
            在分镜 #{referenceIndex + 1} 的哪个位置插入？
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <RadioGroup
            value={insertType}
            onValueChange={(value) => setInsertType(value as InsertType)}
            disabled={isLoading}
          >
            <div className='flex items-center space-x-2'>
              <RadioGroupItem value='before' id='before' />
              <Label htmlFor='before' className='cursor-pointer'>
                在前面插入（成为新的 #{referenceIndex + 1}）
              </Label>
            </div>
            <div className='flex items-center space-x-2'>
              <RadioGroupItem value='after' id='after' />
              <Label htmlFor='after' className='cursor-pointer'>
                在后面插入（成为新的 #{referenceIndex + 2}）
              </Label>
            </div>
          </RadioGroup>

          <p className='text-muted-foreground text-xs'>
            新分镜将为空白，需要手动填写提示词
          </p>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                插入中...
              </>
            ) : (
              <>确认插入</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
