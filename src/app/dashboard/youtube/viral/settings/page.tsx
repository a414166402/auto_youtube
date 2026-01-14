'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Plus,
  RefreshCw,
  Tag
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TagManager } from '@/components/viral/tag-manager';
import { TagDialog } from '@/components/viral/tag-dialog';
import {
  getViralTags,
  createViralTag,
  updateViralTag,
  deleteViralTag
} from '@/lib/api/viral';
import type { ViralTag, CreateTagRequest } from '@/types/viral';

export default function ViralSettingsPage() {
  const [tags, setTags] = useState<ViralTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<ViralTag | undefined>();

  // 加载标签列表
  const loadTags = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getViralTags();
      setTags(response.tags);
    } catch (error) {
      console.error('Failed to load tags:', error);
      toast.error('加载标签失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  // 创建或更新标签
  const handleSubmit = async (data: CreateTagRequest) => {
    try {
      if (editingTag) {
        await updateViralTag(editingTag.id, data);
        toast.success('标签已更新');
      } else {
        await createViralTag(data);
        toast.success('标签已创建');
      }
      loadTags();
    } catch (error) {
      console.error('Failed to submit tag:', error);
      toast.error(editingTag ? '更新标签失败' : '创建标签失败');
      throw error;
    }
  };

  // 删除标签
  const handleDelete = async (tag: ViralTag) => {
    if (!confirm(`确定要删除标签"${tag.name}"吗？`)) {
      return;
    }

    try {
      await deleteViralTag(tag.id);
      toast.success('标签已删除');
      loadTags();
    } catch (error) {
      console.error('Failed to delete tag:', error);
      toast.error('删除标签失败');
    }
  };

  // 打开编辑对话框
  const handleEdit = (tag: ViralTag) => {
    setEditingTag(tag);
    setTagDialogOpen(true);
  };

  // 关闭对话框时重置编辑状态
  const handleDialogClose = (open: boolean) => {
    setTagDialogOpen(open);
    if (!open) {
      setEditingTag(undefined);
    }
  };

  return (
    <div className='container mx-auto space-y-6'>
      {/* 页面头部 */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Link href='/dashboard/youtube/viral'>
            <Button variant='ghost' size='icon'>
              <ArrowLeft className='h-4 w-4' />
            </Button>
          </Link>
          <div>
            <h1 className='text-2xl font-bold'>爆款库设置</h1>
            <p className='text-muted-foreground text-sm'>管理爆款视频的标签</p>
          </div>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={loadTags}
          disabled={isLoading}
          className='gap-1'
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* 说明信息 */}
      <Alert>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          <strong>标签管理</strong>：创建和管理爆款视频的标签，用于分类和筛选。
          <br />
          标签可以设置不同的颜色以便区分。
        </AlertDescription>
      </Alert>

      {/* 标签统计 */}
      <div className='text-muted-foreground flex items-center gap-4 text-sm'>
        <div className='flex items-center gap-1'>
          <Tag className='h-4 w-4' />
          标签总数: {tags.length}
        </div>
      </div>

      {/* 标签管理区域 */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>标签列表</h2>
          <Button onClick={() => setTagDialogOpen(true)} className='gap-1'>
            <Plus className='h-4 w-4' />
            新增标签
          </Button>
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center py-12'>
            <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
          </div>
        ) : (
          <TagManager tags={tags} onEdit={handleEdit} onDelete={handleDelete} />
        )}
      </div>

      {/* 新增/编辑标签对话框 */}
      <TagDialog
        open={tagDialogOpen}
        onOpenChange={handleDialogClose}
        tag={editingTag}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
