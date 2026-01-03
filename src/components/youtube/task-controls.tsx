'use client';

import { cn } from '@/lib/utils';
import type { TaskStatus } from '@/types/youtube';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Clock, Pause } from 'lucide-react';

export interface TaskControlsProps {
  /** 任务状态 */
  status: TaskStatus | null;
  /** 自定义类名 */
  className?: string;
}

/**
 * 任务状态显示组件
 * 由于后端不支持任务控制API，此组件仅显示任务状态
 */
export function TaskControls({ status, className }: TaskControlsProps) {
  if (!status) {
    return null;
  }

  const statusConfig = getTaskStatusConfig(status);

  return (
    <Badge variant={statusConfig.variant} className={cn('gap-1', className)}>
      {statusConfig.icon}
      {statusConfig.label}
    </Badge>
  );
}

/**
 * 紧凑版任务状态显示组件
 */
export function CompactTaskControls({ status, className }: TaskControlsProps) {
  if (!status) {
    return null;
  }

  const statusConfig = getTaskStatusConfig(status);

  return (
    <span className={cn('flex items-center gap-1 text-sm', className)}>
      {statusConfig.icon}
    </span>
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

/**
 * 获取任务状态配置
 */
function getTaskStatusConfig(status: TaskStatus): {
  label: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  icon: React.ReactNode;
} {
  switch (status) {
    case 'pending':
      return {
        label: '等待中',
        variant: 'outline',
        icon: <Clock className='h-3 w-3' />
      };
    case 'running':
      return {
        label: '进行中',
        variant: 'secondary',
        icon: <Loader2 className='h-3 w-3 animate-spin' />
      };
    case 'completed':
      return {
        label: '已完成',
        variant: 'default',
        icon: <CheckCircle className='h-3 w-3' />
      };
    case 'failed':
      return {
        label: '失败',
        variant: 'destructive',
        icon: <XCircle className='h-3 w-3' />
      };
    case 'paused':
      return {
        label: '已暂停',
        variant: 'outline',
        icon: <Pause className='h-3 w-3' />
      };
    case 'cancelled':
      return {
        label: '已取消',
        variant: 'outline',
        icon: <XCircle className='h-3 w-3' />
      };
    default:
      return {
        label: status,
        variant: 'outline',
        icon: null
      };
  }
}

/**
 * 检查任务是否处于终止状态
 */
export function isTaskTerminal(status: TaskStatus): boolean {
  return (
    status === 'completed' || status === 'failed' || status === 'cancelled'
  );
}
