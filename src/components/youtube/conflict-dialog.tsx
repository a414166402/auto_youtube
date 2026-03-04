'use client';

import { AlertTriangle } from 'lucide-react';
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

export interface ConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefetch: () => void;
  message?: string;
}

/**
 * 409冲突错误提示对话框
 * 当检测到并发修改冲突时显示
 */
export function ConflictDialog({
  open,
  onOpenChange,
  onRefetch,
  message
}: ConflictDialogProps) {
  const handleRefetch = () => {
    onOpenChange(false);
    onRefetch();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-yellow-500' />
            <AlertDialogTitle>数据已被修改</AlertDialogTitle>
          </div>
          <AlertDialogDescription className='space-y-2'>
            <p>
              {message ||
                '您正在编辑的数据已被其他用户或会话修改。为避免覆盖最新数据，请重新获取后再进行操作。'}
            </p>
            <p className='text-muted-foreground text-sm'>
              点击&quot;重新获取数据&quot;将加载最新版本，您当前的修改将被丢弃。
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleRefetch}>
            重新获取数据
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
