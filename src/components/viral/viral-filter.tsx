'use client';

import { Search, Calendar, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import type { ViralFilterParams } from '@/types/viral';

interface ViralFilterProps {
  filters: ViralFilterParams;
  onFiltersChange: (filters: ViralFilterParams) => void;
  tags?: string[];
}

export function ViralFilter({
  filters,
  onFiltersChange,
  tags = []
}: ViralFilterProps) {
  const handleKeywordChange = (keyword: string) => {
    onFiltersChange({ ...filters, keyword, page: 1 });
  };

  const handleTagsChange = (selectedTags: string[]) => {
    onFiltersChange({ ...filters, tags: selectedTags, page: 1 });
  };

  const handleDateRangeChange = (start_date?: string, end_date?: string) => {
    onFiltersChange({ ...filters, start_date, end_date, page: 1 });
  };

  const handleReset = () => {
    onFiltersChange({
      page: 1,
      page_size: filters.page_size || 10
    });
  };

  return (
    <Card>
      <CardContent className='p-4'>
        <div className='flex flex-wrap gap-4'>
          {/* 关键词搜索 */}
          <div className='min-w-[200px] flex-1'>
            <div className='relative'>
              <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
              <Input
                placeholder='搜索视频名称或分析文本...'
                value={filters.keyword || ''}
                onChange={(e) => handleKeywordChange(e.target.value)}
                className='pl-9'
              />
            </div>
          </div>

          {/* 标签筛选 */}
          <div className='w-[200px]'>
            <Select
              value={filters.tags?.[0] || 'all'}
              onValueChange={(value) => {
                if (value === 'all') {
                  handleTagsChange([]);
                } else {
                  handleTagsChange([value]);
                }
              }}
            >
              <SelectTrigger>
                <Tag className='mr-2 h-4 w-4' />
                <SelectValue placeholder='全部标签' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>全部标签</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 时间范围 - 简化版 */}
          <div className='flex gap-2'>
            <Input
              type='date'
              value={filters.start_date || ''}
              onChange={(e) =>
                handleDateRangeChange(e.target.value, filters.end_date)
              }
              className='w-[150px]'
            />
            <span className='text-muted-foreground flex items-center'>至</span>
            <Input
              type='date'
              value={filters.end_date || ''}
              onChange={(e) =>
                handleDateRangeChange(filters.start_date, e.target.value)
              }
              className='w-[150px]'
            />
          </div>

          {/* 重置按钮 */}
          <Button variant='outline' onClick={handleReset}>
            重置
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
