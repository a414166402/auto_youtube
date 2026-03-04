'use client';

import { useState } from 'react';
import { Clock, Loader2, History } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import type { PromptHistorySummary } from '@/types/youtube';

export interface PromptHistoryDialogProps {
  projectId: string;
  currentVersion: string;
  versions: PromptHistorySummary[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadFullHistory?: () => Promise<void>;
}

// 格式化时间戳
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function VersionItem({
  version,
  isCurrent
}: {
  version: PromptHistorySummary;
  isCurrent: boolean;
}) {
  return (
    <div className='space-y-2 py-3'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-medium'>{version.version}</span>
          {isCurrent && (
            <Badge variant='default' className='text-xs'>
              当前版本
            </Badge>
          )}
          {version.parent_version && (
            <Badge variant='outline' className='text-xs'>
              基于 {version.parent_version}
            </Badge>
          )}
        </div>
        <div className='text-muted-foreground flex items-center gap-1 text-xs'>
          <Clock className='h-3 w-3' />
          {formatTimestamp(version.created_at)}
        </div>
      </div>

      <div className='space-y-1'>
        <p className='text-muted-foreground text-xs'>生成指令:</p>
        <p className='bg-muted/50 rounded-md p-2 text-sm'>
          {version.instruction || '(无)'}
        </p>
      </div>

      <p className='text-muted-foreground text-xs'>
        共 {version.storyboard_count} 个分镜
      </p>
    </div>
  );
}

export function PromptHistoryDialog({
  currentVersion,
  versions,
  open,
  onOpenChange,
  onLoadFullHistory
}: PromptHistoryDialogProps) {
  const [isLoadingFull, setIsLoadingFull] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);

  const handleLoadFullHistory = async () => {
    if (!onLoadFullHistory) return;

    setIsLoadingFull(true);
    try {
      await onLoadFullHistory();
      setShowFullHistory(true);
    } finally {
      setIsLoadingFull(false);
    }
  };

  // 判断是否只显示当前版本历史
  const isCurrentVersionOnly =
    versions.length > 0 &&
    versions.every((v) => v.version === currentVersion || v.parent_version);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[80vh] sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <History className='h-5 w-5' />
            提示词版本历史
          </DialogTitle>
          <DialogDescription>
            查看所有提示词生成版本的历史记录
          </DialogDescription>
        </DialogHeader>

        {versions.length === 0 ? (
          <div className='text-muted-foreground flex flex-col items-center justify-center py-8'>
            <Clock className='mb-2 h-8 w-8' />
            <p>暂无版本历史</p>
          </div>
        ) : (
          <>
            {/* 查看全部历史按钮 */}
            {isCurrentVersionOnly && !showFullHistory && onLoadFullHistory && (
              <div className='flex justify-center'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleLoadFullHistory}
                  disabled={isLoadingFull}
                  className='gap-2'
                >
                  {isLoadingFull ? (
                    <>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      加载中...
                    </>
                  ) : (
                    <>
                      <History className='h-4 w-4' />
                      查看全部历史版本
                    </>
                  )}
                </Button>
              </div>
            )}

            <ScrollArea className='h-[400px] pr-4'>
              <div className='space-y-0'>
                {versions.map((version, index) => (
                  <div key={version.version}>
                    <VersionItem
                      version={version}
                      isCurrent={version.version === currentVersion}
                    />
                    {index < versions.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
