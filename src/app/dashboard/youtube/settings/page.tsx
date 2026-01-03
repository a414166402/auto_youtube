'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Save,
  Loader2,
  RotateCcw,
  Users,
  AlertCircle,
  ImageIcon,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GlobalCharacterCard } from '@/components/youtube/global-character-card';
import {
  loadGlobalCharactersAsync,
  saveGlobalCharactersAsync,
  updateGlobalCharacterName,
  updateGlobalCharacterImage,
  fileToBase64,
  DEFAULT_GLOBAL_CHARACTERS,
  type GlobalCharacter
} from '@/lib/character-config';

export default function SettingsPage() {
  const [characters, setCharacters] = useState<GlobalCharacter[]>(
    DEFAULT_GLOBAL_CHARACTERS
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 从 IndexedDB 加载全局角色库
  useEffect(() => {
    loadGlobalCharactersAsync()
      .then((loadedCharacters) => {
        setCharacters(loadedCharacters);
      })
      .catch((error) => {
        console.error('Failed to load characters:', error);
        toast.error('加载角色库失败');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // 自动保存函数（带防抖）
  const autoSave = useCallback((newCharacters: GlobalCharacter[]) => {
    // 清除之前的定时器
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // 设置新的定时器，500ms 后保存
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveGlobalCharactersAsync(newCharacters);
        setLastSaved(new Date());
      } catch (error) {
        toast.error('自动保存失败');
        console.error('Failed to auto-save global characters:', error);
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

  // 更新角色名称（自动保存）
  const handleNameChange = useCallback(
    (id: number, name: string) => {
      setCharacters((prev) => {
        const newCharacters = updateGlobalCharacterName(prev, id, name);
        autoSave(newCharacters);
        return newCharacters;
      });
    },
    [autoSave]
  );

  // 上传角色图片（存储为 Base64，自动保存）
  const handleImageUpload = useCallback(
    async (id: number, file: File) => {
      try {
        const base64Data = await fileToBase64(file);
        const newCharacters = updateGlobalCharacterImage(
          characters,
          id,
          base64Data
        );
        setCharacters(newCharacters);
        // 图片上传立即保存
        await saveGlobalCharactersAsync(newCharacters);
        setLastSaved(new Date());
        toast.success(`角色 ${id} 图片已保存`);
      } catch (error) {
        toast.error(`角色图片保存失败`);
        console.error('Failed to upload character image:', error);
      }
    },
    [characters]
  );

  // 删除角色图片（自动保存）
  const handleImageRemove = useCallback(
    async (id: number) => {
      try {
        const newCharacters = updateGlobalCharacterImage(
          characters,
          id,
          undefined
        );
        setCharacters(newCharacters);
        // 删除图片立即保存
        await saveGlobalCharactersAsync(newCharacters);
        setLastSaved(new Date());
        toast.info(`角色 ${id} 图片已删除`);
      } catch (error) {
        toast.error('删除图片失败');
        console.error('Failed to remove character image:', error);
      }
    },
    [characters]
  );

  // 手动保存（立即保存）
  const handleSave = useCallback(async () => {
    // 清除防抖定时器
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSaving(true);
    try {
      await saveGlobalCharactersAsync(characters);
      setLastSaved(new Date());
      toast.success('角色库已保存');
    } catch (error) {
      toast.error('保存角色库失败');
      console.error('Failed to save global characters:', error);
    } finally {
      setIsSaving(false);
    }
  }, [characters]);

  // 重置为默认配置
  const handleReset = useCallback(async () => {
    try {
      const defaultCharacters = [...DEFAULT_GLOBAL_CHARACTERS];
      setCharacters(defaultCharacters);
      await saveGlobalCharactersAsync(defaultCharacters);
      setLastSaved(new Date());
      toast.info('已重置为默认配置并保存');
    } catch (error) {
      toast.error('重置失败');
      console.error('Failed to reset characters:', error);
    }
  }, []);

  // 统计有图片的角色数量
  const configuredCount = characters.filter((c) => c.imageData).length;

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
            <h1 className='flex items-center gap-2 text-2xl font-bold'>
              <Users className='h-6 w-6' />
              全局角色库
            </h1>
            <p className='text-muted-foreground text-sm'>
              管理全局角色图片和名称，所有项目共享此角色库
            </p>
          </div>
        </div>
      </div>

      {/* 说明信息 */}
      <Alert>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          <strong>全局角色库</strong>
          ：在此上传角色参考图和设置名称，所有项目共享。
          <br />
          <strong>项目级映射</strong>
          ：在各项目的提示词编辑页面配置&ldquo;角色A/B/C对应哪个全局角色&rdquo;。
          <br />
          配置数据存储在浏览器本地，清除浏览器数据会丢失配置。
        </AlertDescription>
      </Alert>

      {/* 配置统计 */}
      <div className='text-muted-foreground flex items-center justify-between text-sm'>
        <div className='flex items-center gap-2'>
          <ImageIcon className='h-4 w-4' />
          已配置参考图: {configuredCount}/6 个角色
        </div>
        {lastSaved && (
          <div className='flex items-center gap-1 text-xs text-green-600'>
            <Check className='h-3 w-3' />
            已自动保存
          </div>
        )}
      </div>

      {/* 角色库列表 */}
      {isLoading ? (
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
        </div>
      ) : (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {characters.map((character) => (
            <GlobalCharacterCard
              key={character.id}
              character={character}
              onNameChange={handleNameChange}
              onImageUpload={handleImageUpload}
              onImageRemove={handleImageRemove}
            />
          ))}
        </div>
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
    </div>
  );
}
