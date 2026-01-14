'use client';

import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { ViralTag } from '@/types/viral';

interface TagManagerProps {
  tags: ViralTag[];
  onEdit: (tag: ViralTag) => void;
  onDelete: (tag: ViralTag) => void;
}

export function TagManager({ tags, onEdit, onDelete }: TagManagerProps) {
  if (tags.length === 0) {
    return (
      <div className='text-muted-foreground flex flex-col items-center justify-center py-12'>
        <p>暂无标签</p>
        <p className='mt-2 text-xs'>点击&quot;新增标签&quot;按钮创建</p>
      </div>
    );
  }

  return (
    <div className='grid gap-3'>
      {tags.map((tag) => (
        <Card key={tag.id}>
          <CardContent className='flex items-center justify-between p-4'>
            <div className='flex items-center gap-3'>
              <Badge
                style={{
                  backgroundColor: tag.color || '#6b7280',
                  color: '#ffffff'
                }}
                className='px-3 py-1'
              >
                {tag.name}
              </Badge>
              <span className='text-muted-foreground text-sm'>
                {tag.color || '#6b7280'}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => onEdit(tag)}
                className='gap-1'
              >
                <Edit className='h-3 w-3' />
                编辑
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => onDelete(tag)}
                className='text-destructive hover:text-destructive gap-1'
              >
                <Trash2 className='h-3 w-3' />
                删除
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
