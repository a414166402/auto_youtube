'use client';

import { useState } from 'react';
import { Loader2, Copy, Check, X } from 'lucide-react';
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

interface CopyProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalName: string;
  onConfirm: (newName: string) => Promise<void>;
}

export function CopyProjectDialog({
  open,
  onOpenChange,
  originalName,
  onConfirm
}: CopyProjectDialogProps) {
  const [name, setName] = useState(`${originalName} - 副本`);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await onConfirm(name.trim());
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(newOpen);
      if (newOpen) {
        setName(`${originalName} - 副本`);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[450px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Copy className='h-5 w-5' />
            复制项目
          </DialogTitle>
          <DialogDescription>
            创建项目的副本，包含所有提示词和配置
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>新项目名称</Label>
            <Input
              id='name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='请输入新项目名称'
              disabled={isLoading}
            />
          </div>

          {/* 复制内容说明 */}
          <div className='space-y-2'>
            <p className='text-sm font-medium'>复制内容：</p>
            <ul className='text-muted-foreground space-y-1 text-sm'>
              <li className='flex items-center gap-2'>
                <Check className='h-4 w-4 text-green-500' />
                项目名称和 YouTube URL
              </li>
              <li className='flex items-center gap-2'>
                <Check className='h-4 w-4 text-green-500' />
                所有提示词历史版本
              </li>
              <li className='flex items-center gap-2'>
                <Check className='h-4 w-4 text-green-500' />
                主体映射配置
              </li>
              <li className='flex items-center gap-2'>
                <Check className='h-4 w-4 text-green-500' />
                图片生成比例设置
              </li>
            </ul>
          </div>

          <div className='space-y-2'>
            <p className='text-sm font-medium'>不复制：</p>
            <ul className='text-muted-foreground space-y-1 text-sm'>
              <li className='flex items-center gap-2'>
                <X className='h-4 w-4 text-red-500' />
                已生成的图片
              </li>
              <li className='flex items-center gap-2'>
                <X className='h-4 w-4 text-red-500' />
                已生成的视频
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || !name.trim()}>
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                复制中...
              </>
            ) : (
              <>确认复制</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
