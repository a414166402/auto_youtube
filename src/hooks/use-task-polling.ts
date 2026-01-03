'use client';

import { useState, useCallback, useRef } from 'react';
import type { TaskStatus } from '@/types/youtube';

/**
 * 简化的任务状态接口
 * 由于后端不支持任务轮询API，此接口用于前端本地状态管理
 */
export interface LocalTaskState {
  id: string;
  status: TaskStatus;
  progress: number;
  total_items: number;
  completed_items: number;
  failed_items: number;
  error_message?: string;
}

export interface UseLocalTaskStateOptions {
  /** 任务完成回调 */
  onComplete?: (task: LocalTaskState) => void;
  /** 任务失败回调 */
  onFailed?: (task: LocalTaskState) => void;
  /** 任务状态变化回调 */
  onStatusChange?: (
    task: LocalTaskState,
    prevStatus: TaskStatus | null
  ) => void;
}

export interface UseLocalTaskStateReturn {
  /** 当前任务数据 */
  task: LocalTaskState | null;
  /** 是否正在执行 */
  isRunning: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 开始任务 */
  startTask: (taskId: string, totalItems: number) => void;
  /** 更新进度 */
  updateProgress: (completedItems: number, failedItems?: number) => void;
  /** 完成任务 */
  completeTask: () => void;
  /** 任务失败 */
  failTask: (errorMessage: string) => void;
  /** 重置任务 */
  resetTask: () => void;
}

/**
 * 本地任务状态管理 Hook
 * 用于管理前端生成任务的状态（图片生成、视频生成等）
 */
export function useLocalTaskState(
  options: UseLocalTaskStateOptions = {}
): UseLocalTaskStateReturn {
  const { onComplete, onFailed, onStatusChange } = options;

  const [task, setTask] = useState<LocalTaskState | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const prevStatusRef = useRef<TaskStatus | null>(null);
  const callbacksRef = useRef({ onComplete, onFailed, onStatusChange });
  callbacksRef.current = { onComplete, onFailed, onStatusChange };

  const isRunning = task?.status === 'running' || task?.status === 'pending';

  // 开始任务
  const startTask = useCallback((taskId: string, totalItems: number) => {
    const newTask: LocalTaskState = {
      id: taskId,
      status: 'running',
      progress: 0,
      total_items: totalItems,
      completed_items: 0,
      failed_items: 0
    };

    setTask(newTask);
    setError(null);

    if (prevStatusRef.current !== 'running') {
      callbacksRef.current.onStatusChange?.(newTask, prevStatusRef.current);
      prevStatusRef.current = 'running';
    }
  }, []);

  // 更新进度
  const updateProgress = useCallback(
    (completedItems: number, failedItems: number = 0) => {
      setTask((prev) => {
        if (!prev) return prev;

        const progress =
          prev.total_items > 0
            ? Math.round((completedItems / prev.total_items) * 100)
            : 0;

        return {
          ...prev,
          completed_items: completedItems,
          failed_items: failedItems,
          progress
        };
      });
    },
    []
  );

  // 完成任务
  const completeTask = useCallback(() => {
    setTask((prev) => {
      if (!prev) return prev;

      const completedTask: LocalTaskState = {
        ...prev,
        status: 'completed',
        progress: 100,
        completed_items: prev.total_items
      };

      callbacksRef.current.onComplete?.(completedTask);
      callbacksRef.current.onStatusChange?.(
        completedTask,
        prevStatusRef.current
      );
      prevStatusRef.current = 'completed';

      return completedTask;
    });
  }, []);

  // 任务失败
  const failTask = useCallback((errorMessage: string) => {
    setTask((prev) => {
      if (!prev) return prev;

      const failedTask: LocalTaskState = {
        ...prev,
        status: 'failed',
        error_message: errorMessage
      };

      setError(new Error(errorMessage));
      callbacksRef.current.onFailed?.(failedTask);
      callbacksRef.current.onStatusChange?.(failedTask, prevStatusRef.current);
      prevStatusRef.current = 'failed';

      return failedTask;
    });
  }, []);

  // 重置任务
  const resetTask = useCallback(() => {
    setTask(null);
    setError(null);
    prevStatusRef.current = null;
  }, []);

  return {
    task,
    isRunning,
    error,
    startTask,
    updateProgress,
    completeTask,
    failTask,
    resetTask
  };
}

/**
 * 计算任务进度百分比
 */
export function calculateTaskProgress(task: LocalTaskState | null): number {
  if (!task || task.total_items === 0) return 0;
  return Math.round((task.completed_items / task.total_items) * 100);
}

/**
 * 检查任务是否处于终止状态
 */
export function isTaskTerminal(status: TaskStatus): boolean {
  return (
    status === 'completed' || status === 'failed' || status === 'cancelled'
  );
}

/**
 * 检查任务是否可以暂停
 */
export function canPauseTask(status: TaskStatus): boolean {
  return status === 'running' || status === 'pending';
}

/**
 * 检查任务是否可以恢复
 */
export function canResumeTask(status: TaskStatus): boolean {
  return status === 'paused';
}

/**
 * 检查任务是否可以取消
 */
export function canCancelTask(status: TaskStatus): boolean {
  return status === 'running' || status === 'pending' || status === 'paused';
}

// 保留旧的导出名称以兼容现有代码
export const useTaskPolling = useLocalTaskState;
