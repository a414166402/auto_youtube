'use client';

import { useState } from 'react';
import { Loader2, MessageSquarePlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ContinueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentVersion: string;
  onConfirm: (instruction: string) => Promise<void>;
}

export function ContinueDialog({
  open,
  onOpenChange,
  currentVersion,
  onConfirm
}: ContinueDialogProps) {
  const [instruction, setInstruction] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!instruction.trim()) return;

    setIsLoading(true);
    try {
      await onConfirm(instruction.trim());
      setInstruction('');
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setInstruction('');
      }
    }
  };

  // 计算下一个版本号
  const nextVersion = `v${parseInt(currentVersion.replace('v', ''), 10) + 1}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <MessageSquarePlus className='h-5 w-5' />
            继续对话
          </DialogTitle>
          <DialogDescription>
            基于当前版本 {currentVersion} 继续对话，生成新版本 {nextVersion}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='instruction'>修改指令</Label>
            <Textarea
              id='instruction'
              placeholder='请输入修改指令，例如：让画面更科幻，增加霓虹灯效果...'
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className='min-h-[120px] resize-none'
              disabled={isLoading}
            />
            <p className='text-muted-foreground text-xs'>
              AI 将基于当前版本的对话历史，根据您的指令生成新的提示词
            </p>
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
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !instruction.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                生成中...
              </>
            ) : (
              <>生成新版本</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
