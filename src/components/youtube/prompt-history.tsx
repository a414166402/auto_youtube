'use client';

import { Clock, Pencil, Sparkles } from 'lucide-react';
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
import type { Prompt, PromptEditHistory } from '@/types/youtube';

export interface PromptHistoryDialogProps {
  prompt: Prompt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

function HistoryItem({
  history,
  index
}: {
  history: PromptEditHistory;
  index: number;
}) {
  return (
    <div className='space-y-3 py-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-medium'>版本 {index + 1}</span>
          <Badge
            variant={history.edit_type === 'manual' ? 'secondary' : 'default'}
            className='gap-1'
          >
            {history.edit_type === 'manual' ? (
              <>
                <Pencil className='h-3 w-3' />
                手动编辑
              </>
            ) : (
              <>
                <Sparkles className='h-3 w-3' />
                AI重新生成
              </>
            )}
          </Badge>
        </div>
        <div className='text-muted-foreground flex items-center gap-1 text-xs'>
          <Clock className='h-3 w-3' />
          {formatTimestamp(history.timestamp)}
        </div>
      </div>

      <div className='space-y-2'>
        <div className='space-y-1'>
          <p className='text-muted-foreground text-xs font-medium'>
            文生图提示词
          </p>
          <p className='bg-muted/50 rounded-md p-2 text-sm whitespace-pre-wrap'>
            {history.text_to_image || '(空)'}
          </p>
        </div>

        <div className='space-y-1'>
          <p className='text-muted-foreground text-xs font-medium'>
            图生视频提示词
          </p>
          <p className='bg-muted/50 rounded-md p-2 text-sm whitespace-pre-wrap'>
            {history.image_to_video || '(空)'}
          </p>
        </div>
      </div>
    </div>
  );
}

export function PromptHistoryDialog({
  prompt,
  open,
  onOpenChange
}: PromptHistoryDialogProps) {
  const history = prompt?.edit_history || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[80vh] sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>修改历史</DialogTitle>
          <DialogDescription>
            {prompt && `分镜 #${prompt.storyboard_index} 的提示词修改历史`}
          </DialogDescription>
        </DialogHeader>

        {history.length === 0 ? (
          <div className='text-muted-foreground flex flex-col items-center justify-center py-8'>
            <Clock className='mb-2 h-8 w-8' />
            <p>暂无修改历史</p>
          </div>
        ) : (
          <ScrollArea className='h-[400px] pr-4'>
            <div className='space-y-0'>
              {history.map((item, index) => (
                <div key={index}>
                  <HistoryItem
                    history={item}
                    index={history.length - index - 1}
                  />
                  {index < history.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
