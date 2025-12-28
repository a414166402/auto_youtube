'use client';

import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorFallbackProps {
  /** 错误标题 */
  title?: string;
  /** 错误描述信息 */
  message?: string;
  /** 详细错误信息（可选，用于调试） */
  error?: Error | string | null;
  /** 重试回调函数 */
  onRetry?: () => void;
  /** 返回首页回调函数 */
  onGoHome?: () => void;
  /** 是否显示返回首页按钮 */
  showHomeButton?: boolean;
  /** 是否正在重试中 */
  isRetrying?: boolean;
}

/**
 * 错误回退组件 - 用于显示错误信息并提供重试选项
 */
export function ErrorFallback({
  title = '出错了',
  message = '加载数据时发生错误，请稍后重试。',
  error,
  onRetry,
  onGoHome,
  showHomeButton = false,
  isRetrying = false
}: ErrorFallbackProps) {
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <Card className='mx-auto w-full max-w-md'>
      <CardHeader className='text-center'>
        <div className='bg-destructive/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full'>
          <AlertCircle className='text-destructive h-6 w-6' />
        </div>
        <CardTitle className='text-xl'>{title}</CardTitle>
      </CardHeader>
      <CardContent className='text-center'>
        <p className='text-muted-foreground'>{message}</p>
        {errorMessage && (
          <Alert variant='destructive' className='mt-4 text-left'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>错误详情</AlertTitle>
            <AlertDescription className='text-sm break-all'>
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className='flex justify-center gap-3'>
        {onRetry && (
          <Button onClick={onRetry} disabled={isRetrying}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`}
            />
            {isRetrying ? '重试中...' : '重试'}
          </Button>
        )}
        {showHomeButton && onGoHome && (
          <Button variant='outline' onClick={onGoHome}>
            <Home className='mr-2 h-4 w-4' />
            返回首页
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

interface InlineErrorProps {
  /** 错误信息 */
  message?: string;
  /** 重试回调函数 */
  onRetry?: () => void;
  /** 是否正在重试中 */
  isRetrying?: boolean;
}

/**
 * 内联错误组件 - 用于在列表项或卡片中显示错误
 */
export function InlineError({
  message = '加载失败',
  onRetry,
  isRetrying = false
}: InlineErrorProps) {
  return (
    <div className='bg-destructive/10 flex items-center justify-between rounded-lg p-4'>
      <div className='text-destructive flex items-center gap-2'>
        <AlertCircle className='h-4 w-4' />
        <span className='text-sm'>{message}</span>
      </div>
      {onRetry && (
        <Button
          variant='ghost'
          size='sm'
          onClick={onRetry}
          disabled={isRetrying}
          className='text-destructive hover:text-destructive'
        >
          <RefreshCw
            className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`}
          />
        </Button>
      )}
    </div>
  );
}

interface TaskErrorProps {
  /** 任务名称 */
  taskName?: string;
  /** 错误信息 */
  message?: string;
  /** 重试回调函数 */
  onRetry?: () => void;
  /** 是否正在重试中 */
  isRetrying?: boolean;
}

/**
 * 任务错误组件 - 用于显示生成任务失败的错误
 */
export function TaskError({
  taskName = '任务',
  message = '执行失败',
  onRetry,
  isRetrying = false
}: TaskErrorProps) {
  return (
    <Alert variant='destructive'>
      <AlertCircle className='h-4 w-4' />
      <AlertTitle>{taskName}失败</AlertTitle>
      <AlertDescription className='flex items-center justify-between'>
        <span>{message}</span>
        {onRetry && (
          <Button
            variant='outline'
            size='sm'
            onClick={onRetry}
            disabled={isRetrying}
            className='ml-4'
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`}
            />
            {isRetrying ? '重试中...' : '重试'}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

interface EmptyStateProps {
  /** 标题 */
  title?: string;
  /** 描述信息 */
  description?: string;
  /** 图标 */
  icon?: React.ReactNode;
  /** 操作按钮 */
  action?: React.ReactNode;
}

/**
 * 空状态组件 - 用于显示无数据时的提示
 */
export function EmptyState({
  title = '暂无数据',
  description = '当前没有可显示的内容',
  icon,
  action
}: EmptyStateProps) {
  return (
    <div className='flex flex-col items-center justify-center py-12 text-center'>
      {icon && (
        <div className='bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
          {icon}
        </div>
      )}
      <h3 className='text-lg font-medium'>{title}</h3>
      <p className='text-muted-foreground mt-1 max-w-sm text-sm'>
        {description}
      </p>
      {action && <div className='mt-4'>{action}</div>}
    </div>
  );
}
