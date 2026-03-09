'use client';

import { Check } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type {
  ImageGenerationChannel,
  VideoGenerationChannel
} from '@/types/youtube';

// 图文生图渠道配置
export const IMAGE_CHANNELS: Array<{
  value: ImageGenerationChannel;
  label: string;
}> = [
  {
    value: 'gcp',
    label: 'GCP'
  },
  // {
  //   value: 'antigravity',
  //   label: 'Antigravity'
  // },
  {
    value: 'flow2',
    label: 'Flow'
  },
  {
    value: 'grok',
    label: 'Grok'
  }
  // {
  //   value: 'business',
  //   label: 'Business'
  // }
];

// 图文生视频渠道配置
export const VIDEO_CHANNELS: Array<{
  value: VideoGenerationChannel;
  label: string;
}> = [
  {
    value: 'grok',
    label: 'Grok'
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
    <div className='flex items-center gap-2'>
      <Label className='text-sm whitespace-nowrap'>渠道选择:</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className='w-[140px]'>
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
                <span>{channel.label}</span>
                {value === channel.value && (
                  <Check className='text-primary h-4 w-4' />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
