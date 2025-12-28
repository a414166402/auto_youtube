'use client';

import { useState, useCallback } from 'react';
import { AlertTriangle, Trash2, Info } from 'lucide-react';
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
import { Button } from '@/components/ui/button';

type ConfirmVariant = 'default' | 'destructive' | 'warning';

interface ConfirmDialogProps {
  /** 是否打开对话框 */
  open: boolean;
  /** 关闭对话框回调 */
  onOpenChange: (open: boolean) => void;
  /** 确认回调 */
  onConfirm: () => void | Promise<void>;
  /** 对话框标题 */
  title?: string;
  /** 对话框描述 */
  description?: string;
  /** 确认按钮文本 */
  confirmText?: string;
  /** 取消按钮文本 */
  cancelText?: string;
  /** 对话框变体 */
  variant?: ConfirmVariant;
  /** 是否正在加载 */
  loading?: boolean;
}

const variantConfig: Record<
  ConfirmVariant,
  {
    icon: React.ReactNode;
    iconBg: string;
    buttonVariant: 'default' | 'destructive' | 'outline';
  }
> = {
  default: {
    icon: <Info className='text-primary h-6 w-6' />,
    iconBg: 'bg-primary/10',
    buttonVariant: 'default'
  },
  destructive: {
    icon: <Trash2 className='text-destructive h-6 w-6' />,
    iconBg: 'bg-destructive/10',
    buttonVariant: 'destructive'
  },
  warning: {
    icon: <AlertTriangle className='h-6 w-6 text-amber-500' />,
    iconBg: 'bg-amber-500/10',
    buttonVariant: 'default'
  }
};

/**
 * 确认对话框组件 - 用于删除确认等需要用户确认的操作
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = '确认操作',
  description = '您确定要执行此操作吗？此操作无法撤销。',
  confirmText = '确认',
  cancelText = '取消',
  variant = 'default',
  loading = false
}: ConfirmDialogProps) {
  const config = variantConfig[variant];

  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className='flex items-start gap-4'>
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${config.iconBg}`}
            >
              {config.icon}
            </div>
            <div className='space-y-2'>
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription>{description}</AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={
              config.buttonVariant === 'destructive'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : ''
            }
          >
            {loading ? '处理中...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface DeleteConfirmDialogProps {
  /** 是否打开对话框 */
  open: boolean;
  /** 关闭对话框回调 */
  onOpenChange: (open: boolean) => void;
  /** 确认删除回调 */
  onConfirm: () => void | Promise<void>;
  /** 要删除的项目名称 */
  itemName?: string;
  /** 是否正在加载 */
  loading?: boolean;
}

/**
 * 删除确认对话框 - 专门用于删除操作的确认
 */
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  itemName = '此项目',
  loading = false
}: DeleteConfirmDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title='确认删除'
      description={`您确定要删除${itemName}吗？此操作无法撤销，所有相关数据将被永久删除。`}
      confirmText='删除'
      cancelText='取消'
      variant='destructive'
      loading={loading}
    />
  );
}

interface UseConfirmDialogOptions {
  /** 确认回调 */
  onConfirm: () => void | Promise<void>;
}

/**
 * 确认对话框 Hook - 简化对话框状态管理
 */
export function useConfirmDialog({ onConfirm }: UseConfirmDialogOptions) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const openDialog = useCallback(() => setOpen(true), []);
  const closeDialog = useCallback(() => setOpen(false), []);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, [onConfirm]);

  return {
    open,
    loading,
    openDialog,
    closeDialog,
    setOpen,
    handleConfirm
  };
}
