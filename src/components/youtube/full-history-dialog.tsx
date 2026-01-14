'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  Loader2,
  ChevronDown,
  ChevronRight,
  Sparkles
} from 'lucide-react';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { getProject } from '@/lib/api/youtube';
import type {
  PromptHistoryVersion,
  PromptHistoryStoryboard
} from '@/types/youtube';

export interface FullHistoryDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 格式化时间戳为友好显示
 */
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

/**
 * 单个版本的提示词内容展示
 */
function VersionContent({
  version,
  isExpanded,
  onToggle
}: {
  version: PromptHistoryVersion;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger className='hover:bg-muted/50 flex w-full items-center justify-between rounded-lg border p-3'>
        <div className='flex items-center gap-3'>
          {isExpanded ? (
            <ChevronDown className='h-4 w-4' />
          ) : (
            <ChevronRight className='h-4 w-4' />
          )}
          <Badge variant='outline' className='font-mono'>
            {version.version}
          </Badge>
          <span className='max-w-[200px] truncate text-sm font-medium'>
            {version.instruction}
          </span>
        </div>
        <div className='text-muted-foreground flex items-center gap-2 text-xs'>
          <Clock className='h-3 w-3' />
          {formatTimestamp(version.created_at)}
          <span>·</span>
          <span>{version.storyboards.length} 个分镜</span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className='mt-2 space-y-3 pl-7'>
          {version.parent_version && (
            <p className='text-muted-foreground text-xs'>
              基于版本: {version.parent_version}
            </p>
          )}
          {version.storyboards.map((sb, index) => (
            <StoryboardPromptItem key={index} storyboard={sb} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * 单个分镜的提示词展示
 */
function StoryboardPromptItem({
  storyboard
}: {
  storyboard: PromptHistoryStoryboard;
}) {
  return (
    <div className='bg-muted/30 space-y-2 rounded-md border p-3'>
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium'>
          分镜 #{storyboard.index + 1}
        </span>
        {storyboard.is_prompt_edited && (
          <Badge variant='secondary' className='text-xs'>
            已编辑
          </Badge>
        )}
      </div>

      {/* 文生图提示词 */}
      <div className='space-y-1'>
        <p className='text-muted-foreground text-xs font-medium'>
          文生图提示词
        </p>
        <p className='bg-background rounded p-2 text-xs whitespace-pre-wrap'>
          {storyboard.text_to_image || '(空)'}
        </p>
      </div>

      {/* 图生视频提示词 */}
      <div className='space-y-1'>
        <p className='text-muted-foreground text-xs font-medium'>
          图生视频提示词
        </p>
        <p className='bg-background rounded p-2 text-xs whitespace-pre-wrap'>
          {storyboard.image_to_video || '(空)'}
        </p>
      </div>

      {/* 角色引用 */}
      {storyboard.character_refs && storyboard.character_refs.length > 0 && (
        <div className='flex flex-wrap items-center gap-1'>
          <span className='text-muted-foreground text-xs'>引用:</span>
          {storyboard.character_refs.map((ref, i) => (
            <Badge key={i} variant='outline' className='text-xs'>
              {ref}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 完整历史对话框
 * 显示所有版本的完整提示词内容
 */
export function FullHistoryDialog({
  projectId,
  open,
  onOpenChange
}: FullHistoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<PromptHistoryVersion[]>([]);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(
    new Set()
  );

  // 加载完整历史数据
  useEffect(() => {
    if (!open) return;

    const loadFullHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const project = await getProject(projectId, { fullHistory: true });
        const history = project.data.prompt_history || [];
        // 按版本号倒序排列（最新的在前）
        const sorted = [...history].sort((a, b) => {
          const numA = parseInt(a.version.replace('v', ''), 10);
          const numB = parseInt(b.version.replace('v', ''), 10);
          return numB - numA;
        });
        setVersions(sorted);
        // 默认展开第一个版本
        if (sorted.length > 0) {
          setExpandedVersions(new Set([sorted[0].version]));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载历史失败');
      } finally {
        setLoading(false);
      }
    };

    loadFullHistory();
  }, [open, projectId]);

  const toggleVersion = (version: string) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
      }
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[85vh] sm:max-w-[800px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Sparkles className='h-5 w-5' />
            提示词完整历史
          </DialogTitle>
          <DialogDescription>
            查看所有版本的提示词内容，点击版本可展开/收起详情
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className='flex flex-col items-center justify-center py-12'>
            <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
            <p className='text-muted-foreground mt-2 text-sm'>加载中...</p>
          </div>
        ) : error ? (
          <div className='flex flex-col items-center justify-center py-12'>
            <p className='text-destructive'>{error}</p>
          </div>
        ) : versions.length === 0 ? (
          <div className='text-muted-foreground flex flex-col items-center justify-center py-12'>
            <Clock className='mb-2 h-8 w-8' />
            <p>暂无历史版本</p>
          </div>
        ) : (
          <ScrollArea className='h-[500px] pr-4'>
            <div className='space-y-3'>
              {versions.map((version, index) => (
                <div key={version.version}>
                  <VersionContent
                    version={version}
                    isExpanded={expandedVersions.has(version.version)}
                    onToggle={() => toggleVersion(version.version)}
                  />
                  {index < versions.length - 1 && (
                    <Separator className='my-3' />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
