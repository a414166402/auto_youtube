'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { GenerationTask, TaskStatus } from '@/types/youtube';
import { pauseTask, resumeTask, cancelTask } from '@/lib/api/youtube';
import {
  canPauseTask,
  canResumeTask,
  canCancelTask
} from '@/hooks/use-task-polling';
import { Pause, Play, XCircle, Loader2 } from 'lucide-react';

export interface TaskControlsProps {
  /** 任务数据 */
  task: GenerationTask | null;
  /** 任务状态变化回调 */
  onStatusChange?: (task: GenerationTask) => void;
  /** 操作错误回调 */
  onError?: (error: Error) => void;
  /** 自定义类名 */
  className?: string;
  /** 按钮大小 */
  size?: 'sm' | 'default' | 'lg';
  /** 是否显示文字标签 */
  showLabels?: boolean;
  /** 是否禁用所有按钮 */
  disabled?: boolean;
}

/**
 * 任务控制组件
 * 包含暂停/继续/取消按钮，根据任务状态显示/隐藏按钮
 */
export function TaskControls({
  task,
  onStatusChange,
  onError,
  className,
  size = 'default',
  showLabels = true,
  disabled = false
}: TaskControlsProps) {
  const [isLoading, setIsLoading] = useState<
    'pause' | 'resume' | 'cancel' | null
  >(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const status = task?.status;
  const taskId = task?.id;

  // 暂停任务
  const handlePause = useCallback(async () => {
    if (!taskId || !status || !canPauseTask(status)) return;

    setIsLoading('pause');
    try {
      await pauseTask(taskId);
      // 更新本地状态
      if (task && onStatusChange) {
        onStatusChange({ ...task, status: 'paused' });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('暂停任务失败');
      onError?.(error);
    } finally {
      setIsLoading(null);
    }
  }, [taskId, status, task, onStatusChange, onError]);

  // 继续任务
  const handleResume = useCallback(async () => {
    if (!taskId || !status || !canResumeTask(status)) return;

    setIsLoading('resume');
    try {
      await resumeTask(taskId);
      // 更新本地状态
      if (task && onStatusChange) {
        onStatusChange({ ...task, status: 'running' });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('继续任务失败');
      onError?.(error);
    } finally {
      setIsLoading(null);
    }
  }, [taskId, status, task, onStatusChange, onError]);

  // 取消任务
  const handleCancel = useCallback(async () => {
    if (!taskId || !status || !canCancelTask(status)) return;

    setIsLoading('cancel');
    try {
      await cancelTask(taskId);
      // 更新本地状态
      if (task && onStatusChange) {
        onStatusChange({ ...task, status: 'cancelled' });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('取消任务失败');
      onError?.(error);
    } finally {
      setIsLoading(null);
      setShowCancelDialog(false);
    }
  }, [taskId, status, task, onStatusChange, onError]);

  // 无任务时不显示
  if (!task) {
    return null;
  }

  const canPause = status ? canPauseTask(status) : false;
  const canResume = status ? canResumeTask(status) : false;
  const canCancel = status ? canCancelTask(status) : false;

  // 任务已终止时不显示控制按钮
  if (!canPause && !canResume && !canCancel) {
    return null;
  }

  return (
    <>
      <div className={cn('flex items-center gap-2', className)}>
        {/* 暂停按钮 */}
        {canPause && (
          <Button
            variant='outline'
            size={size}
            onClick={handlePause}
            disabled={disabled || isLoading !== null}
          >
            {isLoading === 'pause' ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Pause className='h-4 w-4' />
            )}
            {showLabels && <span className='ml-2'>暂停</span>}
          </Button>
        )}

        {/* 继续按钮 */}
        {canResume && (
          <Button
            variant='outline'
            size={size}
            onClick={handleResume}
            disabled={disabled || isLoading !== null}
          >
            {isLoading === 'resume' ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Play className='h-4 w-4' />
            )}
            {showLabels && <span className='ml-2'>继续</span>}
          </Button>
        )}

        {/* 取消按钮 */}
        {canCancel && (
          <Button
            variant='destructive'
            size={size}
            onClick={() => setShowCancelDialog(true)}
            disabled={disabled || isLoading !== null}
          >
            {isLoading === 'cancel' ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <XCircle className='h-4 w-4' />
            )}
            {showLabels && <span className='ml-2'>取消</span>}
          </Button>
        )}
      </div>

      {/* 取消确认对话框 */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认取消任务</AlertDialogTitle>
            <AlertDialogDescription>
              取消后任务将停止执行，已完成的部分将保留。此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading === 'cancel'}>
              返回
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isLoading === 'cancel'}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isLoading === 'cancel' ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  取消中...
                </>
              ) : (
                '确认取消'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * 紧凑版任务控制组件，只显示图标按钮
 */
export function CompactTaskControls({
  task,
  onStatusChange,
  onError,
  className,
  disabled = false
}: Omit<TaskControlsProps, 'size' | 'showLabels'>) {
  return (
    <TaskControls
      task={task}
      onStatusChange={onStatusChange}
      onError={onError}
      className={className}
      size='sm'
      showLabels={false}
      disabled={disabled}
    />
  );
}

/**
 * 获取任务状态的显示文本
 */
export function getTaskStatusLabel(status: TaskStatus): string {
  const labels: Record<TaskStatus, string> = {
    pending: '等待中',
    running: '进行中',
    completed: '已完成',
    failed: '失败',
    paused: '已暂停',
    cancelled: '已取消'
  };
  return labels[status];
}
