'use client';

import { useState } from 'react';
import { Loader2, ArrowLeftRight } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface SwapStoryboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentIndex: number; // 当前分镜索引
  totalCount: number; // 总分镜数
  onConfirm: (indexA: number, indexB: number) => Promise<void>;
}

export function SwapStoryboardDialog({
  open,
  onOpenChange,
  currentIndex,
  totalCount,
  onConfirm
}: SwapStoryboardDialogProps) {
  const [targetIndex, setTargetIndex] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!targetIndex) return;

    setIsLoading(true);
    try {
      await onConfirm(currentIndex, parseInt(targetIndex, 10));
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setTargetIndex('');
      }
    }
  };

  // 生成可选的分镜列表（排除当前分镜）
  const availableIndices = Array.from(
    { length: totalCount },
    (_, i) => i
  ).filter((i) => i !== currentIndex);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[400px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <ArrowLeftRight className='h-5 w-5' />
            交换分镜位置
          </DialogTitle>
          <DialogDescription>
            将分镜 #{currentIndex + 1} 与哪个分镜交换位置？
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='target'>目标分镜</Label>
            <Select
              value={targetIndex}
              onValueChange={setTargetIndex}
              disabled={isLoading}
            >
              <SelectTrigger id='target'>
                <SelectValue placeholder='选择分镜' />
              </SelectTrigger>
              <SelectContent>
                {availableIndices.map((index) => (
                  <SelectItem key={index} value={index.toString()}>
                    分镜 #{index + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {targetIndex && (
            <p className='text-muted-foreground text-sm'>
              交换后：分镜 #{currentIndex + 1} ↔ 分镜 #
              {parseInt(targetIndex, 10) + 1}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || !targetIndex}>
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                交换中...
              </>
            ) : (
              <>确认交换</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
