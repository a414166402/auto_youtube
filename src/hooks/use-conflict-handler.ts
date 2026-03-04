'use client';

import { useState, useCallback } from 'react';
import { isConflictError } from '@/lib/api/youtube';

/**
 * 统一的409冲突处理Hook
 * 提供冲突检测、对话框状态管理和数据重新获取功能
 */
export function useConflictHandler(onRefetch: () => void | Promise<void>) {
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictMessage, setConflictMessage] = useState<string>();

  /**
   * 处理API错误，检测409冲突
   * @returns true 如果是冲突错误，false 否则
   */
  const handleError = useCallback((error: unknown): boolean => {
    if (isConflictError(error)) {
      setConflictMessage(error.detail);
      setShowConflictDialog(true);
      return true;
    }
    return false;
  }, []);

  /**
   * 包装异步操作，自动处理409冲突
   */
  const withConflictHandling = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T | null> => {
      try {
        return await operation();
      } catch (error) {
        if (handleError(error)) {
          return null;
        }
        throw error;
      }
    },
    [handleError]
  );

  /**
   * 重新获取数据并关闭对话框
   */
  const handleRefetch = useCallback(async () => {
    setShowConflictDialog(false);
    await onRefetch();
  }, [onRefetch]);

  return {
    showConflictDialog,
    conflictMessage,
    setShowConflictDialog,
    handleError,
    withConflictHandling,
    handleRefetch
  };
}
