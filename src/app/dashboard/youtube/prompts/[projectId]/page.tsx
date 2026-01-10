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
  X,
  Users,
  Package,
  Image
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
  getProject,
  updateProject,
  generatePrompts,
  exportPrompts,
  downloadJson
} from '@/lib/api/youtube';
import {
  loadGlobalSubjectLibraryAsync,
  loadProjectSubjectMapping,
  saveProjectSubjectMapping,
  updateProjectSubjectMapping,
  getSubjectForRef,
  extractSubjectRefs,
  parseFullRef,
  generateFullRef,
  type GlobalSubjectLibrary,
  type ProjectSubjectMapping,
  type SubjectType,
  SUBJECT_TYPE_LABELS,
  SUBJECT_TYPE_ICONS,
  DEFAULT_SUBJECT_LIBRARY
} from '@/lib/subject-config';
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
  const [subjectLibrary, setSubjectLibrary] = useState<GlobalSubjectLibrary>(
    DEFAULT_SUBJECT_LIBRARY
  );
  const [projectMapping, setProjectMapping] = useState<ProjectSubjectMapping>(
    {}
  );
  const [instruction, setInstruction] = useState('不需要任何改编');
  const [isMappingOpen, setIsMappingOpen] = useState(false);
  const [mappingTab, setMappingTab] = useState<SubjectType>('character');

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

      // 加载全局主体库
      const library = await loadGlobalSubjectLibraryAsync();
      setSubjectLibrary(library);

      // 加载项目级主体映射
      const mapping = loadProjectSubjectMapping(projectId);
      setProjectMapping(mapping);

      // 如果有全局主体但没有配置映射，自动展开映射配置区域
      const hasGlobalSubjects = [
        ...library.character,
        ...library.object,
        ...library.scene
      ].some((s) => s.imageData);
      const hasMapping = Object.values(mapping).some((v) => v !== null);
      if (hasGlobalSubjects && !hasMapping) {
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

  // 更新项目级主体映射
  const handleMappingChange = (fullRef: string, subjectId: string | null) => {
    const newMapping = updateProjectSubjectMapping(
      projectMapping,
      fullRef,
      subjectId
    );
    setProjectMapping(newMapping);
    saveProjectSubjectMapping(projectId, newMapping);
  };

  // 获取特定类型有图片的主体
  const getAvailableSubjects = (type: SubjectType) => {
    return subjectLibrary[type].filter((s) => s.imageData);
  };

  // 获取所有已配置的主体数量
  const getConfiguredCount = () => {
    return Object.values(projectMapping).filter((v) => v !== null).length;
  };

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

  // Tab图标映射
  const tabIcons: Record<SubjectType, React.ReactNode> = {
    character: <Users className='h-4 w-4' />,
    object: <Package className='h-4 w-4' />,
    scene: <Image className='h-4 w-4' />
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

      {/* 项目主体映射配置 */}
      <Card>
        <Collapsible open={isMappingOpen} onOpenChange={setIsMappingOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className='hover:bg-muted/50 cursor-pointer transition-colors'>
              <div className='flex items-center justify-between'>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <Settings className='h-4 w-4' />
                  项目主体映射配置
                </CardTitle>
                <div className='flex items-center gap-2'>
                  <Badge variant='secondary'>
                    {getConfiguredCount()} 个已配置
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
              <Tabs
                value={mappingTab}
                onValueChange={(v) => setMappingTab(v as SubjectType)}
              >
                <TabsList className='mb-4'>
                  <TabsTrigger value='character' className='gap-1'>
                    {tabIcons.character}
                    角色 ({subjectLibrary.character.length})
                  </TabsTrigger>
                  <TabsTrigger value='object' className='gap-1'>
                    {tabIcons.object}
                    物品 ({subjectLibrary.object.length})
                  </TabsTrigger>
                  <TabsTrigger value='scene' className='gap-1'>
                    {tabIcons.scene}
                    场景 ({subjectLibrary.scene.length})
                  </TabsTrigger>
                </TabsList>

                {(['character', 'object', 'scene'] as SubjectType[]).map(
                  (type) => {
                    const subjects = subjectLibrary[type];
                    const availableSubjects = getAvailableSubjects(type);
                    const typeLabel = SUBJECT_TYPE_LABELS[type];

                    return (
                      <TabsContent key={type} value={type}>
                        {subjects.length === 0 ? (
                          <Alert>
                            <AlertDescription>
                              暂无{typeLabel}，请先在{' '}
                              <a
                                href='/dashboard/youtube/settings'
                                className='text-blue-500 hover:underline'
                              >
                                Settings 页面
                              </a>{' '}
                              添加{typeLabel}
                            </AlertDescription>
                          </Alert>
                        ) : availableSubjects.length === 0 ? (
                          <Alert>
                            <AlertDescription>
                              {typeLabel}库中没有已配置图片的{typeLabel}，请先在{' '}
                              <a
                                href='/dashboard/youtube/settings'
                                className='text-blue-500 hover:underline'
                              >
                                Settings 页面
                              </a>{' '}
                              上传参考图
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <div className='space-y-3'>
                            <p className='text-muted-foreground text-sm'>
                              配置提示词中的{typeLabel}A/B/C对应哪个全局
                              {typeLabel}，用于图片生成时的引用
                            </p>
                            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                              {subjects.map((subject) => {
                                const fullRef = generateFullRef(
                                  type,
                                  subject.identifier
                                );
                                const currentMapping = projectMapping[fullRef];

                                return (
                                  <div
                                    key={subject.id}
                                    className='flex items-center gap-3 rounded-lg border p-2'
                                  >
                                    <div className='bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold'>
                                      {subject.identifier}
                                    </div>
                                    <Select
                                      value={currentMapping || 'none'}
                                      onValueChange={(value) =>
                                        handleMappingChange(
                                          fullRef,
                                          value === 'none' ? null : value
                                        )
                                      }
                                    >
                                      <SelectTrigger className='flex-1'>
                                        <SelectValue
                                          placeholder={`选择对应${typeLabel}`}
                                        />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value='none'>
                                          未映射
                                        </SelectItem>
                                        {availableSubjects.map((s) => (
                                          <SelectItem key={s.id} value={s.id}>
                                            <div className='flex items-center gap-2'>
                                              <img
                                                src={s.imageData}
                                                alt={`${typeLabel} ${s.identifier}`}
                                                className='h-5 w-5 rounded object-cover'
                                              />
                                              {typeLabel} {s.identifier}
                                              {s.name && ` - ${s.name}`}
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {currentMapping && (
                                      <div className='h-8 w-8 shrink-0 overflow-hidden rounded'>
                                        {(() => {
                                          const mapped = availableSubjects.find(
                                            (s) => s.id === currentMapping
                                          );
                                          return mapped?.imageData ? (
                                            <img
                                              src={mapped.imageData}
                                              alt=''
                                              className='h-full w-full object-cover'
                                            />
                                          ) : null;
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </TabsContent>
                    );
                  }
                )}
              </Tabs>
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
            <StoryboardPromptCard
              key={index}
              storyboard={storyboard}
              index={index}
              subjectLibrary={subjectLibrary}
              projectMapping={projectMapping}
              onUpdate={handleUpdateStoryboard}
            />
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

// 分镜提示词卡片组件
interface StoryboardPromptCardProps {
  storyboard: Storyboard;
  index: number;
  subjectLibrary: GlobalSubjectLibrary;
  projectMapping: ProjectSubjectMapping;
  onUpdate: (
    index: number,
    field: keyof Storyboard,
    value: string | string[]
  ) => void;
}

function StoryboardPromptCard({
  storyboard,
  index,
  subjectLibrary,
  projectMapping,
  onUpdate
}: StoryboardPromptCardProps) {
  // 从提示词中提取所有主体引用
  const allRefs = extractSubjectRefs(storyboard.text_to_image || '');
  const currentRefs = storyboard.character_refs || [];

  // 获取所有已配置图片的主体（用于手动添加）
  const getAllConfiguredSubjects = () => {
    const result: {
      fullRef: string;
      subject: (typeof subjectLibrary.character)[0];
    }[] = [];

    for (const type of ['character', 'object', 'scene'] as SubjectType[]) {
      for (const subject of subjectLibrary[type]) {
        if (subject.imageData) {
          const fullRef = generateFullRef(type, subject.identifier);
          // 检查是否有映射
          if (projectMapping[fullRef]) {
            result.push({ fullRef, subject });
          }
        }
      }
    }

    return result;
  };

  const configuredSubjects = getAllConfiguredSubjects();

  // 获取可添加的主体（已配置但未选中）
  const availableToAdd = configuredSubjects.filter(
    ({ fullRef }) => !currentRefs.includes(fullRef)
  );

  // 获取主体的显示信息
  const getSubjectDisplay = (fullRef: string) => {
    const subject = getSubjectForRef(fullRef, projectMapping, subjectLibrary);
    return subject;
  };

  return (
    <Card className='flex flex-col'>
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
        {/* 主体引用展示 */}
        {currentRefs.length > 0 && (
          <div className='mt-1 flex flex-wrap items-center gap-1'>
            {currentRefs.map((ref, refIndex) => {
              const subject = getSubjectDisplay(ref);
              const parsed = parseFullRef(ref);
              const icon = parsed ? SUBJECT_TYPE_ICONS[parsed.type] : '❓';
              // 根据主体类型设置不同的边框色
              const typeBorderClass = parsed
                ? {
                    character: 'border-green-500',
                    object: 'border-blue-500',
                    scene: 'border-red-500'
                  }[parsed.type]
                : '';

              return subject?.imageData ? (
                <img
                  key={`${refIndex}-${ref}`}
                  src={subject.imageData}
                  alt={`${ref} (第${refIndex + 1}个)`}
                  className={`h-6 w-auto rounded border-2 object-contain ${typeBorderClass}`}
                  title={`${subject.name || ref} (上传顺序: ${refIndex + 1})`}
                />
              ) : (
                <Badge
                  key={`${refIndex}-${ref}`}
                  variant='outline'
                  className={`text-[10px] ${
                    parsed
                      ? {
                          character: 'border-green-500 text-green-600',
                          object: 'border-blue-500 text-blue-600',
                          scene: 'border-red-500 text-red-600'
                        }[parsed.type]
                      : ''
                  }`}
                >
                  {icon} {ref}
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
            onChange={(e) => onUpdate(index, 'text_to_image', e.target.value)}
            rows={3}
            className='resize-none text-xs'
            placeholder='输入文生图提示词...'
          />
          {/* 显示提示词中检测到的主体引用 */}
          {allRefs.length > 0 && (
            <div className='flex flex-wrap gap-1'>
              <span className='text-muted-foreground text-[10px]'>检测到:</span>
              {allRefs.map((ref) => {
                const parsed = parseFullRef(ref);
                const icon = parsed ? SUBJECT_TYPE_ICONS[parsed.type] : '❓';
                const isMapped = !!projectMapping[ref];
                // 根据主体类型设置不同的背景色
                const typeColorClass = parsed
                  ? {
                      character: isMapped
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'border-green-500 text-green-600',
                      object: isMapped
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'border-blue-500 text-blue-600',
                      scene: isMapped
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'border-red-500 text-red-600'
                    }[parsed.type]
                  : '';
                return (
                  <Badge
                    key={ref}
                    variant='outline'
                    className={`text-[10px] ${typeColorClass}`}
                  >
                    {icon} {ref}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* 图生视频提示词 */}
        <div className='space-y-1'>
          <Label className='text-xs'>图生视频提示词</Label>
          <Textarea
            value={storyboard.image_to_video}
            onChange={(e) => onUpdate(index, 'image_to_video', e.target.value)}
            rows={2}
            className='resize-none text-xs'
            placeholder='输入图生视频提示词...'
          />
        </div>

        {/* 主体引用选择 */}
        <div className='space-y-1'>
          <div className='flex items-center justify-between'>
            <Label className='text-xs'>主体引用</Label>
            <span className='text-muted-foreground text-[10px]'>
              {currentRefs.length}/3
            </span>
          </div>
          <div className='flex flex-wrap items-center gap-1'>
            {configuredSubjects.length === 0 ? (
              <p className='text-muted-foreground text-[10px]'>
                请先配置主体映射
              </p>
            ) : (
              <>
                {/* 已选中的主体 */}
                {currentRefs.map((ref) => {
                  const subject = getSubjectDisplay(ref);
                  const parsed = parseFullRef(ref);
                  const icon = parsed ? SUBJECT_TYPE_ICONS[parsed.type] : '❓';
                  // 根据主体类型设置不同的背景色
                  const typeColorClass = parsed
                    ? {
                        character: 'bg-green-500 text-white hover:bg-green-600',
                        object: 'bg-blue-500 text-white hover:bg-blue-600',
                        scene: 'bg-red-500 text-white hover:bg-red-600'
                      }[parsed.type]
                    : '';

                  return (
                    <Badge
                      key={ref}
                      variant='secondary'
                      className={`cursor-pointer gap-0.5 px-1.5 py-0.5 text-[10px] ${typeColorClass}`}
                      onClick={() => {
                        const newRefs = currentRefs.filter((r) => r !== ref);
                        onUpdate(index, 'character_refs', newRefs);
                      }}
                    >
                      {subject?.imageData && (
                        <img
                          src={subject.imageData}
                          alt={ref}
                          className='h-3 w-3 rounded object-cover'
                        />
                      )}
                      {icon} {ref}
                      <X className='h-2.5 w-2.5' />
                    </Badge>
                  );
                })}

                {/* 添加主体按钮 */}
                {currentRefs.length < 3 && availableToAdd.length > 0 && (
                  <Select
                    value=''
                    onValueChange={(value) => {
                      if (value && currentRefs.length < 3) {
                        const newRefs = [...currentRefs, value];
                        onUpdate(index, 'character_refs', newRefs);
                      }
                    }}
                  >
                    <SelectTrigger className='h-5 w-auto px-1.5 text-[10px]'>
                      <span className='text-muted-foreground'>+ 添加</span>
                    </SelectTrigger>
                    <SelectContent>
                      {availableToAdd.map(({ fullRef, subject }) => {
                        const parsed = parseFullRef(fullRef);
                        const icon = parsed
                          ? SUBJECT_TYPE_ICONS[parsed.type]
                          : '❓';

                        return (
                          <SelectItem key={fullRef} value={fullRef}>
                            <div className='flex items-center gap-1 text-xs'>
                              {subject.imageData && (
                                <img
                                  src={subject.imageData}
                                  alt={fullRef}
                                  className='h-4 w-4 rounded object-cover'
                                />
                              )}
                              {icon} {fullRef}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
