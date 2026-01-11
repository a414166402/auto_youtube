'use client';

import { useState, useRef } from 'react';
import { Loader2, X, ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateImageSize, getMaxImageSizeText } from '@/lib/api/youtube';
import { SUBJECT_TYPE_LABELS } from '@/lib/subject-config';
import type { SubjectType } from '@/types/youtube';

interface AddSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: SubjectType;
  onConfirm: (name: string, image?: File) => Promise<void>;
}

export function AddSubjectDialog({
  open,
  onOpenChange,
  type,
  onConfirm
}: AddSubjectDialogProps) {
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const typeLabel = SUBJECT_TYPE_LABELS[type];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateImageSize(file)) {
      setError(`图片大小不能超过 ${getMaxImageSizeText()}`);
      return;
    }

    setError(null);
    setImageFile(file);

    // 生成预览
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onConfirm(name.trim(), imageFile || undefined);
      // 重置状态
      setName('');
      setImageFile(null);
      setImagePreview(null);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        // 关闭时重置状态
        setName('');
        setImageFile(null);
        setImagePreview(null);
        setError(null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>增加{typeLabel}</DialogTitle>
          <DialogDescription>
            填写{typeLabel}名称并上传参考图片
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* 名称输入 */}
          <div className='space-y-2'>
            <Label htmlFor='subject-name'>{typeLabel}名称</Label>
            <Input
              id='subject-name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`例如：紫发贵妇、金色宝箱、森林场景`}
              disabled={isLoading}
            />
          </div>

          {/* 图片上传 */}
          <div className='space-y-2'>
            <Label>参考图片（可选）</Label>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              onChange={handleFileSelect}
              className='hidden'
              disabled={isLoading}
            />

            {imagePreview ? (
              <div className='relative'>
                <img
                  src={imagePreview}
                  alt='预览'
                  className='h-40 w-full rounded-lg border object-contain'
                />
                <Button
                  variant='destructive'
                  size='icon'
                  className='absolute top-2 right-2 h-6 w-6'
                  onClick={handleRemoveImage}
                  disabled={isLoading}
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            ) : (
              <div
                className='hover:bg-muted/50 flex h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors'
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className='text-muted-foreground mb-2 h-10 w-10' />
                <p className='text-muted-foreground text-sm'>点击上传图片</p>
                <p className='text-muted-foreground text-xs'>
                  最大 {getMaxImageSizeText()}
                </p>
              </div>
            )}
          </div>

          {/* 错误提示 */}
          {error && <p className='text-destructive text-sm'>{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                添加中...
              </>
            ) : (
              <>添加</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
