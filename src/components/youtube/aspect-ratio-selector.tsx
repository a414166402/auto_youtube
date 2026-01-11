'use client';

import { RectangleVertical, RectangleHorizontal } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { AspectRatio } from '@/types/youtube';
import { ASPECT_RATIO_LABELS } from '@/types/youtube';

interface AspectRatioSelectorProps {
  value: AspectRatio;
  onChange: (value: AspectRatio) => void;
  disabled?: boolean;
  showLabel?: boolean;
}

export function AspectRatioSelector({
  value,
  onChange,
  disabled = false,
  showLabel = true
}: AspectRatioSelectorProps) {
  return (
    <div className='flex items-center gap-2'>
      {showLabel && (
        <Label className='text-sm whitespace-nowrap'>图片比例:</Label>
      )}
      <Select
        value={value}
        onValueChange={(v) => onChange(v as AspectRatio)}
        disabled={disabled}
      >
        <SelectTrigger className='w-36'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='9:16'>
            <div className='flex items-center gap-2'>
              <RectangleVertical className='h-4 w-4' />
              {ASPECT_RATIO_LABELS['9:16']}
            </div>
          </SelectItem>
          <SelectItem value='16:9'>
            <div className='flex items-center gap-2'>
              <RectangleHorizontal className='h-4 w-4' />
              {ASPECT_RATIO_LABELS['16:9']}
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
