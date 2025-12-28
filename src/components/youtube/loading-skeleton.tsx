'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * 项目卡片骨架屏
 */
export function ProjectCardSkeleton() {
  return (
    <Card className='overflow-hidden'>
      <Skeleton className='aspect-video w-full' />
      <CardHeader className='py-3'>
        <Skeleton className='h-5 w-3/4' />
      </CardHeader>
      <CardContent className='pt-0 pb-3'>
        <Skeleton className='h-4 w-1/2' />
      </CardContent>
    </Card>
  );
}

/**
 * 项目列表骨架屏
 */
export function ProjectListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * 分镜卡片骨架屏
 */
export function StoryboardCardSkeleton() {
  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-5 w-32' />
          <Skeleton className='h-8 w-20' />
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex gap-4'>
          <Skeleton className='h-24 w-40 rounded-md' />
          <Skeleton className='h-24 w-40 rounded-md' />
        </div>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-20 w-full' />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 分镜列表骨架屏
 */
export function StoryboardListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className='space-y-4'>
      {Array.from({ length: count }).map((_, i) => (
        <StoryboardCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * 提示词卡片骨架屏
 */
export function PromptCardSkeleton() {
  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Skeleton className='h-16 w-16 rounded-md' />
            <Skeleton className='h-5 w-24' />
          </div>
          <Skeleton className='h-6 w-16' />
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-16 w-full' />
        </div>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-28' />
          <Skeleton className='h-16 w-full' />
        </div>
        <div className='flex gap-2'>
          <Skeleton className='h-8 w-16' />
          <Skeleton className='h-8 w-24' />
          <Skeleton className='h-8 w-20' />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 提示词列表骨架屏
 */
export function PromptListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className='space-y-4'>
      {Array.from({ length: count }).map((_, i) => (
        <PromptCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * 角色映射卡片骨架屏
 */
export function CharacterMappingCardSkeleton() {
  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='flex items-start gap-4'>
          <Skeleton className='h-24 w-24 rounded-md' />
          <div className='flex-1 space-y-3'>
            <Skeleton className='h-5 w-32' />
            <Skeleton className='h-9 w-full' />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 角色映射列表骨架屏
 */
export function CharacterMappingListSkeleton({
  count = 4
}: {
  count?: number;
}) {
  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
      {Array.from({ length: count }).map((_, i) => (
        <CharacterMappingCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * 图片生成卡片骨架屏
 */
export function ImageGenerationCardSkeleton() {
  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-5 w-24' />
          <Skeleton className='h-6 w-20' />
        </div>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='aspect-square rounded-md' />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 图片生成列表骨架屏
 */
export function ImageGenerationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className='space-y-4'>
      {Array.from({ length: count }).map((_, i) => (
        <ImageGenerationCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * 视频生成卡片骨架屏
 */
export function VideoGenerationCardSkeleton() {
  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Skeleton className='h-16 w-16 rounded-md' />
            <Skeleton className='h-5 w-24' />
          </div>
          <Skeleton className='h-6 w-20' />
        </div>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 gap-3 md:grid-cols-3'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className='aspect-video rounded-md' />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 视频生成列表骨架屏
 */
export function VideoGenerationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className='space-y-4'>
      {Array.from({ length: count }).map((_, i) => (
        <VideoGenerationCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * 工作流步骤骨架屏
 */
export function WorkflowStepSkeleton() {
  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Skeleton className='h-10 w-10 rounded-full' />
            <div className='space-y-2'>
              <Skeleton className='h-5 w-32' />
              <Skeleton className='h-4 w-48' />
            </div>
          </div>
          <Skeleton className='h-9 w-24' />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 工作流页面骨架屏
 */
export function WorkflowPageSkeleton() {
  return (
    <div className='space-y-4'>
      <Skeleton className='h-2 w-full rounded-full' />
      <div className='space-y-3'>
        {Array.from({ length: 6 }).map((_, i) => (
          <WorkflowStepSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * 通用页面加载骨架屏
 */
export function PageSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-10 w-32' />
      </div>
      <div className='space-y-4'>
        <Skeleton className='h-64 w-full rounded-lg' />
        <Skeleton className='h-64 w-full rounded-lg' />
      </div>
    </div>
  );
}
