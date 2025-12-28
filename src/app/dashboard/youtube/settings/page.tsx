'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Save, Loader2, RotateCcw, Users } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { CharacterMappingCard } from '@/components/youtube/character-mapping-card';
import {
  getProjects,
  getCharacterMappings,
  updateCharacterMappings,
  uploadCharacterImage
} from '@/lib/api/youtube';
import type { VideoProject, CharacterMapping } from '@/types/youtube';

// 默认角色映射
const DEFAULT_MAPPINGS = [
  { number: 1, identifier: 'A', name: '' },
  { number: 2, identifier: 'B', name: '' },
  { number: 3, identifier: 'C', name: '' },
  { number: 4, identifier: 'D', name: '' }
];

export default function SettingsPage() {
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [mappings, setMappings] = useState<CharacterMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 加载项目列表
  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await getProjects({ page_size: 100 });
        setProjects(response.data);
        if (response.data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(response.data[0].id);
        }
      } catch (error) {
        toast.error('加载项目列表失败');
        console.error('Failed to load projects:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadProjects();
  }, []);

  // 加载角色映射
  const loadMappings = useCallback(async (projectId: string) => {
    if (!projectId) return;

    setIsLoading(true);
    try {
      const data = await getCharacterMappings(projectId);
      if (data.length > 0) {
        setMappings(data);
      } else {
        // 如果没有映射，使用默认映射
        setMappings(
          DEFAULT_MAPPINGS.map((m, index) => ({
            id: `temp_${index}`,
            project_id: projectId,
            ...m
          }))
        );
      }
      setHasChanges(false);
    } catch (error) {
      toast.error('加载角色映射失败');
      console.error('Failed to load character mappings:', error);
      // 使用默认映射
      setMappings(
        DEFAULT_MAPPINGS.map((m, index) => ({
          id: `temp_${index}`,
          project_id: projectId,
          ...m
        }))
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadMappings(selectedProjectId);
    }
  }, [selectedProjectId, loadMappings]);

  // 更新映射名称
  const handleNameChange = (identifier: string, name: string) => {
    setMappings((prev) =>
      prev.map((m) => (m.identifier === identifier ? { ...m, name } : m))
    );
    setHasChanges(true);
  };

  // 上传角色图片
  const handleImageUpload = async (identifier: string, file: File) => {
    if (!selectedProjectId) return;

    try {
      const updatedMapping = await uploadCharacterImage(
        selectedProjectId,
        identifier,
        file
      );
      setMappings((prev) =>
        prev.map((m) =>
          m.identifier === identifier
            ? { ...m, reference_image_url: updatedMapping.reference_image_url }
            : m
        )
      );
      toast.success(`角色 ${identifier} 图片上传成功`);
    } catch (error) {
      toast.error(`角色 ${identifier} 图片上传失败`);
      console.error('Failed to upload character image:', error);
    }
  };

  // 保存映射配置
  const handleSave = async () => {
    if (!selectedProjectId || !hasChanges) return;

    setIsSaving(true);
    try {
      await updateCharacterMappings(selectedProjectId, {
        mappings: mappings.map((m) => ({
          number: m.number,
          identifier: m.identifier,
          name: m.name
        }))
      });
      toast.success('角色映射保存成功');
      setHasChanges(false);
    } catch (error) {
      toast.error('保存角色映射失败');
      console.error('Failed to save character mappings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 重置为默认映射
  const handleReset = () => {
    setMappings(
      DEFAULT_MAPPINGS.map((m, index) => ({
        id: `temp_${index}`,
        project_id: selectedProjectId,
        ...m,
        reference_image_url: undefined
      }))
    );
    setHasChanges(true);
    toast.info('已重置为默认映射');
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
            <h1 className='flex items-center gap-2 text-2xl font-bold'>
              <Users className='h-6 w-6' />
              角色映射配置
            </h1>
            <p className='text-muted-foreground text-sm'>
              配置角色编号与标识的映射关系，上传角色参考图
            </p>
          </div>
        </div>
      </div>

      {/* 项目选择 */}
      <div className='flex items-center gap-4'>
        <label className='text-sm font-medium'>当前项目:</label>
        <Select
          value={selectedProjectId}
          onValueChange={setSelectedProjectId}
          disabled={isLoading || projects.length === 0}
        >
          <SelectTrigger className='w-[300px]'>
            <SelectValue placeholder='选择项目' />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 角色映射列表 */}
      {isLoading ? (
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
        </div>
      ) : projects.length === 0 ? (
        <div className='py-12 text-center'>
          <p className='text-muted-foreground'>暂无项目，请先创建项目</p>
          <Link href='/dashboard/youtube/projects'>
            <Button className='mt-4'>前往创建项目</Button>
          </Link>
        </div>
      ) : (
        <div className='space-y-4'>
          {mappings.map((mapping) => (
            <CharacterMappingCard
              key={mapping.identifier}
              mapping={mapping}
              onNameChange={handleNameChange}
              onImageUpload={handleImageUpload}
            />
          ))}
        </div>
      )}

      {/* 底部操作按钮 */}
      {projects.length > 0 && (
        <div className='flex items-center justify-between border-t pt-4'>
          <Button variant='outline' onClick={handleReset} disabled={isSaving}>
            <RotateCcw className='mr-2 h-4 w-4' />
            重置为默认
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <Save className='mr-2 h-4 w-4' />
            )}
            保存配置
          </Button>
        </div>
      )}
    </div>
  );
}
