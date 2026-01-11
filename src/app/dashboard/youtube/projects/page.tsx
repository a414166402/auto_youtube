'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { ProjectCard } from '@/components/youtube/project-card';
import { CreateProjectDialog } from '@/components/youtube/create-project-dialog';
import { getProjects, deleteProject, copyProject } from '@/lib/api/youtube';
import type { ProjectListItem } from '@/types/youtube';
import { useToast } from '@/components/ui/use-toast';

const PAGE_SIZE = 12;

// 与后端ProjectStatus枚举对齐
const statusOptions: { value: string; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'created', label: '已创建' },
  { value: 'prompts_ready', label: '提示词就绪' },
  { value: 'images_partial', label: '图片生成中' },
  { value: 'images_ready', label: '图片就绪' },
  { value: 'videos_partial', label: '视频生成中' },
  { value: 'completed', label: '已完成' },
  { value: 'failed', label: '失败' }
];

export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const currentPage = Number(searchParams.get('page')) || 1;
  const currentStatus = searchParams.get('status') || 'all';

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: { page: number; page_size: number; status?: string } = {
        page: currentPage,
        page_size: PAGE_SIZE
      };
      if (currentStatus !== 'all') {
        params.status = currentStatus;
      }
      const response = await getProjects(params);
      // 使用后端返回的items字段
      setProjects(response.items);
      setTotal(response.total);
      setTotalPages(response.pages);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast({
        title: '获取项目列表失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, currentStatus, toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const updateSearchParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`?${params.toString()}`);
  };

  const handleStatusChange = (value: string) => {
    updateSearchParams({ status: value === 'all' ? '' : value, page: '1' });
  };

  const handlePageChange = (page: number) => {
    updateSearchParams({ page: page.toString() });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProject(id);
      toast({
        title: '删除成功',
        description: '项目已成功删除'
      });
      fetchProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast({
        title: '删除失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handleCopy = async (id: string, newName: string) => {
    try {
      await copyProject(id, { name: newName });
      toast({
        title: '复制成功',
        description: '项目已成功复制'
      });
      fetchProjects();
    } catch (error) {
      console.error('Failed to copy project:', error);
      toast({
        title: '复制失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handleProjectCreated = () => {
    toast({
      title: '创建成功',
      description: '项目已成功创建'
    });
    fetchProjects();
  };

  // Filter projects by search query (client-side)
  const filteredProjects = searchQuery
    ? projects.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : projects;

  return (
    <div className='container mx-auto space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>YouTube AI视频工具</h1>
        <CreateProjectDialog onSuccess={handleProjectCreated} />
      </div>

      <div className='flex flex-col gap-4 sm:flex-row'>
        <div className='relative flex-1'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            placeholder='搜索项目名称...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-9'
          />
        </div>
        <Select value={currentStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className='w-full sm:w-[180px]'>
            <Filter className='mr-2 h-4 w-4' />
            <SelectValue placeholder='筛选状态' />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-12 text-center'>
          <p className='text-muted-foreground mb-4'>
            {searchQuery ? '没有找到匹配的项目' : '暂无项目'}
          </p>
          {!searchQuery && (
            <CreateProjectDialog onSuccess={handleProjectCreated} />
          )}
        </div>
      ) : (
        <>
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleDelete}
                onCopy={handleCopy}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    aria-disabled={currentPage <= 1}
                    className={
                      currentPage <= 1
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show first, last, current, and adjacent pages
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, index, array) => {
                    // Add ellipsis if there's a gap
                    const showEllipsisBefore =
                      index > 0 && page - array[index - 1] > 1;
                    return (
                      <span key={page} className='flex items-center'>
                        {showEllipsisBefore && (
                          <PaginationItem>
                            <span className='px-2'>...</span>
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={page === currentPage}
                            className='cursor-pointer'
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      </span>
                    );
                  })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    aria-disabled={currentPage >= totalPages}
                    className={
                      currentPage >= totalPages
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}
