'use client';

import { User, ImageIcon, Link2, Link2Off } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { GlobalCharacter, PromptIdentifier } from '@/lib/character-config';

export interface CharacterMappingCardProps {
  identifier: PromptIdentifier; // 提示词中的角色标识 A/B/C/D/E/F
  mappedCharacterId: number | null; // 映射到的全局角色ID
  globalCharacters: GlobalCharacter[]; // 全局角色库
  onMappingChange: (
    identifier: PromptIdentifier,
    globalCharacterId: number | null
  ) => void;
}

export function CharacterMappingCard({
  identifier,
  mappedCharacterId,
  globalCharacters,
  onMappingChange
}: CharacterMappingCardProps) {
  // 获取当前映射的角色
  const mappedCharacter = mappedCharacterId
    ? globalCharacters.find((c) => c.id === mappedCharacterId)
    : null;

  // 获取有图片的角色列表（用于下拉选项）
  const availableCharacters = globalCharacters.filter((c) => c.imageData);

  const handleValueChange = (value: string) => {
    if (value === 'none') {
      onMappingChange(identifier, null);
    } else {
      onMappingChange(identifier, parseInt(value, 10));
    }
  };

  return (
    <Card className='overflow-hidden'>
      <CardContent className='flex items-center gap-4 p-4'>
        {/* 角色标识 */}
        <div className='flex flex-col items-center gap-1'>
          <div className='bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold'>
            {identifier}
          </div>
          <span className='text-muted-foreground text-xs'>
            角色{identifier}
          </span>
        </div>

        {/* 映射箭头 */}
        <div className='text-muted-foreground'>
          {mappedCharacter ? (
            <Link2 className='h-5 w-5' />
          ) : (
            <Link2Off className='h-5 w-5' />
          )}
        </div>

        {/* 映射选择 */}
        <div className='flex-1'>
          <Select
            value={mappedCharacterId?.toString() || 'none'}
            onValueChange={handleValueChange}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='选择对应的全局角色' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='none'>
                <span className='text-muted-foreground'>未映射</span>
              </SelectItem>
              {availableCharacters.map((char) => (
                <SelectItem key={char.id} value={char.id.toString()}>
                  <div className='flex items-center gap-2'>
                    {char.imageData && (
                      <img
                        src={char.imageData}
                        alt={`角色 ${char.id}`}
                        className='h-6 w-6 rounded object-cover'
                      />
                    )}
                    <span>
                      角色 {char.id}
                      {char.name && ` - ${char.name}`}
                    </span>
                  </div>
                </SelectItem>
              ))}
              {availableCharacters.length === 0 && (
                <div className='text-muted-foreground px-2 py-1.5 text-sm'>
                  暂无可用角色，请先在 Settings 页面上传角色图片
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* 映射结果预览 */}
        <div className='flex h-12 w-12 items-center justify-center rounded-lg border'>
          {mappedCharacter?.imageData ? (
            <img
              src={mappedCharacter.imageData}
              alt={`角色 ${mappedCharacter.id}`}
              className='h-full w-full rounded-lg object-cover'
            />
          ) : (
            <div className='text-muted-foreground flex flex-col items-center'>
              <ImageIcon className='h-5 w-5' />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
