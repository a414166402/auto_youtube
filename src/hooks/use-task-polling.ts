'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { GenerationTask, TaskStatus } from '@/types/youtube';
import { getTask } from '@/lib/api/youtube';

export interface UseTaskPollingOptions {
  /** 轮询间隔（毫秒），默认 2000ms */
  interval?: number;
  /** 是否自动开始轮询，默认 true */
  autoStart?: boolean;
  /** 任务完成回调 */
  onComplete?: (task: GenerationTask) => void;
  /** 任务失败回调 */
  onFailed?: (task: GenerationTask) => void;
  /** 任务状态变化回调 */
  onStatusChange?: (
    task: GenerationTask,
    prevStatus: TaskStatus | null
  ) => void;
  /** 轮询错误回调 */
  onError?: (error: Error) => void;
}

export interface UseTaskPollingReturn {
  /** 当前任务数据 */
  task: GenerationTask | null;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 是否正在轮询 */
  isPolling: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 开始轮询 */
  startPolling: () => void;
  /** 暂停轮询 */
  pausePolling: () => void;
  /** 恢复轮询 */
  resumePolling: () => void;
  /** 停止轮询 */
  stopPolling: () => void;
  /** 手动刷新任务状态 */
  refresh: () => Promise<void>;
}

/**
 * 任务状态轮询 Hook
 * 用于定时获取任务状态并处理完成/失败回调
 */
export function useTaskPolling(
  taskId: string | null,
  options: UseTaskPollingOptions = {}
): UseTaskPollingReturn {
  const {
    interval = 2000,
    autoStart = true,
    onComplete,
    onFailed,
    onStatusChange,
    onError
  } = options;

  const [task, setTask] = useState<GenerationTask | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 使用 ref 存储回调以避免重新创建 effect
  const callbacksRef = useRef({
    onComplete,
    onFailed,
    onStatusChange,
    onError
  });
  callbacksRef.current = { onComplete, onFailed, onStatusChange, onError };

  // 存储上一次的状态用于比较
  const prevStatusRef = useRef<TaskStatus | null>(null);

  // 轮询控制
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef(false);

  // 获取任务状态
  const fetchTask = useCallback(async () => {
    if (!taskId) return;

    setIsLoading(true);
    setError(null);

    try {
      const taskData = await getTask(taskId);
      const prevStatus = prevStatusRef.current;

      setTask(taskData);

      // 状态变化回调
      if (taskData.status !== prevStatus) {
        callbacksRef.current.onStatusChange?.(taskData, prevStatus);
        prevStatusRef.current = taskData.status;
      }

      // 完成回调
      if (taskData.status === 'completed') {
        callbacksRef.current.onComplete?.(taskData);
        // 任务完成后停止轮询
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setIsPolling(false);
        }
      }

      // 失败回调
      if (taskData.status === 'failed') {
        callbacksRef.current.onFailed?.(taskData);
        // 任务失败后停止轮询
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setIsPolling(false);
        }
      }

      // 取消状态也停止轮询
      if (taskData.status === 'cancelled') {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setIsPolling(false);
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('获取任务状态失败');
      setError(error);
      callbacksRef.current.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  // 开始轮询
  const startPolling = useCallback(() => {
    if (!taskId || pollingRef.current) return;

    isPausedRef.current = false;
    setIsPolling(true);

    // 立即获取一次
    fetchTask();

    // 设置定时轮询
    pollingRef.current = setInterval(() => {
      if (!isPausedRef.current) {
        fetchTask();
      }
    }, interval);
  }, [taskId, interval, fetchTask]);

  // 暂停轮询
  const pausePolling = useCallback(() => {
    isPausedRef.current = true;
  }, []);

  // 恢复轮询
  const resumePolling = useCallback(() => {
    isPausedRef.current = false;
    // 恢复时立即获取一次
    fetchTask();
  }, [fetchTask]);

  // 停止轮询
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
    isPausedRef.current = false;
  }, []);

  // 手动刷新
  const refresh = useCallback(async () => {
    await fetchTask();
  }, [fetchTask]);

  // 自动开始轮询
  useEffect(() => {
    if (taskId && autoStart) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [taskId, autoStart, startPolling, stopPolling]);

  // taskId 变化时重置状态
  useEffect(() => {
    if (!taskId) {
      setTask(null);
      prevStatusRef.current = null;
      stopPolling();
    }
  }, [taskId, stopPolling]);

  return {
    task,
    isLoading,
    isPolling,
    error,
    startPolling,
    pausePolling,
    resumePolling,
    stopPolling,
    refresh
  };
}

/**
 * 计算任务进度百分比
 * 确保 progress = (completed_items / total_items) * 100
 */
export function calculateTaskProgress(task: GenerationTask | null): number {
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
