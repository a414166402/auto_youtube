'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { getBatchTaskStatus, type TaskInfo } from '@/lib/api/youtube';

export interface UseTaskPollingOptions {
  /** 轮询间隔(毫秒) */
  pollInterval?: number;
  /** 最大轮询次数 */
  maxAttempts?: number;
  /** 单个任务更新回调 */
  onTaskUpdate?: (task: TaskInfo) => void;
  /** 所有任务完成回调 */
  onAllComplete?: (result: {
    completed: TaskInfo[];
    failed: TaskInfo[];
  }) => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
}

export interface UseTaskPollingReturn {
  /** 是否正在轮询 */
  isPolling: boolean;
  /** 任务状态映射 */
  tasks: Map<string, TaskInfo>;
  /** 开始轮询 */
  startPolling: (taskIds: string[]) => void;
  /** 停止轮询 */
  stopPolling: () => void;
  /** 暂停轮询 */
  pausePolling: () => void;
  /** 恢复轮询 */
  resumePolling: () => void;
  /** 是否暂停 */
  isPaused: boolean;
}

/**
 * 异步任务批量轮询 Hook
 * 基于批量状态查询接口实现高效轮询
 */
export function useTaskPolling(
  options: UseTaskPollingOptions = {}
): UseTaskPollingReturn {
  const {
    pollInterval = 3000,
    maxAttempts = 100,
    onTaskUpdate,
    onAllComplete,
    onError
  } = options;

  const [isPolling, setIsPolling] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [tasks, setTasks] = useState<Map<string, TaskInfo>>(new Map());

  const pendingTaskIdsRef = useRef<string[]>([]);
  const attemptCountRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const callbacksRef = useRef({ onTaskUpdate, onAllComplete, onError });

  // 更新回调引用
  callbacksRef.current = { onTaskUpdate, onAllComplete, onError };

  // 清理定时器
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 轮询逻辑
  const poll = useCallback(async () => {
    if (isPaused || pendingTaskIdsRef.current.length === 0) {
      return;
    }

    try {
      // 批量查询任务状态
      const result = await getBatchTaskStatus(pendingTaskIdsRef.current);

      const stillPending: string[] = [];
      const completedTasks: TaskInfo[] = [];
      const failedTasks: TaskInfo[] = [];

      // 更新任务状态
      setTasks((prev) => {
        const newTasks = new Map(prev);

        for (const task of result.tasks) {
          newTasks.set(task.task_id, task);

          // 触发单个任务更新回调
          callbacksRef.current.onTaskUpdate?.(task);

          // 分类任务
          if (task.status === 'completed') {
            completedTasks.push(task);
          } else if (task.status === 'failed') {
            failedTasks.push(task);
          } else if (task.status === 'pending' || task.status === 'running') {
            stillPending.push(task.task_id);
          }
        }

        return newTasks;
      });

      // 更新待轮询任务列表
      pendingTaskIdsRef.current = stillPending;

      // 检查是否所有任务都已完成
      if (stillPending.length === 0) {
        setIsPolling(false);
        callbacksRef.current.onAllComplete?.({
          completed: completedTasks,
          failed: failedTasks
        });
        return;
      }

      // 检查超时
      attemptCountRef.current++;
      if (attemptCountRef.current >= maxAttempts) {
        setIsPolling(false);
        callbacksRef.current.onError?.(
          new Error(`轮询超时，还有 ${stillPending.length} 个任务未完成`)
        );
        return;
      }

      // 继续轮询
      timerRef.current = setTimeout(poll, pollInterval);
    } catch (error) {
      callbacksRef.current.onError?.(
        error instanceof Error ? error : new Error('轮询失败')
      );
      // 出错后继续轮询
      timerRef.current = setTimeout(poll, pollInterval);
    }
  }, [isPaused, pollInterval, maxAttempts]);

  // 开始轮询
  const startPolling = useCallback(
    (taskIds: string[]) => {
      if (taskIds.length === 0) return;

      clearTimer();
      pendingTaskIdsRef.current = [...taskIds];
      attemptCountRef.current = 0;
      setIsPolling(true);
      setIsPaused(false);

      // 初始化任务状态
      setTasks((prev) => {
        const newTasks = new Map(prev);
        for (const taskId of taskIds) {
          if (!newTasks.has(taskId)) {
            newTasks.set(taskId, {
              task_id: taskId,
              module_name: '',
              task_type: '',
              status: 'pending',
              progress: 0,
              created_at: new Date().toISOString(),
              started_at: null,
              completed_at: null,
              error_message: null,
              has_result: false
            });
          }
        }
        return newTasks;
      });

      // 立即开始第一次轮询
      poll();
    },
    [clearTimer, poll]
  );

  // 停止轮询
  const stopPolling = useCallback(() => {
    clearTimer();
    setIsPolling(false);
    setIsPaused(false);
    pendingTaskIdsRef.current = [];
    attemptCountRef.current = 0;
  }, [clearTimer]);

  // 暂停轮询
  const pausePolling = useCallback(() => {
    clearTimer();
    setIsPaused(true);
  }, [clearTimer]);

  // 恢复轮询
  const resumePolling = useCallback(() => {
    if (!isPolling) return;
    setIsPaused(false);
    poll();
  }, [isPolling, poll]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    isPolling,
    tasks,
    startPolling,
    stopPolling,
    pausePolling,
    resumePolling,
    isPaused
  };
}

/**
 * 计算任务进度百分比
 */
export function calculateTaskProgress(tasks: Map<string, TaskInfo>): number {
  if (tasks.size === 0) return 0;

  const completed = Array.from(tasks.values()).filter(
    (t) => t.status === 'completed'
  ).length;

  return Math.round((completed / tasks.size) * 100);
}

/**
 * 获取任务统计信息
 */
export function getTaskStats(tasks: Map<string, TaskInfo>): {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
} {
  const taskArray = Array.from(tasks.values());

  return {
    total: taskArray.length,
    pending: taskArray.filter((t) => t.status === 'pending').length,
    running: taskArray.filter((t) => t.status === 'running').length,
    completed: taskArray.filter((t) => t.status === 'completed').length,
    failed: taskArray.filter((t) => t.status === 'failed').length
  };
}
