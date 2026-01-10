'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Save,
  Loader2,
  RotateCcw,
  AlertCircle,
  ImageIcon,
  Check,
  Plus,
  Users,
  Package,
  Image
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlobalSubjectCard } from '@/components/youtube/global-subject-card';
import { MediaStatsPanel } from '@/components/youtube/media-stats-panel';
import {
  loadGlobalSubjectLibraryAsync,
  saveGlobalSubjectLibraryAsync,
  saveSubjectAsync,
  deleteSubjectAsync,
  updateSubjectName,
  updateSubjectImage,
  addSubjectToLibrary,
  removeSubjectFromLibrary,
  createSubject,
  getNextIdentifier,
  canAddSubject,
  canDeleteSubject,
  fileToBase64,
  DEFAULT_SUBJECT_LIBRARY,
  type GlobalSubjectLibrary,
  type SubjectType,
  SUBJECT_TYPE_LABELS
} from '@/lib/subject-config';

export default function SettingsPage() {
  const [library, setLibrary] = useState<GlobalSubjectLibrary>(
    DEFAULT_SUBJECT_LIBRARY
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<SubjectType>('character');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 从 IndexedDB 加载全局主体库
  useEffect(() => {
    loadGlobalSubjectLibraryAsync()
      .then((loadedLibrary) => {
        setLibrary(loadedLibrary);
      })
      .catch((error) => {
        console.error('Failed to load library:', error);
        toast.error('加载主体库失败');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // 自动保存函数（带防抖）
  const autoSave = useCallback((newLibrary: GlobalSubjectLibrary) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveGlobalSubjectLibraryAsync(newLibrary);
        setLastSaved(new Date());
      } catch (error) {
        toast.error('自动保存失败');
        console.error('Failed to auto-save:', error);
      }
    }, 500);
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // 更新主体名称
  const handleNameChange = useCallback(
    (id: string, name: string) => {
      setLibrary((prev) => {
        const newLibrary = updateSubjectName(prev, id, name);
        autoSave(newLibrary);
        return newLibrary;
      });
    },
    [autoSave]
  );

  // 上传主体图片
  const handleImageUpload = useCallback(
    async (id: string, file: File) => {
      try {
        const base64Data = await fileToBase64(file);
        const newLibrary = updateSubjectImage(library, id, base64Data);
        setLibrary(newLibrary);
        await saveGlobalSubjectLibraryAsync(newLibrary);
        setLastSaved(new Date());
        toast.success('图片已保存');
      } catch (error) {
        toast.error('图片保存失败');
        console.error('Failed to upload image:', error);
      }
    },
    [library]
  );

  // 删除主体图片
  const handleImageRemove = useCallback(
    async (id: string) => {
      try {
        const newLibrary = updateSubjectImage(library, id, undefined);
        setLibrary(newLibrary);
        await saveGlobalSubjectLibraryAsync(newLibrary);
        setLastSaved(new Date());
        toast.info('图片已删除');
      } catch (error) {
        toast.error('删除图片失败');
        console.error('Failed to remove image:', error);
      }
    },
    [library]
  );

  // 添加新主体
  const handleAddSubject = useCallback(
    async (type: SubjectType) => {
      const subjects = library[type];

      if (!canAddSubject(subjects)) {
        toast.error('无法添加：请确保按顺序添加（A→B→C...）');
        return;
      }

      const nextId = getNextIdentifier(subjects);
      if (!nextId) {
        toast.error('已达到最大数量（26个）');
        return;
      }

      const newSubject = createSubject(type, nextId);
      const newLibrary = addSubjectToLibrary(library, newSubject);

      setLibrary(newLibrary);

      try {
        await saveSubjectAsync(newSubject);
        setLastSaved(new Date());
        toast.success(`已添加 ${SUBJECT_TYPE_LABELS[type]} ${nextId}`);
      } catch (error) {
        toast.error('添加失败');
        console.error('Failed to add subject:', error);
      }
    },
    [library]
  );

  // 删除主体
  const handleDeleteSubject = useCallback(
    async (id: string) => {
      // 解析ID获取类型和标识符
      const parts = id.split('_');
      if (parts.length !== 2) return;

      const [type, identifier] = parts;
      const subjects = library[type as SubjectType];

      if (!canDeleteSubject(subjects, identifier)) {
        toast.error('只能删除最后一个（按顺序删除）');
        return;
      }

      const newLibrary = removeSubjectFromLibrary(library, id);
      setLibrary(newLibrary);

      try {
        await deleteSubjectAsync(id);
        setLastSaved(new Date());
        toast.info(
          `已删除 ${SUBJECT_TYPE_LABELS[type as SubjectType]} ${identifier}`
        );
      } catch (error) {
        toast.error('删除失败');
        console.error('Failed to delete subject:', error);
      }
    },
    [library]
  );

  // 手动保存
  const handleSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSaving(true);
    try {
      await saveGlobalSubjectLibraryAsync(library);
      setLastSaved(new Date());
      toast.success('主体库已保存');
    } catch (error) {
      toast.error('保存失败');
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  }, [library]);

  // 重置为默认配置
  const handleReset = useCallback(async () => {
    try {
      setLibrary(DEFAULT_SUBJECT_LIBRARY);
      await saveGlobalSubjectLibraryAsync(DEFAULT_SUBJECT_LIBRARY);
      setLastSaved(new Date());
      toast.info('已重置为默认配置');
    } catch (error) {
      toast.error('重置失败');
      console.error('Failed to reset:', error);
    }
  }, []);

  // 统计各类型配置数量
  const getStats = (type: SubjectType) => {
    const subjects = library[type];
    const configured = subjects.filter((s) => s.imageData).length;
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
      </div>

      {/* 说明信息 */}
      <Alert>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          <strong>全局主体库</strong>
          ：在此上传角色/物品/场景的参考图和名称，所有项目共享。
          <br />
          <strong>项目级映射</strong>
          ：在各项目的提示词编辑页面配置&ldquo;角色A/物品B/场景C对应哪个全局主体&rdquo;。
          <br />
          <strong>动态添加</strong>
          ：点击&ldquo;添加&rdquo;按钮按顺序添加新主体（A→B→C...），最多支持26个。
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
            已自动保存
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
                  disabled={!canAddSubject(library[type])}
                  className='gap-1'
                >
                  <Plus className='h-4 w-4' />
                  添加{SUBJECT_TYPE_LABELS[type]}
                </Button>
              </div>

              {/* 主体列表 */}
              {library[type].length === 0 ? (
                <div className='text-muted-foreground flex flex-col items-center justify-center py-12'>
                  <ImageIcon className='mb-2 h-12 w-12' />
                  <p>暂无{SUBJECT_TYPE_LABELS[type]}</p>
                  <p className='text-xs'>点击上方&ldquo;添加&rdquo;按钮创建</p>
                </div>
              ) : (
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                  {library[type].map((subject) => (
                    <GlobalSubjectCard
                      key={subject.id}
                      subject={subject}
                      canDelete={canDeleteSubject(
                        library[type],
                        subject.identifier
                      )}
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

      {/* 底部操作按钮 */}
      <div className='flex items-center justify-between border-t pt-4'>
        <Button variant='outline' onClick={handleReset} disabled={isSaving}>
          <RotateCcw className='mr-2 h-4 w-4' />
          重置为默认
        </Button>
        <Button variant='outline' onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          ) : (
            <Save className='mr-2 h-4 w-4' />
          )}
          立即保存
        </Button>
      </div>

      {/* 媒体占用统计面板 */}
      <MediaStatsPanel />
    </div>
  );
}
