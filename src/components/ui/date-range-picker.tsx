'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
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

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (dateRange: DateRange | undefined) => void;
  className?: string;
  align?: 'start' | 'center' | 'end';
  placeholder?: string;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
  align = 'start',
  placeholder
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { locale, t } = useLanguage();

  // 根据当前语言设置日历语言和占位符文本
  const calendarLocale = locale === 'zh' ? zhCN : enUS;
  const defaultPlaceholder =
    locale === 'zh' ? '选择日期范围' : 'Select date range';

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id='date-range'
            variant={'outline'}
            className={cn(
              'w-full justify-start text-left font-normal',
              !dateRange && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className='mr-2 h-4 w-4' />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, 'yyyy-MM-dd')} -{' '}
                  {format(dateRange.to, 'yyyy-MM-dd')}
                </>
              ) : (
                format(dateRange.from, 'yyyy-MM-dd')
              )
            ) : (
              placeholder || defaultPlaceholder
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align={align}>
          <Calendar
            initialFocus
            mode='range'
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={onDateRangeChange}
            numberOfMonths={2}
            locale={calendarLocale}
          />
          <div className='flex items-center justify-between border-t p-3'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                onDateRangeChange(undefined);
                setIsOpen(false);
              }}
            >
              {locale === 'zh' ? '清除' : 'Clear'}
            </Button>
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
