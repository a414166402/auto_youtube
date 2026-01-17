'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  Sparkles,
  User,
  X,
  AlertCircle,
  Settings
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  loadGlobalCharactersAsync,
  loadProjectMapping,
  saveProjectMapping,
  updateProjectMapping,
  getConfiguredCharactersForProject,
  PROMPT_IDENTIFIERS,
  DEFAULT_GLOBAL_CHARACTERS,
  type GlobalCharacter,
  type ProjectCharacterMapping,
  type PromptIdentifier
} from '@/lib/character-config';
import type { Prompt, RegeneratePromptRequest } from '@/types/youtube';

export interface PromptEditDialogProps {
  prompt: Prompt | null;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    id: string,
    storyboardSummary: string,
    textToImage: string,
    imageToVideo: string,
    characterRefs?: string[]
  ) => Promise<void>;
  onRegenerate: (id: string, data: RegeneratePromptRequest) => Promise<void>;
}

export function PromptEditDialog({
  prompt,
  projectId,
  open,
  onOpenChange,
  onSave,
  onRegenerate
}: PromptEditDialogProps) {
  const [storyboardSummary, setStoryboardSummary] = useState('');
  const [textToImage, setTextToImage] = useState('');
  const [imageToVideo, setImageToVideo] = useState('');
  const [selectedCharacterRefs, setSelectedCharacterRefs] = useState<string[]>(
    []
  );
  const [instruction, setInstruction] = useState('');
  const [regenerateType, setRegenerateType] = useState<
    'text_to_image' | 'image_to_video' | 'both'
  >('both');
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isMappingOpen, setIsMappingOpen] = useState(false);

  // 全局角色库和项目级映射
  const [globalCharacters, setGlobalCharacters] = useState<GlobalCharacter[]>(
    DEFAULT_GLOBAL_CHARACTERS
  );
  const [projectMapping, setProjectMapping] = useState<ProjectCharacterMapping>(
    {}
  );

  // 加载配置
  useEffect(() => {
    if (open && projectId) {
      loadGlobalCharactersAsync().then(setGlobalCharacters);
      setProjectMapping(loadProjectMapping(projectId));
    }
  }, [open, projectId]);

  // 当提示词数据变化时，更新输入框
  useEffect(() => {
    if (prompt) {
      setStoryboardSummary(prompt.storyboard_summary || '');
      setTextToImage(prompt.text_to_image || '');
      setImageToVideo(prompt.image_to_video || '');
      setSelectedCharacterRefs(prompt.character_refs || []);
      setInstruction('');
    }
  }, [prompt]);

  // 获取已配置的角色列表（有映射且有图片）
  const configuredCharacters = getConfiguredCharactersForProject(
    projectMapping,
    globalCharacters
  );

  // 切换角色引用选择
  const toggleCharacterRef = (identifier: string) => {
    setSelectedCharacterRefs((prev) => {
      if (prev.includes(identifier)) {
        return prev.filter((ref) => ref !== identifier);
      }
      // 最多选择3个角色
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, identifier];
    });
  };

  // 更新项目级映射
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

  // 获取角色配置
  const getCharacterConfig = (identifier: string): GlobalCharacter | null => {
    const globalId = projectMapping[identifier];
    if (!globalId) return null;
    return globalCharacters.find((c) => c.id === globalId) || null;
  };

  const handleSave = async () => {
    if (!prompt) return;

    setIsSaving(true);
    try {
      await onSave(
        prompt.id,
        storyboardSummary,
        textToImage,
        imageToVideo,
        selectedCharacterRefs
      );
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!prompt || !instruction.trim()) return;

    setIsRegenerating(true);
    try {
      await onRegenerate(prompt.id, {
        instruction: instruction.trim(),
        regenerate_type: regenerateType
      });
      onOpenChange(false);
    } finally {
      setIsRegenerating(false);
    }
  };

  const isLoading = isSaving || isRegenerating;

  // 获取有图片的全局角色
  const availableGlobalCharacters = globalCharacters.filter((c) => c.imageData);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[90vh] flex-col sm:max-w-[650px]'>
        <DialogHeader className='flex-shrink-0'>
          <DialogTitle>编辑提示词</DialogTitle>
          <DialogDescription>
            {prompt && `微创新分镜 #${prompt.storyboard_index} 的提示词`}
          </DialogDescription>
        </DialogHeader>

        <div className='grid flex-1 gap-4 overflow-y-auto py-4'>
          {/* 分镜概述 */}
          <div className='grid gap-2'>
            <Label htmlFor='storyboard-summary'>
              分镜概述
              <span className='text-muted-foreground ml-2 text-xs'>
                (简短描述该分镜的内容和目的)
              </span>
            </Label>
            <Textarea
              id='storyboard-summary'
              placeholder='输入分镜概述...'
              value={storyboardSummary}
              onChange={(e) => setStoryboardSummary(e.target.value)}
              className='min-h-[80px] resize-none'
              disabled={isLoading}
            />
          </div>

          {/* 文生图提示词 */}
          <div className='grid gap-2'>
            <Label htmlFor='text-to-image'>
              文生图提示词
              <span className='text-muted-foreground ml-2 text-xs'>
                (用于生成图片的详细指令)
              </span>
            </Label>
            <Textarea
              id='text-to-image'
              placeholder='输入文生图提示词...'
              value={textToImage}
              onChange={(e) => setTextToImage(e.target.value)}
              className='min-h-[100px] resize-none'
              disabled={isLoading}
            />
          </div>

          {/* 图生视频提示词 */}
          <div className='grid gap-2'>
            <Label htmlFor='image-to-video'>
              图生视频提示词
              <span className='text-muted-foreground ml-2 text-xs'>
                (用于生成视频的详细指令)
              </span>
            </Label>
            <Textarea
              id='image-to-video'
              placeholder='输入图生视频提示词...'
              value={imageToVideo}
              onChange={(e) => setImageToVideo(e.target.value)}
              className='min-h-[100px] resize-none'
              disabled={isLoading}
            />
          </div>

          <Separator className='my-2' />

          {/* 角色映射配置（可折叠） */}
          <Collapsible open={isMappingOpen} onOpenChange={setIsMappingOpen}>
            <CollapsibleTrigger asChild>
              <Button variant='outline' className='w-full justify-between'>
                <span className='flex items-center gap-2'>
                  <Settings className='h-4 w-4' />
                  项目角色映射配置
                </span>
                <span className='text-muted-foreground text-xs'>
                  {configuredCharacters.length} 个已配置
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className='mt-3 space-y-3'>
              {availableGlobalCharacters.length === 0 ? (
                <Alert>
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription>
                    暂无可用角色，请先在 Settings 页面上传角色参考图
                  </AlertDescription>
                </Alert>
              ) : (
                <div className='space-y-2'>
                  <p className='text-muted-foreground text-xs'>
                    配置提示词中的角色A/B/C对应哪个全局角色
                  </p>
                  {PROMPT_IDENTIFIERS.map((identifier) => (
                    <div key={identifier} className='flex items-center gap-3'>
                      <div className='bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold'>
                        {identifier}
                      </div>
                      <Select
                        value={projectMapping[identifier]?.toString() || 'none'}
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
                        <div className='h-8 w-8 overflow-hidden rounded'>
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
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator className='my-2' />

          {/* 角色引用选择区域 */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <Label>角色引用 (最多3个)</Label>
              <span className='text-muted-foreground text-xs'>
                已选择: {selectedCharacterRefs.length}/3
              </span>
            </div>

            {configuredCharacters.length > 0 ? (
              <div className='flex flex-wrap gap-2'>
                {configuredCharacters.map(({ identifier, character }) => {
                  const isSelected = selectedCharacterRefs.includes(identifier);
                  const isDisabled =
                    !isSelected && selectedCharacterRefs.length >= 3;

                  return (
                    <div
                      key={identifier}
                      className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : isDisabled
                            ? 'cursor-not-allowed opacity-50'
                            : 'hover:border-primary/50'
                      }`}
                      onClick={() =>
                        !isDisabled && toggleCharacterRef(identifier)
                      }
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={isDisabled || isLoading}
                        onCheckedChange={() => toggleCharacterRef(identifier)}
                      />
                      {character.imageData && (
                        <img
                          src={character.imageData}
                          alt={identifier}
                          className='h-8 w-8 rounded object-cover'
                        />
                      )}
                      <span className='text-sm'>
                        {identifier}
                        {character.name && `: ${character.name}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Alert>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>
                  暂无可用角色，请先配置项目角色映射（点击上方&ldquo;项目角色映射配置&rdquo;）
                </AlertDescription>
              </Alert>
            )}

            {/* 已选择的角色标签 */}
            {selectedCharacterRefs.length > 0 && (
              <div className='flex flex-wrap items-center gap-2'>
                <span className='text-muted-foreground text-xs'>已选择:</span>
                {selectedCharacterRefs.map((ref) => {
                  const config = getCharacterConfig(ref);
                  return (
                    <Badge key={ref} variant='secondary' className='gap-1'>
                      {config?.imageData && (
                        <img
                          src={config.imageData}
                          alt={ref}
                          className='h-4 w-4 rounded object-cover'
                        />
                      )}
                      <User className='h-3 w-3' />
                      {ref}
                      {config?.name && `: ${config.name}`}
                      <X
                        className='hover:text-destructive h-3 w-3 cursor-pointer'
                        onClick={() => toggleCharacterRef(ref)}
                      />
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <Separator className='my-2' />

          {/* AI重新生成区域 */}
          <div className='space-y-3'>
            <p className='text-muted-foreground text-sm font-medium'>
              或使用AI重新生成
            </p>

            <div className='grid gap-2'>
              <Label htmlFor='instruction'>修改建议</Label>
              <Textarea
                id='instruction'
                placeholder='请输入修改建议，例如：请让画面更加科幻感，增加霓虹灯效果...'
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                className='min-h-[80px] resize-none'
                disabled={isLoading}
              />
            </div>

            <div className='flex items-center gap-4'>
              <div className='grid flex-1 gap-2'>
                <Label htmlFor='regenerate-type'>重新生成范围</Label>
                <Select
                  value={regenerateType}
                  onValueChange={(value) =>
                    setRegenerateType(value as typeof regenerateType)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger id='regenerate-type'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='both'>两种提示词</SelectItem>
                    <SelectItem value='text_to_image'>仅文生图</SelectItem>
                    <SelectItem value='image_to_video'>仅图生视频</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant='secondary'
                onClick={handleRegenerate}
                disabled={isLoading || !instruction.trim()}
                className='mt-6 gap-1'
              >
                {isRegenerating ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Sparkles className='h-4 w-4' />
                )}
                AI重新生成
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className='flex-shrink-0'>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isSaving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            保存修改
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
