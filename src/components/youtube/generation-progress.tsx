'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { GenerationTask } from '@/types/youtube';
import { calculateTaskProgress } from '@/hooks/use-task-polling';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Pause,
  Ban
} from 'lucide-react';

export interface GenerationProgressProps {
  /** 任务数据 */
  task: GenerationTask | null;
  /** 是否显示详细统计 */
  showStats?: boolean;
  /** 是否显示动画 */
  animated?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 进度条高度 */
  height?: 'sm' | 'md' | 'lg';
}

const heightClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4'
};

const statusConfig = {
  pending: {
    label: '等待中',
    color: 'bg-muted-foreground',
    icon: Clock
  },
  running: {
    label: '进行中',
    color: 'bg-primary',
    icon: Loader2
  },
  completed: {
    label: '已完成',
    color: 'bg-green-500',
    icon: CheckCircle2
  },
  failed: {
    label: '失败',
    color: 'bg-destructive',
    icon: XCircle
  },
  paused: {
    label: '已暂停',
    color: 'bg-yellow-500',
    icon: Pause
  },
  cancelled: {
    label: '已取消',
    color: 'bg-muted-foreground',
    icon: Ban
  }
};

/**
 * 生成进度条组件
 * 显示整体进度百分比、完成/失败/总数统计，支持动画效果
 */
export function GenerationProgress({
  task,
  showStats = true,
  animated = true,
  className,
  height = 'md'
}: GenerationProgressProps) {
  const progress = useMemo(() => calculateTaskProgress(task), [task]);

  const config = task ? statusConfig[task.status] : null;
  const StatusIcon = config?.icon;

  if (!task) {
    return (
      <div className={cn('space-y-2', className)}>
        <div
          className={cn('bg-muted w-full rounded-full', heightClasses[height])}
        />
        {showStats && (
          <div className='text-muted-foreground flex items-center justify-between text-sm'>
            <span>暂无任务</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* 进度条 */}
      <div
        className={cn(
          'bg-muted w-full overflow-hidden rounded-full',
          heightClasses[height]
        )}
      >
        {animated ? (
          <motion.div
            className={cn('h-full rounded-full', config?.color)}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        ) : (
          <div
            className={cn('h-full rounded-full', config?.color)}
            style={{ width: `${progress}%` }}
          />
        )}
      </div>

      {/* 统计信息 */}
      {showStats && (
        <div className='flex items-center justify-between text-sm'>
          {/* 左侧：状态和进度 */}
          <div className='flex items-center gap-2'>
            {StatusIcon && (
              <StatusIcon
                className={cn(
                  'h-4 w-4',
                  task.status === 'running' && 'animate-spin',
                  task.status === 'completed' && 'text-green-500',
                  task.status === 'failed' && 'text-destructive',
                  task.status === 'paused' && 'text-yellow-500'
                )}
              />
            )}
            <span className='font-medium'>{config?.label}</span>
            <span className='text-muted-foreground'>{progress}%</span>
          </div>

          {/* 右侧：详细统计 */}
          <div className='text-muted-foreground flex items-center gap-3'>
            <span className='flex items-center gap-1'>
              <CheckCircle2 className='h-3.5 w-3.5 text-green-500' />
              {task.completed_items}
            </span>
            {task.failed_items > 0 && (
              <span className='flex items-center gap-1'>
                <XCircle className='text-destructive h-3.5 w-3.5' />
                {task.failed_items}
              </span>
            )}
            <span>/ {task.total_items}</span>
          </div>
        </div>
      )}

      {/* 错误信息 */}
      {task.error_message && (
        <div className='bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm'>
          {task.error_message}
        </div>
      )}
    </div>
  );
}

/**
 * 简化版进度条，只显示进度条本身
 */
export function SimpleProgress({
  progress,
  status = 'running',
  animated = true,
  className,
  height = 'md'
}: {
  progress: number;
  status?: keyof typeof statusConfig;
  animated?: boolean;
  className?: string;
  height?: 'sm' | 'md' | 'lg';
}) {
  const config = statusConfig[status];

  return (
    <div
      className={cn(
        'bg-muted w-full overflow-hidden rounded-full',
        heightClasses[height],
        className
      )}
    >
      {animated ? (
        <motion.div
          className={cn('h-full rounded-full', config.color)}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      ) : (
        <div
          className={cn('h-full rounded-full', config.color)}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      )}
    </div>
  );
}
