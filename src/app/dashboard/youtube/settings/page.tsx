'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  ImageIcon,
  Check,
  Plus,
  Users,
  Package,
  Image,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlobalSubjectCard } from '@/components/youtube/global-subject-card';
import { MediaStatsPanel } from '@/components/youtube/media-stats-panel';
import { AddSubjectDialog } from '@/components/youtube/add-subject-dialog';
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject
} from '@/lib/api/youtube';
import {
  subjectsToLibrary,
  type GlobalSubjectLibrary,
  type GlobalSubject,
  SUBJECT_TYPE_LABELS,
  DEFAULT_SUBJECT_LIBRARY
} from '@/lib/subject-config';
import type { SubjectType } from '@/types/youtube';

export default function SettingsPage() {
  const [library, setLibrary] = useState<GlobalSubjectLibrary>(
    DEFAULT_SUBJECT_LIBRARY
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<SubjectType>('character');

  // 添加主体对话框状态
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogType, setAddDialogType] = useState<SubjectType>('character');

  // 从后端加载全局主体库
  const loadLibrary = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getSubjects();
      const loadedLibrary = subjectsToLibrary(response.subjects);
      setLibrary(loadedLibrary);
    } catch (error) {
      console.error('Failed to load library:', error);
      toast.error('加载主体库失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  // 更新主体名称
  const handleNameChange = useCallback(async (id: string, name: string) => {
    try {
      await updateSubject(id, name);

      // 更新本地状态
      setLibrary((prev) => {
        const newLibrary = { ...prev };
        for (const type of ['character', 'object', 'scene'] as SubjectType[]) {
          newLibrary[type] = prev[type].map((s) =>
            s.id === id ? { ...s, name } : s
          );
        }
        return newLibrary;
      });

      setLastSaved(new Date());
      toast.success('名称已保存');
    } catch (error) {
      toast.error('保存名称失败');
      console.error('Failed to save name:', error);
      throw error;
    }
  }, []);

  // 上传主体图片
  const handleImageUpload = useCallback(async (id: string, file: File) => {
    try {
      const updatedSubject = await updateSubject(id, undefined, file);

      // 更新本地状态
      setLibrary((prev) => {
        const newLibrary = { ...prev };
        for (const type of ['character', 'object', 'scene'] as SubjectType[]) {
          newLibrary[type] = prev[type].map((s) =>
            s.id === id
              ? {
                  ...s,
                  imageData: updatedSubject.image_url,
                  image_url: updatedSubject.image_url
                }
              : s
          );
        }
        return newLibrary;
      });

      setLastSaved(new Date());
      toast.success('图片已保存');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '图片保存失败');
      console.error('Failed to upload image:', error);
      throw error;
    }
  }, []);

  // 删除主体图片
  const handleImageRemove = useCallback(async (id: string) => {
    try {
      await updateSubject(id, undefined, undefined, true);

      // 更新本地状态
      setLibrary((prev) => {
        const newLibrary = { ...prev };
        for (const type of ['character', 'object', 'scene'] as SubjectType[]) {
          newLibrary[type] = prev[type].map((s) =>
            s.id === id
              ? { ...s, imageData: undefined, image_url: undefined }
              : s
          );
        }
        return newLibrary;
      });

      setLastSaved(new Date());
      toast.info('图片已删除');
    } catch (error) {
      toast.error('删除图片失败');
      console.error('Failed to remove image:', error);
    }
  }, []);

  // 添加新主体 - 打开对话框
  const handleAddSubject = useCallback((type: SubjectType) => {
    setAddDialogType(type);
    setAddDialogOpen(true);
  }, []);

  // 确认添加主体（从对话框回调）
  const handleConfirmAddSubject = useCallback(
    async (name: string, image?: File) => {
      const type = addDialogType;

      const newSubject = await createSubject(type, name || undefined, image);

      // 更新本地状态
      const globalSubject: GlobalSubject = {
        id: newSubject.id,
        type: newSubject.type,
        identifier: '', // 不再使用 identifier
        name: newSubject.name || '',
        imageData: newSubject.image_url,
        image_url: newSubject.image_url
      };

      setLibrary((prev) => ({
        ...prev,
        [type]: [...prev[type], globalSubject]
      }));

      setLastSaved(new Date());
      toast.success(`已添加${SUBJECT_TYPE_LABELS[type]}`);
    },
    [addDialogType]
  );

  // 删除主体
  const handleDeleteSubject = useCallback(
    async (id: string) => {
      // 找到主体
      let foundSubject: GlobalSubject | null = null;
      let foundType: SubjectType | null = null;

      for (const type of ['character', 'object', 'scene'] as SubjectType[]) {
        const subject = library[type].find((s) => s.id === id);
        if (subject) {
          foundSubject = subject;
          foundType = type;
          break;
        }
      }

      if (!foundSubject || !foundType) {
        toast.error('主体不存在');
        return;
      }

      setIsSaving(true);
      try {
        await deleteSubject(id);

        // 更新本地状态
        setLibrary((prev) => ({
          ...prev,
          [foundType!]: prev[foundType!].filter((s) => s.id !== id)
        }));

        setLastSaved(new Date());
        toast.info(
          `已删除${SUBJECT_TYPE_LABELS[foundType]}: ${foundSubject.name || '未命名'}`
        );
      } catch (error) {
        toast.error('删除失败');
        console.error('Failed to delete subject:', error);
      } finally {
        setIsSaving(false);
      }
    },
    [library]
  );

  // 刷新数据
  const handleRefresh = useCallback(async () => {
    await loadLibrary();
    toast.success('数据已刷新');
  }, [loadLibrary]);

  // 统计各类型配置数量
  const getStats = (type: SubjectType) => {
    const subjects = library[type];
    const configured = subjects.filter(
      (s) => s.imageData || s.image_url
    ).length;
    return { total: subjects.length, configured };
  };

  const characterStats = getStats('character');
  const objectStats = getStats('object');
  const sceneStats = getStats('scene');

  // Tab图标映射
  const tabIcons: Record<SubjectType, React.ReactNode> = {
    character: <Users className='h-4 w-4' />,
    object: <Package className='h-4 w-4' />,
    scene: <Image className='h-4 w-4' />
  };

  return (
    <div className='container mx-auto space-y-6'>
      {/* 页面头部 */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Link href='/dashboard/youtube/projects'>
            <Button variant='ghost' size='icon'>
              <ArrowLeft className='h-4 w-4' />
            </Button>
          </Link>
          <div>
            <h1 className='text-2xl font-bold'>全局主体库</h1>
            <p className='text-muted-foreground text-sm'>
              管理角色、物品、场景的参考图，所有项目共享
            </p>
          </div>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={handleRefresh}
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
          <strong>全局主体库</strong>
          ：在此上传角色/物品/场景的参考图和名称，所有项目共享。
          <br />
          <strong>项目级映射</strong>
          ：在各项目的提示词编辑页面，将提示词中的角色/物品/场景引用映射到全局主体。
          <br />
          <strong>图片限制</strong>：单张图片大小不超过 5MB。
        </AlertDescription>
      </Alert>

      {/* 配置统计 */}
      <div className='text-muted-foreground flex items-center justify-between text-sm'>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-1'>
            <Users className='h-4 w-4' />
            角色: {characterStats.configured}/{characterStats.total}
          </div>
          <div className='flex items-center gap-1'>
            <Package className='h-4 w-4' />
            物品: {objectStats.configured}/{objectStats.total}
          </div>
          <div className='flex items-center gap-1'>
            <Image className='h-4 w-4' />
            场景: {sceneStats.configured}/{sceneStats.total}
          </div>
        </div>
        {lastSaved && (
          <div className='flex items-center gap-1 text-xs text-green-600'>
            <Check className='h-3 w-3' />
            已保存
          </div>
        )}
      </div>

      {/* 主体库Tabs */}
      {isLoading ? (
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
        </div>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as SubjectType)}
        >
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='character' className='gap-2'>
              {tabIcons.character}
              角色库 ({characterStats.total})
            </TabsTrigger>
            <TabsTrigger value='object' className='gap-2'>
              {tabIcons.object}
              物品库 ({objectStats.total})
            </TabsTrigger>
            <TabsTrigger value='scene' className='gap-2'>
              {tabIcons.scene}
              场景库 ({sceneStats.total})
            </TabsTrigger>
          </TabsList>

          {(['character', 'object', 'scene'] as SubjectType[]).map((type) => (
            <TabsContent key={type} value={type} className='space-y-4'>
              {/* 添加按钮 */}
              <div className='flex justify-end'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleAddSubject(type)}
                  disabled={isSaving}
                  className='gap-1'
                >
                  <Plus className='h-4 w-4' />
                  增加{SUBJECT_TYPE_LABELS[type]}
                </Button>
              </div>

              {/* 主体列表 */}
              {library[type].length === 0 ? (
                <div className='text-muted-foreground flex flex-col items-center justify-center py-12'>
                  <ImageIcon className='mb-2 h-12 w-12' />
                  <p>暂无{SUBJECT_TYPE_LABELS[type]}</p>
                  <p className='text-xs'>点击上方&ldquo;增加&rdquo;按钮创建</p>
                </div>
              ) : (
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                  {library[type].map((subject) => (
                    <GlobalSubjectCard
                      key={subject.id}
                      subject={subject}
                      isLoading={isSaving}
                      onNameChange={handleNameChange}
                      onImageUpload={handleImageUpload}
                      onImageRemove={handleImageRemove}
                      onDelete={handleDeleteSubject}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* 媒体占用统计面板 */}
      <MediaStatsPanel />

      {/* 添加主体对话框 */}
      <AddSubjectDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        type={addDialogType}
        onConfirm={handleConfirmAddSubject}
      />
    </div>
  );
}
