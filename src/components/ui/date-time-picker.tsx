'use client';

import * as React from 'react';
import { format, set } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';
import { zhCN, enUS } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { XIcon } from 'lucide-react';

interface DateTimePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  className?: string;
  align?: 'start' | 'center' | 'end';
  placeholder?: string;
  clearable?: boolean;
}

export function DateTimePicker({
  date,
  onDateChange,
  className,
  align = 'start',
  placeholder,
  clearable = true
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { locale, t } = useLanguage();

  // 根据当前语言设置日历语言和占位符文本
  const calendarLocale = locale === 'zh' ? zhCN : enUS;
  const defaultPlaceholder =
    locale === 'zh' ? '选择日期和时间' : 'Select date and time';

  // 从日期中提取时间
  const hours = date ? date.getHours().toString().padStart(2, '0') : '00';
  const minutes = date ? date.getMinutes().toString().padStart(2, '0') : '00';
  const [timeValue, setTimeValue] = React.useState(`${hours}:${minutes}`);

  // 当外部日期变化时，更新时间值
  React.useEffect(() => {
    if (date) {
      setTimeValue(
        `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      );
    } else {
      setTimeValue('00:00');
    }
  }, [date]);

  // 当时间改变时，更新日期
  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTimeValue(event.target.value);

    if (date) {
      const [hours, minutes] = event.target.value.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours || 0);
      newDate.setMinutes(minutes || 0);
      console.log('Time changed to:', hours, ':', minutes);
      console.log('New date with updated time:', newDate.toString());
      onDateChange(newDate);
    }
  };

  // 当日期改变时
  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      const [hours, minutes] = timeValue.split(':').map(Number);
      newDate.setHours(hours || 0);
      newDate.setMinutes(minutes || 0);
      console.log('Date changed, applying time:', hours, ':', minutes);
      console.log('New date with time applied:', newDate.toString());
    }
    onDateChange(newDate);
  };

  // 清除日期
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDateChange(undefined);
    setTimeValue('00:00');
    setIsOpen(false);
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id='date'
            variant={'outline'}
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className='mr-2 h-4 w-4' />
            {date
              ? format(date, 'yyyy-MM-dd HH:mm')
              : placeholder || defaultPlaceholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align={align}>
          <Calendar
            initialFocus
            mode='single'
            selected={date}
            onSelect={handleDateChange}
            locale={calendarLocale}
          />
          <div className='border-border border-t p-3'>
            <div className='flex items-center gap-2'>
              <span className='text-sm'>
                {locale === 'zh' ? '时间' : 'Time'}:
              </span>
              <Input
                type='time'
                value={timeValue}
                onChange={handleTimeChange}
                className='w-full'
              />
            </div>
          </div>
          <div className='flex items-center justify-between border-t p-3'>
            {clearable && (
              <Button variant='ghost' size='sm' onClick={handleClear}>
                {locale === 'zh' ? '清除' : 'Clear'}
              </Button>
            )}
            <Button
              size='sm'
              onClick={() => {
                setIsOpen(false);
              }}
            >
              {locale === 'zh' ? '应用' : 'Apply'}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
