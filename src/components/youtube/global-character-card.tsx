'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, User, ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GlobalCharacter } from '@/lib/character-config';

export interface GlobalCharacterCardProps {
  character: GlobalCharacter;
  onNameChange: (id: number, name: string) => void;
  onImageUpload: (id: number, file: File) => Promise<void>;
  onImageRemove: (id: number) => void;
}

export function GlobalCharacterCard({
  character,
  onNameChange,
  onImageUpload,
  onImageRemove
}: GlobalCharacterCardProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        return;
      }

      // 验证文件大小 (最大 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return;
      }

      setIsUploading(true);
      try {
        await onImageUpload(character.id, file);
      } finally {
        setIsUploading(false);
      }
    },
    [character.id, onImageUpload]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // 重置input以允许重复选择同一文件
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-base'>
          <div className='bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full'>
            <User className='text-primary h-4 w-4' />
          </div>
          <span>角色 {character.id}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* 名称输入 */}
        <div className='space-y-2'>
          <label className='text-sm font-medium'>角色名称</label>
          <Input
            placeholder='输入角色名称（可选）'
            value={character.name || ''}
            onChange={(e) => onNameChange(character.id, e.target.value)}
          />
        </div>

        {/* 图片上传区域 */}
        <div className='space-y-2'>
          <label className='text-sm font-medium'>参考图片</label>
          <div
            className={cn(
              'relative cursor-pointer rounded-lg border-2 border-dashed transition-colors',
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50',
              isUploading && 'pointer-events-none opacity-60'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              className='hidden'
              onChange={handleInputChange}
              disabled={isUploading}
            />

            {character.imageData ? (
              // 显示已上传的图片
              <div className='relative mx-auto aspect-square max-w-[200px] p-2'>
                <img
                  src={character.imageData}
                  alt={`角色 ${character.id} 参考图`}
                  className='h-full w-full rounded-md object-cover'
                />
                {isUploading && (
                  <div className='bg-background/80 absolute inset-0 flex items-center justify-center rounded-md'>
                    <Loader2 className='text-primary h-6 w-6 animate-spin' />
                  </div>
                )}
                {!isUploading && (
                  <div className='bg-background/80 absolute inset-0 flex items-center justify-center rounded-md opacity-0 transition-opacity hover:opacity-100'>
                    <div className='text-center'>
                      <Upload className='text-muted-foreground mx-auto mb-1 h-6 w-6' />
                      <p className='text-muted-foreground text-xs'>
                        点击更换图片
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // 上传提示
              <div className='flex flex-col items-center justify-center px-4 py-8'>
                {isUploading ? (
                  <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
                ) : (
                  <>
                    <div className='mb-3 rounded-full border border-dashed p-3'>
                      <ImageIcon className='text-muted-foreground h-6 w-6' />
                    </div>
                    <p className='text-muted-foreground text-center text-sm'>
                      拖拽图片到此处，或点击上传
                    </p>
                    <p className='text-muted-foreground/70 mt-1 text-xs'>
                      支持 JPG、PNG、GIF，最大 5MB
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 删除图片按钮 */}
          {character.imageData && (
            <Button
              variant='outline'
              size='sm'
              className='text-destructive hover:text-destructive w-full'
              onClick={(e) => {
                e.stopPropagation();
                onImageRemove(character.id);
              }}
            >
              <Trash2 className='mr-2 h-4 w-4' />
              删除图片
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
