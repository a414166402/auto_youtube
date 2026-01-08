'use client';

import { useRef, useState } from 'react';
import { Upload, X, Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  type GlobalSubject,
  type SubjectType,
  SUBJECT_TYPE_LABELS,
  SUBJECT_TYPE_ICONS
} from '@/lib/subject-config';

interface GlobalSubjectCardProps {
  subject: GlobalSubject;
  canDelete: boolean;
  onNameChange: (id: string, name: string) => void;
  onImageUpload: (id: string, file: File) => Promise<void>;
  onImageRemove: (id: string) => void;
  onDelete: (id: string) => void;
}

export function GlobalSubjectCard({
  subject,
  canDelete,
  onNameChange,
  onImageUpload,
  onImageRemove,
  onDelete
}: GlobalSubjectCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return;
    }

    setIsUploading(true);
    try {
      await onImageUpload(subject.id, file);
    } finally {
      setIsUploading(false);
      // 清空 input 以便重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const typeLabel = SUBJECT_TYPE_LABELS[subject.type];
  const typeIcon = SUBJECT_TYPE_ICONS[subject.type];

  return (
    <Card className='relative'>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <span>{typeIcon}</span>
            <span>
              {typeLabel} {subject.identifier}
            </span>
          </CardTitle>
          <div className='flex items-center gap-1'>
            {subject.imageData ? (
              <Badge variant='default' className='text-xs'>
                已配置
              </Badge>
            ) : (
              <Badge variant='outline' className='text-xs'>
                未配置
              </Badge>
            )}
            {canDelete && (
              <Button
                variant='ghost'
                size='icon'
                className='text-destructive hover:text-destructive h-6 w-6'
                onClick={() => onDelete(subject.id)}
                title='删除'
              >
                <Trash2 className='h-3 w-3' />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        {/* 名称输入 */}
        <Input
          placeholder={`${typeLabel}名称（可选）`}
          value={subject.name}
          onChange={(e) => onNameChange(subject.id, e.target.value)}
          className='h-8 text-sm'
        />

        {/* 图片区域 */}
        <div className='relative'>
          {subject.imageData ? (
            <div className='group relative'>
              <img
                src={subject.imageData}
                alt={`${typeLabel} ${subject.identifier}`}
                className='h-32 w-full rounded-md border object-contain'
              />
              {/* 悬停时显示操作按钮 */}
              <div className='absolute inset-0 flex items-center justify-center gap-2 rounded-md bg-black/50 opacity-0 transition-opacity group-hover:opacity-100'>
                <Button
                  size='sm'
                  variant='secondary'
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Upload className='h-4 w-4' />
                  )}
                  更换
                </Button>
                <Button
                  size='sm'
                  variant='destructive'
                  onClick={() => onImageRemove(subject.id)}
                >
                  <X className='h-4 w-4' />
                  删除
                </Button>
              </div>
            </div>
          ) : (
            <div
              className='hover:border-primary hover:bg-muted/50 flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed transition-colors'
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
              ) : (
                <>
                  <Upload className='text-muted-foreground h-8 w-8' />
                  <span className='text-muted-foreground text-xs'>
                    点击上传参考图
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          className='hidden'
          onChange={handleFileSelect}
        />
      </CardContent>
    </Card>
  );
}
