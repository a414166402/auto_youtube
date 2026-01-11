'use client';

import { useRef, useState } from 'react';
import { Upload, X, Loader2, Trash2, Pencil, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  type GlobalSubject,
  SUBJECT_TYPE_LABELS,
  SUBJECT_TYPE_ICONS,
  getSubjectImageUrl
} from '@/lib/subject-config';
import { validateImageSize, getMaxImageSizeText } from '@/lib/api/youtube';

interface GlobalSubjectCardProps {
  subject: GlobalSubject;
  isLoading?: boolean;
  onNameChange: (id: string, name: string) => Promise<void>;
  onImageUpload: (id: string, file: File) => Promise<void>;
  onImageRemove: (id: string) => void;
  onDelete: (id: string) => void;
}

export function GlobalSubjectCard({
  subject,
  isLoading = false,
  onNameChange,
  onImageUpload,
  onImageRemove,
  onDelete
}: GlobalSubjectCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(subject.name);
  const [isSavingName, setIsSavingName] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast({
        title: '文件类型错误',
        description: '请选择图片文件',
        variant: 'destructive'
      });
      return;
    }

    // 验证文件大小
    if (!validateImageSize(file)) {
      toast({
        title: '文件过大',
        description: `图片大小不能超过 ${getMaxImageSizeText()}`,
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    try {
      await onImageUpload(subject.id, file);
    } catch (error) {
      toast({
        title: '上传失败',
        description: error instanceof Error ? error.message : '图片上传失败',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      // 清空 input 以便重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 进入编辑模式
  const handleStartEdit = () => {
    setEditName(subject.name);
    setIsEditing(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (editName === subject.name) {
      setIsEditing(false);
      return;
    }

    setIsSavingName(true);
    try {
      await onNameChange(subject.id, editName);
      setIsEditing(false);
    } catch (error) {
      toast({
        title: '保存失败',
        description: error instanceof Error ? error.message : '名称保存失败',
        variant: 'destructive'
      });
    } finally {
      setIsSavingName(false);
    }
  };

  const typeLabel = SUBJECT_TYPE_LABELS[subject.type];
  const typeIcon = SUBJECT_TYPE_ICONS[subject.type];
  const imageUrl = getSubjectImageUrl(subject);
  const isDisabled = isLoading || isUploading || isSavingName;
  const displayName = subject.name || '未命名';

  return (
    <Card className='relative'>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <span>{typeIcon}</span>
            <span className='truncate' title={displayName}>
              {displayName}
            </span>
          </CardTitle>
          <div className='flex items-center gap-1'>
            {imageUrl ? (
              <Badge variant='default' className='text-xs'>
                已配置
              </Badge>
            ) : (
              <Badge variant='outline' className='text-xs'>
                未配置
              </Badge>
            )}
            <Button
              variant='ghost'
              size='icon'
              className='text-destructive hover:text-destructive h-6 w-6'
              onClick={() => onDelete(subject.id)}
              disabled={isDisabled}
              title='删除'
            >
              <Trash2 className='h-3 w-3' />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        {/* 名称编辑区域 */}
        <div className='flex items-center gap-2'>
          {isEditing ? (
            <>
              <Input
                placeholder={`${typeLabel}名称`}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className='h-8 flex-1 text-sm'
                disabled={isSavingName}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
              />
              <Button
                variant='default'
                size='sm'
                onClick={handleSaveEdit}
                disabled={isSavingName}
                className='h-8 gap-1'
              >
                {isSavingName ? (
                  <Loader2 className='h-3 w-3 animate-spin' />
                ) : (
                  <Save className='h-3 w-3' />
                )}
                保存
              </Button>
            </>
          ) : (
            <>
              <span className='text-muted-foreground flex-1 truncate text-sm'>
                {subject.name || `未设置${typeLabel}名称`}
              </span>
              <Button
                variant='outline'
                size='sm'
                onClick={handleStartEdit}
                disabled={isDisabled}
                className='h-8 gap-1'
              >
                <Pencil className='h-3 w-3' />
                编辑
              </Button>
            </>
          )}
        </div>

        {/* 图片区域 */}
        <div className='relative'>
          {imageUrl ? (
            <div className='group relative'>
              <img
                src={imageUrl}
                alt={displayName}
                className='h-32 w-full rounded-md border object-contain'
              />
              {/* 悬停时显示操作按钮 */}
              <div className='absolute inset-0 flex items-center justify-center gap-2 rounded-md bg-black/50 opacity-0 transition-opacity group-hover:opacity-100'>
                <Button
                  size='sm'
                  variant='secondary'
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isDisabled}
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
                  disabled={isDisabled}
                >
                  <X className='h-4 w-4' />
                  删除
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={`flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed transition-colors ${
                isDisabled
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:border-primary hover:bg-muted/50'
              }`}
              onClick={() => !isDisabled && fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
              ) : (
                <>
                  <Upload className='text-muted-foreground h-8 w-8' />
                  <span className='text-muted-foreground text-xs'>
                    点击上传参考图
                  </span>
                  <span className='text-muted-foreground text-[10px]'>
                    最大 {getMaxImageSizeText()}
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
          accept='image/jpeg,image/png,image/webp,image/gif'
          className='hidden'
          onChange={handleFileSelect}
          disabled={isDisabled}
        />
      </CardContent>
    </Card>
  );
}
