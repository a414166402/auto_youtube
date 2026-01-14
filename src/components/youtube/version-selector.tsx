'use client';

import { useState } from 'react';
import { ChevronDown, History, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { FullHistoryDialog } from './full-history-dialog';
import type { PromptHistorySummary } from '@/types/youtube';

interface VersionSelectorProps {
  projectId: string;
  currentVersion: string;
  versions: PromptHistorySummary[];
  onVersionChange: (version: string) => void;
  disabled?: boolean;
}

/**
 * 格式化时间戳为友好显示
 */
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 截断指令文本
 */
function truncateInstruction(
  instruction: string,
  maxLength: number = 20
): string {
  if (instruction.length <= maxLength) return instruction;
  return instruction.slice(0, maxLength) + '...';
}

export function VersionSelector({
  projectId,
  currentVersion,
  versions,
  onVersionChange,
  disabled = false
}: VersionSelectorProps) {
  const [open, setOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  // 按版本号倒序排列（最新的在前）
  const sortedVersions = [...versions].sort((a, b) => {
    const numA = parseInt(a.version.replace('v', ''), 10);
    const numB = parseInt(b.version.replace('v', ''), 10);
    return numB - numA;
  });

  const handleSelect = (version: string) => {
    if (version !== currentVersion) {
      onVersionChange(version);
    }
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          className='gap-2'
          disabled={disabled || versions.length === 0}
        >
          <History className='h-4 w-4' />
          版本: {currentVersion}
          {versions.length > 1 && <ChevronDown className='h-4 w-4' />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-80'>
        <DropdownMenuLabel className='flex items-center gap-2'>
          <History className='h-4 w-4' />
          提示词版本历史
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {sortedVersions.map((version) => {
          const isCurrent = version.version === currentVersion;
          return (
            <DropdownMenuItem
              key={version.version}
              onClick={() => handleSelect(version.version)}
              className={`flex flex-col items-start gap-1 py-2 ${
                isCurrent ? 'bg-muted' : ''
              }`}
            >
              <div className='flex w-full items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <span className='font-medium'>{version.version}</span>
                  {isCurrent && (
                    <Badge variant='secondary' className='text-xs'>
                      当前
                    </Badge>
                  )}
                </div>
                <span className='text-muted-foreground text-xs'>
                  {version.storyboard_count} 个分镜
                </span>
              </div>
              <div className='flex w-full items-center gap-2 text-xs'>
                <Clock className='text-muted-foreground h-3 w-3' />
                <span className='text-muted-foreground'>
                  {formatTimestamp(version.created_at)}
                </span>
                <span className='text-muted-foreground'>-</span>
                <span className='text-muted-foreground truncate'>
                  {truncateInstruction(version.instruction)}
                </span>
              </div>
              {version.parent_version && (
                <div className='text-muted-foreground text-xs'>
                  基于 {version.parent_version}
                </div>
              )}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setOpen(false);
            setHistoryDialogOpen(true);
          }}
          className='gap-2'
        >
          <FileText className='h-4 w-4' />
          查看全部历史
        </DropdownMenuItem>
      </DropdownMenuContent>

      {/* 完整历史对话框 */}
      <FullHistoryDialog
        projectId={projectId}
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
      />
    </DropdownMenu>
  );
}
