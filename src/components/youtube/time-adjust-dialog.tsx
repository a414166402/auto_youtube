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
import type { Storyboard } from '@/types/youtube';

export interface TimeAdjustDialogProps {
  storyboard: Storyboard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, startTime: number, endTime: number) => Promise<void>;
}

// 将秒数转换为 MM:SS.ms 格式
function formatTimeInput(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${mins.toString().padStart(2, '0')}:${secs.padStart(4, '0')}`;
}

// 将 MM:SS.ms 格式转换为秒数
function parseTimeInput(timeStr: string): number | null {
  const match = timeStr.match(/^(\d{1,2}):(\d{1,2}(?:\.\d+)?)$/);
  if (!match) return null;

  const mins = parseInt(match[1], 10);
  const secs = parseFloat(match[2]);

  if (isNaN(mins) || isNaN(secs) || mins < 0 || secs < 0 || secs >= 60) {
    return null;
  }

  return mins * 60 + secs;
}

export function TimeAdjustDialog({
  storyboard,
  open,
  onOpenChange,
  onSave
}: TimeAdjustDialogProps) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [startError, setStartError] = useState('');
  const [endError, setEndError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 当分镜数据变化时，更新输入框
  useEffect(() => {
    if (storyboard) {
      setStartTime(formatTimeInput(storyboard.start_time));
      setEndTime(formatTimeInput(storyboard.end_time));
      setStartError('');
      setEndError('');
    }
  }, [storyboard]);

  const validateAndSave = async () => {
    if (!storyboard) return;

    // 验证开始时间
    const parsedStart = parseTimeInput(startTime);
    if (parsedStart === null) {
      setStartError('请输入有效的时间格式 (MM:SS.ms)');
      return;
    }
    setStartError('');

    // 验证结束时间
    const parsedEnd = parseTimeInput(endTime);
    if (parsedEnd === null) {
      setEndError('请输入有效的时间格式 (MM:SS.ms)');
      return;
    }
    setEndError('');

    // 验证开始时间小于结束时间
    if (parsedStart >= parsedEnd) {
      setEndError('结束时间必须大于开始时间');
      return;
    }

    // 验证时间不能为负数
    if (parsedStart < 0) {
      setStartError('开始时间不能为负数');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(storyboard.id, parsedStart, parsedEnd);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>调整分镜时间</DialogTitle>
          <DialogDescription>
            {storyboard && `分镜 #${storyboard.index} 的时间范围`}
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid gap-2'>
            <Label htmlFor='start-time'>开始时间</Label>
            <Input
              id='start-time'
              placeholder='00:00.0'
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                setStartError('');
              }}
              className={startError ? 'border-destructive' : ''}
            />
            {startError && (
              <p className='text-destructive text-xs'>{startError}</p>
            )}
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='end-time'>结束时间</Label>
            <Input
              id='end-time'
              placeholder='00:00.0'
              value={endTime}
              onChange={(e) => {
                setEndTime(e.target.value);
                setEndError('');
              }}
              className={endError ? 'border-destructive' : ''}
            />
            {endError && <p className='text-destructive text-xs'>{endError}</p>}
          </div>
          <p className='text-muted-foreground text-xs'>
            时间格式: MM:SS.ms (例如: 01:30.5 表示1分30.5秒)
          </p>
        </div>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            取消
          </Button>
          <Button onClick={validateAndSave} disabled={isSaving}>
            {isSaving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
