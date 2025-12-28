'use client';

import { Pencil, History, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Prompt, CharacterMapping } from '@/types/youtube';

export interface PromptCardProps {
  prompt: Prompt;
  characterMappings?: CharacterMapping[]; // 可用的角色映射列表
  onEdit: (prompt: Prompt) => void;
  onViewHistory: (prompt: Prompt) => void;
}

export function PromptCard({
  prompt,
  characterMappings = [],
  onEdit,
  onViewHistory
}: PromptCardProps) {
  // 获取角色引用的显示名称
  const getCharacterDisplayName = (identifier: string): string => {
    const mapping = characterMappings.find((m) => m.identifier === identifier);
    return mapping?.name ? `${identifier}: ${mapping.name}` : identifier;
  };

  return (
    <Card className='overflow-hidden'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-base'>
            微创新分镜 #{prompt.storyboard_index}
            {prompt.is_edited && (
              <Badge variant='secondary' className='gap-1'>
                <Pencil className='h-3 w-3' />
                已编辑
              </Badge>
            )}
          </CardTitle>
          <div className='flex items-center gap-2'>
            {prompt.edit_history && prompt.edit_history.length > 0 && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => onViewHistory(prompt)}
                className='gap-1'
              >
                <History className='h-3.5 w-3.5' />
                历史
              </Button>
            )}
            <Button
              variant='outline'
              size='sm'
              onClick={() => onEdit(prompt)}
              className='gap-1'
            >
              <Pencil className='h-3.5 w-3.5' />
              编辑
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* 提示词内容 - 不显示分镜缩略图 */}
        <div className='space-y-3'>
          {/* 文生图提示词 */}
          <div className='space-y-1'>
            <p className='text-muted-foreground text-xs font-medium'>
              文生图提示词
            </p>
            <p className='bg-muted/50 rounded-md p-2 text-sm whitespace-pre-wrap'>
              {prompt.text_to_image || '暂无提示词'}
            </p>
          </div>

          {/* 图生视频提示词 */}
          <div className='space-y-1'>
            <p className='text-muted-foreground text-xs font-medium'>
              图生视频提示词
            </p>
            <p className='bg-muted/50 rounded-md p-2 text-sm whitespace-pre-wrap'>
              {prompt.image_to_video || '暂无提示词'}
            </p>
          </div>

          {/* 角色引用标签 */}
          {prompt.character_refs && prompt.character_refs.length > 0 && (
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-muted-foreground text-xs'>角色引用:</span>
              <div className='flex flex-wrap gap-1'>
                {prompt.character_refs.map((ref) => (
                  <Badge key={ref} variant='outline' className='gap-1'>
                    <User className='h-3 w-3' />
                    {getCharacterDisplayName(ref)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
