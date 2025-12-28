'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  ChevronRight,
  Download,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PromptCard } from '@/components/youtube/prompt-card';
import { PromptEditDialog } from '@/components/youtube/prompt-edit-dialog';
import { PromptHistoryDialog } from '@/components/youtube/prompt-history';
import { useToast } from '@/components/ui/use-toast';
import {
  getProject,
  getPrompts,
  getCharacterMappings,
  updatePrompt,
  regeneratePrompt,
  generatePrompts,
  exportPrompts
} from '@/lib/api/youtube';
import type {
  VideoProject,
  Prompt,
  CharacterMapping,
  RegeneratePromptRequest
} from '@/types/youtube';

interface PromptsPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default function PromptsPage({ params }: PromptsPageProps) {
  const { projectId } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [project, setProject] = useState<VideoProject | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [characterMappings, setCharacterMappings] = useState<
    CharacterMapping[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState<'v1' | 'v2'>('v1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // 编辑对话框状态
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);

  // 历史对话框状态
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyPrompt, setHistoryPrompt] = useState<Prompt | null>(null);

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [projectData, promptsData, mappingsData] = await Promise.all([
        getProject(projectId),
        getPrompts(projectId),
        getCharacterMappings(projectId).catch(() => []) // 角色映射可能不存在
      ]);
      setProject(projectData);
      setPrompts(promptsData.data);
      setCharacterMappings(mappingsData);

      // 设置当前版本
      if (projectData.prompt_version) {
        setVersion(projectData.prompt_version);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 打开编辑对话框
  const handleEdit = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setEditDialogOpen(true);
  };

  // 打开历史对话框
  const handleViewHistory = (prompt: Prompt) => {
    setHistoryPrompt(prompt);
    setHistoryDialogOpen(true);
  };

  // 保存提示词修改
  const handleSavePrompt = async (
    id: string,
    textToImage: string,
    imageToVideo: string,
    characterRefs?: string[]
  ) => {
    try {
      await updatePrompt(id, {
        text_to_image: textToImage,
        image_to_video: imageToVideo,
        character_refs: characterRefs
      });

      // 更新本地状态
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                text_to_image: textToImage,
                image_to_video: imageToVideo,
                character_refs: characterRefs,
                is_edited: true
              }
            : p
        )
      );

      toast({
        title: '保存成功',
        description: '提示词已更新'
      });
    } catch (err) {
      toast({
        title: '保存失败',
        description: err instanceof Error ? err.message : '保存提示词失败',
        variant: 'destructive'
      });
      throw err;
    }
  };

  // AI重新生成提示词
  const handleRegenerate = async (
    id: string,
    data: RegeneratePromptRequest
  ) => {
    try {
      await regeneratePrompt(id, data);

      toast({
        title: '重新生成中',
        description: 'AI正在重新生成提示词，请稍候...'
      });

      // 重新加载数据
      await loadData();
    } catch (err) {
      toast({
        title: '重新生成失败',
        description: err instanceof Error ? err.message : '重新生成提示词失败',
        variant: 'destructive'
      });
      throw err;
    }
  };

  // 切换版本并重新生成
  const handleVersionChange = async (newVersion: 'v1' | 'v2') => {
    if (newVersion === version) return;

    setVersion(newVersion);
    setIsGenerating(true);

    try {
      await generatePrompts(projectId, {
        version: newVersion,
        include_storyboard_descriptions: true
      });

      toast({
        title: '生成中',
        description: `正在使用 ${newVersion.toUpperCase()} 模板重新生成提示词...`
      });

      // 等待一段时间后重新加载
      setTimeout(() => {
        loadData();
        setIsGenerating(false);
      }, 2000);
    } catch (err) {
      toast({
        title: '生成失败',
        description: err instanceof Error ? err.message : '生成提示词失败',
        variant: 'destructive'
      });
      setIsGenerating(false);
    }
  };

  // 导出JSON
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportPrompts(projectId);

      // 创建并下载JSON文件
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prompts_${projectId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: '导出成功',
        description: 'JSON文件已下载'
      });
    } catch (err) {
      toast({
        title: '导出失败',
        description: err instanceof Error ? err.message : '导出JSON失败',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  // 导航到下一步 - 图片生成
  const handleNextStep = () => {
    router.push(`/dashboard/youtube/generate/${projectId}`);
  };

  if (loading) {
    return (
      <div className='container mx-auto'>
        <div className='flex h-64 items-center justify-center'>
          <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className='container mx-auto'>
        <div className='flex h-64 flex-col items-center justify-center gap-4'>
          <p className='text-destructive'>{error || '项目不存在'}</p>
          <Button
            variant='outline'
            onClick={() => router.push('/dashboard/youtube/projects')}
          >
            返回项目列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto space-y-6'>
      {/* 头部 */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() =>
              router.push(`/dashboard/youtube/project/${projectId}`)
            }
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div>
            <h1 className='text-2xl font-bold'>提示词编辑</h1>
            <p className='text-muted-foreground text-sm'>
              共 {prompts.length} 个微创新分镜提示词
            </p>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          {/* 版本切换 */}
          <Tabs
            value={version}
            onValueChange={(v) => handleVersionChange(v as 'v1' | 'v2')}
          >
            <TabsList>
              <TabsTrigger value='v1' disabled={isGenerating}>
                V1
              </TabsTrigger>
              <TabsTrigger value='v2' disabled={isGenerating}>
                V2
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {isGenerating && (
            <div className='text-muted-foreground flex items-center gap-2 text-sm'>
              <RefreshCw className='h-4 w-4 animate-spin' />
              生成中...
            </div>
          )}

          {/* 导出按钮 */}
          <Button
            variant='outline'
            onClick={handleExport}
            disabled={isExporting || prompts.length === 0}
            className='gap-1'
          >
            {isExporting ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Download className='h-4 w-4' />
            )}
            导出JSON
          </Button>

          {/* 下一步按钮 */}
          <Button onClick={handleNextStep} className='gap-1'>
            继续下一步: 图片生成
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* 提示词列表 - 不显示分镜缩略图 */}
      {prompts.length === 0 ? (
        <div className='bg-muted/50 flex h-64 flex-col items-center justify-center gap-4 rounded-lg border'>
          <p className='text-muted-foreground'>暂无提示词数据</p>
          <p className='text-muted-foreground text-sm'>
            请先在项目详情页生成提示词
          </p>
          <Button
            variant='outline'
            onClick={() =>
              router.push(`/dashboard/youtube/project/${projectId}`)
            }
          >
            返回项目详情
          </Button>
        </div>
      ) : (
        <div className='space-y-4'>
          {prompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              characterMappings={characterMappings}
              onEdit={handleEdit}
              onViewHistory={handleViewHistory}
            />
          ))}
        </div>
      )}

      {/* 底部操作栏 */}
      {prompts.length > 0 && (
        <div className='sticky bottom-4 flex justify-between'>
          <Button
            variant='outline'
            onClick={handleExport}
            disabled={isExporting}
            className='gap-1 shadow-lg'
          >
            {isExporting ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Download className='h-4 w-4' />
            )}
            导出JSON
          </Button>
          <Button
            onClick={handleNextStep}
            size='lg'
            className='gap-1 shadow-lg'
          >
            继续下一步: 图片生成
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      )}

      {/* 编辑对话框 */}
      <PromptEditDialog
        prompt={selectedPrompt}
        characterMappings={characterMappings}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSavePrompt}
        onRegenerate={handleRegenerate}
      />

      {/* 历史对话框 */}
      <PromptHistoryDialog
        prompt={historyPrompt}
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
      />
    </div>
  );
}
