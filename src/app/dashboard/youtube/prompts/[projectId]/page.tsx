'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  ChevronRight,
  Download,
  RefreshCw,
  Save,
  Settings,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  getProject,
  updateProject,
  generatePrompts,
  exportPrompts,
  downloadJson
} from '@/lib/api/youtube';
import {
  loadGlobalCharactersAsync,
  loadProjectMapping,
  saveProjectMapping,
  updateProjectMapping,
  getConfiguredCharactersForProject,
  type GlobalCharacter,
  type ProjectCharacterMapping,
  type PromptIdentifier,
  PROMPT_IDENTIFIERS
} from '@/lib/character-config';
import type { ProjectResponse, Storyboard } from '@/types/youtube';

interface PromptsPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default function PromptsPage({ params }: PromptsPageProps) {
  const { projectId } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [globalCharacters, setGlobalCharacters] = useState<GlobalCharacter[]>(
    []
  );
  const [projectMapping, setProjectMapping] = useState<ProjectCharacterMapping>(
    {}
  );
  const [instruction, setInstruction] = useState('不需要任何改编');
  const [isMappingOpen, setIsMappingOpen] = useState(false);

  // 编辑状态
  const [editedStoryboards, setEditedStoryboards] = useState<Storyboard[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const projectData = await getProject(projectId);
      setProject(projectData);
      setEditedStoryboards(projectData.data.storyboards);

      // 加载全局角色库
      const characters = await loadGlobalCharactersAsync();
      setGlobalCharacters(characters);

      // 加载项目级角色映射
      const mapping = loadProjectMapping(projectId);
      setProjectMapping(mapping);

      // 如果有全局角色但没有配置映射，自动展开映射配置区域
      const hasGlobalChars = characters.some((c) => c.imageData);
      const hasMapping = Object.values(mapping).some((v) => v !== null);
      if (hasGlobalChars && !hasMapping) {
        setIsMappingOpen(true);
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

  // 更新分镜提示词
  const handleUpdateStoryboard = (
    index: number,
    field: keyof Storyboard,
    value: string | string[]
  ) => {
    setEditedStoryboards((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
        is_prompt_edited: true
      };
      return updated;
    });
    setHasChanges(true);
  };

  // 更新项目级角色映射
  const handleMappingChange = (
    identifier: PromptIdentifier,
    globalCharacterId: number | null
  ) => {
    const newMapping = updateProjectMapping(
      projectMapping,
      identifier,
      globalCharacterId
    );
    setProjectMapping(newMapping);
    saveProjectMapping(projectId, newMapping);
  };

  // 获取有图片的全局角色
  const availableGlobalCharacters = globalCharacters.filter((c) => c.imageData);

  // 获取已配置的角色列表
  const configuredCharacters = getConfiguredCharactersForProject(
    projectMapping,
    globalCharacters
  );

  // 保存所有修改
  const handleSaveAll = async () => {
    if (!project) return;

    setIsSaving(true);
    try {
      await updateProject(projectId, {
        storyboards: editedStoryboards
      });

      toast({
        title: '保存成功',
        description: '所有提示词已更新'
      });
      setHasChanges(false);
      loadData();
    } catch (err) {
      toast({
        title: '保存失败',
        description: err instanceof Error ? err.message : '保存提示词失败',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 重新生成提示词
  const handleRegenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generatePrompts(projectId, { instruction });
      if (result.success) {
        toast({
          title: '生成成功',
          description: `已生成 ${result.storyboard_count} 个分镜提示词`
        });
        loadData();
      } else {
        toast({
          title: '生成失败',
          description: result.error || '生成提示词失败',
          variant: 'destructive'
        });
      }
    } catch (err) {
      toast({
        title: '生成失败',
        description: err instanceof Error ? err.message : '生成提示词失败',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 导出JSON
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportPrompts(projectId);
      downloadJson(data, `prompts_${projectId}.json`);

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

  const storyboards = editedStoryboards;

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
              共 {storyboards.length} 个分镜提示词
            </p>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          {/* 生成指令输入 */}
          <div className='flex items-center gap-2'>
            <Label
              htmlFor='instruction-header'
              className='text-sm whitespace-nowrap'
            >
              生成指令:
            </Label>
            <Input
              id='instruction-header'
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder='不需要任何改编'
              className='w-48'
            />
          </div>

          {/* 重新生成按钮 */}
          <Button
            variant='outline'
            onClick={handleRegenerate}
            disabled={isGenerating}
            className='gap-1'
          >
            {isGenerating ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <RefreshCw className='h-4 w-4' />
            )}
            重新生成
          </Button>

          {/* 保存按钮 */}
          {hasChanges && (
            <Button
              onClick={handleSaveAll}
              disabled={isSaving}
              className='gap-1'
            >
              {isSaving ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Save className='h-4 w-4' />
              )}
              保存修改
            </Button>
          )}

          {/* 导出按钮 */}
          <Button
            variant='outline'
            onClick={handleExport}
            disabled={isExporting || storyboards.length === 0}
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

      {/* 项目角色映射配置 */}
      <Card>
        <Collapsible open={isMappingOpen} onOpenChange={setIsMappingOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className='hover:bg-muted/50 cursor-pointer transition-colors'>
              <div className='flex items-center justify-between'>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <Settings className='h-4 w-4' />
                  项目角色映射配置
                </CardTitle>
                <div className='flex items-center gap-2'>
                  <Badge variant='secondary'>
                    {configuredCharacters.length} 个已配置
                  </Badge>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${isMappingOpen ? 'rotate-90' : ''}`}
                  />
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className='pt-0'>
              {availableGlobalCharacters.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    暂无可用角色，请先在{' '}
                    <a
                      href='/dashboard/youtube/settings'
                      className='text-blue-500 hover:underline'
                    >
                      Settings 页面
                    </a>{' '}
                    上传角色参考图
                  </AlertDescription>
                </Alert>
              ) : (
                <div className='space-y-3'>
                  <p className='text-muted-foreground text-sm'>
                    配置提示词中的角色A/B/C对应哪个全局角色，用于图片生成时的角色引用
                  </p>
                  <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                    {PROMPT_IDENTIFIERS.map((identifier) => (
                      <div
                        key={identifier}
                        className='flex items-center gap-3 rounded-lg border p-2'
                      >
                        <div className='bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold'>
                          {identifier}
                        </div>
                        <Select
                          value={
                            projectMapping[identifier]?.toString() || 'none'
                          }
                          onValueChange={(value) =>
                            handleMappingChange(
                              identifier,
                              value === 'none' ? null : parseInt(value, 10)
                            )
                          }
                        >
                          <SelectTrigger className='flex-1'>
                            <SelectValue placeholder='选择对应角色' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='none'>未映射</SelectItem>
                            {availableGlobalCharacters.map((char) => (
                              <SelectItem
                                key={char.id}
                                value={char.id.toString()}
                              >
                                <div className='flex items-center gap-2'>
                                  <img
                                    src={char.imageData}
                                    alt={`角色 ${char.id}`}
                                    className='h-5 w-5 rounded object-cover'
                                  />
                                  角色 {char.id}
                                  {char.name && ` - ${char.name}`}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {projectMapping[identifier] && (
                          <div className='h-8 w-8 shrink-0 overflow-hidden rounded'>
                            {(() => {
                              const char = globalCharacters.find(
                                (c) => c.id === projectMapping[identifier]
                              );
                              return char?.imageData ? (
                                <img
                                  src={char.imageData}
                                  alt=''
                                  className='h-full w-full object-cover'
                                />
                              ) : null;
                            })()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 提示词列表 - 4列网格布局 */}
      {storyboards.length === 0 ? (
        <div className='bg-muted/50 flex flex-col items-center justify-center gap-4 rounded-lg border p-8'>
          <p className='text-muted-foreground'>暂无提示词数据</p>
          <p className='text-muted-foreground text-sm'>请先生成提示词</p>

          {/* 生成指令输入 */}
          <div className='w-full max-w-md space-y-2'>
            <Label htmlFor='instruction'>生成指令</Label>
            <Input
              id='instruction'
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder='输入生成指令，例如：不需要任何改编'
            />
            <p className='text-muted-foreground text-xs'>
              此指令将影响AI生成提示词的风格和内容
            </p>
          </div>

          <Button onClick={handleRegenerate} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : null}
            生成提示词
          </Button>
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {storyboards.map((storyboard, index) => (
            <Card key={index} className='flex flex-col'>
              <CardHeader className='pb-2'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-sm'>
                    分镜 #{storyboard.index + 1}
                  </CardTitle>
                  <div className='flex items-center gap-1'>
                    {storyboard.is_prompt_edited && (
                      <Badge variant='secondary' className='text-[10px]'>
                        已编辑
                      </Badge>
                    )}
                  </div>
                </div>
                {/* 角色引用展示 */}
                {storyboard.character_refs &&
                  storyboard.character_refs.length > 0 && (
                    <div className='mt-1 flex items-center gap-1'>
                      {storyboard.character_refs.map((ref) => {
                        const identifier = ref.startsWith('角色')
                          ? ref.replace('角色', '')
                          : ref;
                        const configured = getConfiguredCharactersForProject(
                          projectMapping,
                          globalCharacters
                        ).find((c) => c.identifier === identifier);
                        return configured?.character?.imageData ? (
                          <img
                            key={identifier}
                            src={configured.character.imageData}
                            alt={`角色 ${identifier}`}
                            className='h-6 w-auto rounded border object-contain'
                            title={
                              configured.character.name || `角色 ${identifier}`
                            }
                          />
                        ) : (
                          <Badge
                            key={identifier}
                            variant='outline'
                            className='text-[10px]'
                          >
                            {ref}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
              </CardHeader>
              <CardContent className='flex-1 space-y-3'>
                {/* 文生图提示词 */}
                <div className='space-y-1'>
                  <Label className='text-xs'>文生图提示词</Label>
                  <Textarea
                    value={storyboard.text_to_image}
                    onChange={(e) =>
                      handleUpdateStoryboard(
                        index,
                        'text_to_image',
                        e.target.value
                      )
                    }
                    rows={3}
                    className='resize-none text-xs'
                    placeholder='输入文生图提示词...'
                  />
                </div>

                {/* 图生视频提示词 */}
                <div className='space-y-1'>
                  <Label className='text-xs'>图生视频提示词</Label>
                  <Textarea
                    value={storyboard.image_to_video}
                    onChange={(e) =>
                      handleUpdateStoryboard(
                        index,
                        'image_to_video',
                        e.target.value
                      )
                    }
                    rows={2}
                    className='resize-none text-xs'
                    placeholder='输入图生视频提示词...'
                  />
                </div>

                {/* 角色引用选择 */}
                <div className='space-y-1'>
                  <div className='flex items-center justify-between'>
                    <Label className='text-xs'>角色引用</Label>
                    <span className='text-muted-foreground text-[10px]'>
                      {storyboard.character_refs?.length || 0}/3
                    </span>
                  </div>
                  <div className='flex flex-wrap items-center gap-1'>
                    {(() => {
                      // 获取已配置的角色（有映射且有图片）
                      const configuredChars = getConfiguredCharactersForProject(
                        projectMapping,
                        globalCharacters
                      );
                      const currentRefs = storyboard.character_refs || [];

                      // 辅助函数：从 "角色A" 或 "A" 提取标识符
                      const extractIdentifier = (ref: string): string => {
                        if (ref.startsWith('角色')) {
                          return ref.replace('角色', '');
                        }
                        return ref;
                      };

                      // 辅助函数：标准化为 "角色X" 格式
                      const toDisplayFormat = (identifier: string): string => {
                        return identifier.startsWith('角色')
                          ? identifier
                          : `角色${identifier}`;
                      };

                      // 获取已选中角色的信息
                      const selectedChars = currentRefs.map((ref) => {
                        const id = extractIdentifier(ref);
                        const configured = configuredChars.find(
                          (c) => c.identifier === id
                        );
                        return {
                          ref,
                          identifier: id,
                          character: configured?.character
                        };
                      });

                      // 获取可添加的角色（已配置但未选中）
                      const availableToAdd = configuredChars.filter(
                        (c) =>
                          !currentRefs.some(
                            (ref) => extractIdentifier(ref) === c.identifier
                          )
                      );

                      if (configuredChars.length === 0) {
                        return (
                          <p className='text-muted-foreground text-[10px]'>
                            请先配置角色映射
                          </p>
                        );
                      }

                      return (
                        <>
                          {/* 已选中的角色 */}
                          {selectedChars.map(
                            ({ ref, identifier, character }) => (
                              <Badge
                                key={ref}
                                variant='secondary'
                                className='hover:bg-destructive/20 cursor-pointer gap-0.5 px-1.5 py-0.5 text-[10px]'
                                onClick={() => {
                                  const newRefs = currentRefs.filter(
                                    (r) => r !== ref
                                  );
                                  handleUpdateStoryboard(
                                    index,
                                    'character_refs',
                                    newRefs
                                  );
                                }}
                              >
                                {character?.imageData && (
                                  <img
                                    src={character.imageData}
                                    alt={identifier}
                                    className='h-3 w-3 rounded object-cover'
                                  />
                                )}
                                {identifier}
                                <X className='h-2.5 w-2.5' />
                              </Badge>
                            )
                          )}

                          {/* 添加角色按钮 */}
                          {currentRefs.length < 3 &&
                            availableToAdd.length > 0 && (
                              <Select
                                value=''
                                onValueChange={(value) => {
                                  if (value && currentRefs.length < 3) {
                                    const newRefs = [
                                      ...currentRefs,
                                      toDisplayFormat(value)
                                    ];
                                    handleUpdateStoryboard(
                                      index,
                                      'character_refs',
                                      newRefs
                                    );
                                  }
                                }}
                              >
                                <SelectTrigger className='h-5 w-auto px-1.5 text-[10px]'>
                                  <span className='text-muted-foreground'>
                                    + 添加
                                  </span>
                                </SelectTrigger>
                                <SelectContent>
                                  {availableToAdd.map(
                                    ({ identifier, character }) => (
                                      <SelectItem
                                        key={identifier}
                                        value={identifier}
                                      >
                                        <div className='flex items-center gap-1 text-xs'>
                                          {character.imageData && (
                                            <img
                                              src={character.imageData}
                                              alt={identifier}
                                              className='h-4 w-4 rounded object-cover'
                                            />
                                          )}
                                          {identifier}
                                        </div>
                                      </SelectItem>
                                    )
                                  )}
                                </SelectContent>
                              </Select>
                            )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 底部操作栏 */}
      {storyboards.length > 0 && (
        <div className='sticky bottom-4 flex justify-between'>
          <div className='flex gap-2'>
            {hasChanges && (
              <Button
                onClick={handleSaveAll}
                disabled={isSaving}
                className='gap-1 shadow-lg'
              >
                {isSaving ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Save className='h-4 w-4' />
                )}
                保存修改
              </Button>
            )}
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
          </div>
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
    </div>
  );
}
