'use client';

import { useState, useCallback } from 'react';
import { isConflictError, ConflictError } from '@/lib/api/youtube';

/**
 * 冲突处理 Hook
 * 用于统一处理 HTTP 409 冲突错误
 */
export function useConflictHandler(onRefresh: () => void | Promise<void>) {
  const [conflictOpen, setConflictOpen] = useState(false);
  const [conflictDetail, setConflictDetail] = useState<string | undefined>();

  /**
   * 处理可能抛出冲突错误的操作
   * 如果是 409 错误，显示冲突对话框
   * 如果是其他错误，重新抛出
   */
  const handleConflict = useCallback((error: unknown): boolean => {
    if (isConflictError(error)) {
      setConflictDetail((error as ConflictError).detail);
      setConflictOpen(true);
      return true;
    }
    return false;
  }, []);

  /**
   * 包装异步操作，自动处理冲突错误
   */
  const withConflictHandling = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T | null> => {
      try {
        return await operation();
      } catch (error) {
        if (handleConflict(error)) {
          return null;
        }
        throw error;
      }
    },
    [handleConflict]
  );

  /**
   * 刷新页面数据
   */
  const handleRefresh = useCallback(async () => {
    setConflictOpen(false);
    setConflictDetail(undefined);
    await onRefresh();
  }, [onRefresh]);

  /**
   * 取消冲突对话框
   */
  const handleCancel = useCallback(() => {
    setConflictOpen(false);
    setConflictDetail(undefined);
  }, []);

  return {
    conflictOpen,
    conflictDetail,
    handleConflict,
    withConflictHandling,
    handleRefresh,
    handleCancel
  };
}
