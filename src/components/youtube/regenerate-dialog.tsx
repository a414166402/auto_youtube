'use client';

import { useState } from 'react';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { PromptHistorySummary } from '@/types/youtube';

interface RegenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromVersion: string;
  allVersions: PromptHistorySummary[];
  onConfirm: (fromVersion: string, instruction: string) => Promise<void>;
}

export function RegenerateDialog({
  open,
  onOpenChange,
  fromVersion,
  allVersions,
  onConfirm
}: RegenerateDialogProps) {
  const [instruction, setInstruction] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 找出将被删除的版本
  const fromVersionNum = parseInt(fromVersion.replace('v', ''), 10);
  const versionsToDelete = allVersions
    .filter((v) => {
      const vNum = parseInt(v.version.replace('v', ''), 10);
      return vNum > fromVersionNum;
    })
    .sort((a, b) => {
      const numA = parseInt(a.version.replace('v', ''), 10);
      const numB = parseInt(b.version.replace('v', ''), 10);
      return numA - numB;
    });

  const handleConfirm = async () => {
    if (!instruction.trim()) return;

    setIsLoading(true);
    try {
      await onConfirm(fromVersion, instruction.trim());
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

  // 计算新版本号
  const newVersion = `v${fromVersionNum + 1}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <RefreshCw className='h-5 w-5' />
            重新生成
          </DialogTitle>
          <DialogDescription>
            从版本 {fromVersion} 重新开始对话，生成新版本 {newVersion}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* 警告信息 */}
          {versionsToDelete.length > 0 && (
            <Alert variant='destructive'>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>
                <strong>警告：</strong>此操作将删除以下版本，且不可撤销：
                <ul className='mt-2 list-inside list-disc'>
                  {versionsToDelete.map((v) => (
                    <li key={v.version}>
                      {v.version} -{' '}
                      {new Date(v.created_at).toLocaleString('zh-CN')}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className='space-y-2'>
            <Label htmlFor='instruction'>修改指令</Label>
            <Textarea
              id='instruction'
              placeholder='请输入新的修改指令，例如：换一种完全不同的风格...'
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className='min-h-[120px] resize-none'
              disabled={isLoading}
            />
            <p className='text-muted-foreground text-xs'>
              AI 将从 {fromVersion} 版本重新开始对话，根据您的指令生成新的提示词
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
            variant='destructive'
            onClick={handleConfirm}
            disabled={isLoading || !instruction.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                生成中...
              </>
            ) : (
              <>确认重新生成</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
