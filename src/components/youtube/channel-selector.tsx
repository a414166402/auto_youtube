'use client';

import { Check } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type {
  ImageGenerationChannel,
  VideoGenerationChannel
} from '@/types/youtube';

// 图文生图渠道配置
export const IMAGE_CHANNELS: Array<{
  value: ImageGenerationChannel;
  label: string;
  description: string;
}> = [
  {
    value: 'gcp',
    label: 'GCP',
    description: '支持多图输入、分辨率和宽高比控制'
  },
  // {
  //   value: 'antigravity',
  //   label: 'Antigravity',
  //   description: '支持多图输入、分辨率和宽高比控制'
  // },
  {
    value: 'flow2',
    label: 'Flow2',
    description: '支持多图输入和流式响应'
  },
  {
    value: 'grok',
    label: 'Grok',
    description: '支持多图输入'
  }
  // {
  //   value: 'business',
  //   label: 'Business',
  //   description: '仅支持单图输入'
  // }
];

// 图文生视频渠道配置
export const VIDEO_CHANNELS: Array<{
  value: VideoGenerationChannel;
  label: string;
  description: string;
}> = [
  {
    value: 'grok',
    label: 'Grok',
    description: '图文生视频服务'
  }
];

interface ChannelSelectorProps {
  type: 'image' | 'video';
  value: ImageGenerationChannel | VideoGenerationChannel;
  onChange: (value: ImageGenerationChannel | VideoGenerationChannel) => void;
  disabled?: boolean;
}

export function ChannelSelector({
  type,
  value,
  onChange,
  disabled = false
}: ChannelSelectorProps) {
  const channels = type === 'image' ? IMAGE_CHANNELS : VIDEO_CHANNELS;

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className='w-[180px]'>
        <SelectValue placeholder='选择渠道' />
      </SelectTrigger>
      <SelectContent>
        {channels.map((channel) => (
          <SelectItem
            key={channel.value}
            value={channel.value}
            className='cursor-pointer'
          >
            <div className='flex items-center justify-between gap-2'>
              <div className='flex flex-col'>
                <span className='font-medium'>{channel.label}</span>
                <span className='text-muted-foreground text-xs'>
                  {channel.description}
                </span>
              </div>
              {value === channel.value && (
                <Check className='text-primary h-4 w-4' />
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
