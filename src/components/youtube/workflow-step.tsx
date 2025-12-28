'use client';

import { Check, Loader2, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { WorkflowStepStatus } from '@/types/youtube';

export interface WorkflowStepProps {
  stepNumber: number;
  title: string;
  description?: string;
  status: WorkflowStepStatus;
  progress?: number;
  details?: React.ReactNode;
  actionLabel?: string;
  actionUrl?: string;
  onAction?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const statusConfig: Record<
  WorkflowStepStatus,
  {
    icon: React.ReactNode;
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
    cardClass: string;
  }
> = {
  completed: {
    icon: <Check className='h-4 w-4' />,
    label: '已完成',
    variant: 'success',
    cardClass:
      'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'
  },
  in_progress: {
    icon: <Loader2 className='h-4 w-4 animate-spin' />,
    label: '进行中',
    variant: 'default',
    cardClass:
      'border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20'
  },
  pending: {
    icon: <Clock className='h-4 w-4' />,
    label: '待开始',
    variant: 'secondary',
    cardClass: ''
  },
  failed: {
    icon: <AlertCircle className='h-4 w-4' />,
    label: '失败',
    variant: 'destructive',
    cardClass:
      'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'
  }
};

export function WorkflowStep({
  stepNumber,
  title,
  description,
  status,
  progress,
  details,
  actionLabel,
  actionUrl,
  onAction,
  isLoading = false,
  disabled = false
}: WorkflowStepProps) {
  const config = statusConfig[status];

  const handleAction = () => {
    if (actionUrl) {
      window.location.href = actionUrl;
    } else if (onAction) {
      onAction();
    }
  };

  return (
    <Card className={cn('transition-all', config.cardClass)}>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='bg-muted flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium'>
              {stepNumber}
            </div>
            <CardTitle className='text-base'>{title}</CardTitle>
          </div>
          <Badge variant={config.variant} className='gap-1'>
            {config.icon}
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        {description && (
          <p className='text-muted-foreground text-sm'>{description}</p>
        )}

        {details && <div className='text-sm'>{details}</div>}

        {status === 'in_progress' && progress !== undefined && (
          <div className='space-y-1'>
            <div className='text-muted-foreground flex justify-between text-xs'>
              <span>进度</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {(actionLabel || actionUrl) && (
          <Button
            variant={status === 'completed' ? 'outline' : 'default'}
            size='sm'
            onClick={handleAction}
            disabled={disabled || isLoading}
            className='gap-1'
          >
            {isLoading ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <>
                {actionLabel || '操作'}
                <ChevronRight className='h-4 w-4' />
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
