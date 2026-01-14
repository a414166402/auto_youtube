'use client';

import { RefreshCw, AlertTriangle } from 'lucide-react';
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

interface ConflictDialogProps {
  /** 是否打开对话框 */
  open: boolean;
  /** 刷新页面回调 */
  onRefresh: () => void;
  /** 取消回调 */
  onCancel: () => void;
  /** 详细错误信息（可选） */
  detail?: string;
}

/**
 * 并发冲突提示对话框
 * 当后端返回 HTTP 409 时显示，提示用户数据已被其他人修改
 */
export function ConflictDialog({
  open,
  onRefresh,
  onCancel,
  detail
}: ConflictDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className='flex items-start gap-4'>
            <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/10'>
              <AlertTriangle className='h-6 w-6 text-amber-500' />
            </div>
            <div className='space-y-2'>
              <AlertDialogTitle>数据已被修改</AlertDialogTitle>
              <AlertDialogDescription>
                {detail ||
                  '数据已被其他用户修改，请刷新页面获取最新数据后重试。'}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>取消</AlertDialogCancel>
          <AlertDialogAction onClick={onRefresh}>
            <RefreshCw className='mr-2 h-4 w-4' />
            刷新页面
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
