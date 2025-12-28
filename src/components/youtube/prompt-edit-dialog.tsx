'use client';

import { useState, useEffect } from 'react';
import { Loader2, Sparkles, User, X } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type {
  Prompt,
  CharacterMapping,
  RegeneratePromptRequest
} from '@/types/youtube';

export interface PromptEditDialogProps {
  prompt: Prompt | null;
  characterMappings?: CharacterMapping[]; // 可用的角色映射列表
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    id: string,
    textToImage: string,
    imageToVideo: string,
    characterRefs?: string[]
  ) => Promise<void>;
  onRegenerate: (id: string, data: RegeneratePromptRequest) => Promise<void>;
}

export function PromptEditDialog({
  prompt,
  characterMappings = [],
  open,
  onOpenChange,
  onSave,
  onRegenerate
}: PromptEditDialogProps) {
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

  // 当提示词数据变化时，更新输入框
  useEffect(() => {
    if (prompt) {
      setTextToImage(prompt.text_to_image || '');
      setImageToVideo(prompt.image_to_video || '');
      setSelectedCharacterRefs(prompt.character_refs || []);
      setInstruction('');
    }
  }, [prompt]);

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

  // 获取角色显示名称
  const getCharacterDisplayName = (identifier: string): string => {
    const mapping = characterMappings.find((m) => m.identifier === identifier);
    return mapping?.name ? `${identifier}: ${mapping.name}` : identifier;
  };

  // 检查角色是否有参考图
  const hasReferenceImage = (identifier: string): boolean => {
    const mapping = characterMappings.find((m) => m.identifier === identifier);
    return !!mapping?.reference_image_url;
  };

  const handleSave = async () => {
    if (!prompt) return;

    setIsSaving(true);
    try {
      await onSave(prompt.id, textToImage, imageToVideo, selectedCharacterRefs);
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

  // 过滤出有参考图的角色
  const availableCharacters = characterMappings.filter(
    (m) => m.reference_image_url
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>编辑提示词</DialogTitle>
          <DialogDescription>
            {prompt && `微创新分镜 #${prompt.storyboard_index} 的提示词`}
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-4 py-4'>
          {/* 文生图提示词 */}
          <div className='grid gap-2'>
            <Label htmlFor='text-to-image'>文生图提示词</Label>
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
            <Label htmlFor='image-to-video'>图生视频提示词</Label>
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

          {/* 角色引用选择区域 */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <Label>角色引用 (最多3个，从Settings配置中选择)</Label>
              <span className='text-muted-foreground text-xs'>
                已选择: {selectedCharacterRefs.length}/3
              </span>
            </div>

            {availableCharacters.length > 0 ? (
              <div className='flex flex-wrap gap-2'>
                {availableCharacters.map((mapping) => {
                  const isSelected = selectedCharacterRefs.includes(
                    mapping.identifier
                  );
                  const isDisabled =
                    !isSelected && selectedCharacterRefs.length >= 3;

                  return (
                    <div
                      key={mapping.identifier}
                      className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : isDisabled
                            ? 'cursor-not-allowed opacity-50'
                            : 'hover:border-primary/50'
                      }`}
                      onClick={() =>
                        !isDisabled && toggleCharacterRef(mapping.identifier)
                      }
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={isDisabled || isLoading}
                        onCheckedChange={() =>
                          toggleCharacterRef(mapping.identifier)
                        }
                      />
                      {mapping.reference_image_url && (
                        <img
                          src={mapping.reference_image_url}
                          alt={mapping.identifier}
                          className='h-8 w-8 rounded object-cover'
                        />
                      )}
                      <span className='text-sm'>
                        {getCharacterDisplayName(mapping.identifier)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className='text-muted-foreground text-sm'>
                暂无可用角色，请先在 Settings 页面配置角色参考图
              </p>
            )}

            {/* 已选择的角色标签 */}
            {selectedCharacterRefs.length > 0 && (
              <div className='flex flex-wrap items-center gap-2'>
                <span className='text-muted-foreground text-xs'>已选择:</span>
                {selectedCharacterRefs.map((ref) => (
                  <Badge key={ref} variant='secondary' className='gap-1'>
                    <User className='h-3 w-3' />
                    {getCharacterDisplayName(ref)}
                    <X
                      className='hover:text-destructive h-3 w-3 cursor-pointer'
                      onClick={() => toggleCharacterRef(ref)}
                    />
                  </Badge>
                ))}
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

        <DialogFooter>
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
