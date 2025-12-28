import { Metadata } from 'next';
import { ReactNode } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

export const metadata: Metadata = {
  title: 'YouTube AI视频工具',
  description:
    'YouTube AI视频制作工具 - 从对标视频提取分镜、生成提示词、批量生成图片和视频',
  keywords: [
    'YouTube',
    'AI视频',
    '分镜',
    '提示词',
    '视频生成',
    'Gemini',
    'Grok'
  ],
  openGraph: {
    title: 'YouTube AI视频工具',
    description:
      'YouTube AI视频制作工具 - 从对标视频提取分镜、生成提示词、批量生成图片和视频'
  }
};

export default function YouTubeLayout({ children }: { children: ReactNode }) {
  return (
    <ScrollArea className='h-[calc(100dvh-52px)]'>
      <div className='flex flex-1 flex-col p-4 md:px-6'>{children}</div>
    </ScrollArea>
  );
}
