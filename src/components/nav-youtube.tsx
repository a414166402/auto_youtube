'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  FolderOpen,
  Settings,
  Video,
  FileText,
  Image,
  Users
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const youtubeNav = [
  {
    key: 'projects',
    title: 'Projects',
    titleZh: '项目列表',
    href: '/dashboard/youtube/projects',
    icon: FolderOpen
  },
  {
    key: 'settings',
    title: 'Character Mapping',
    titleZh: '角色映射',
    href: '/dashboard/youtube/settings',
    icon: Users
  }
];

export function NavYouTube() {
  const pathname = usePathname();
  const { t, locale } = useLanguage();

  // Check if current path is under YouTube module
  const isYouTubeActive = pathname?.startsWith('/dashboard/youtube');

  if (!isYouTubeActive) {
    return null;
  }

  return (
    <div className='grid gap-1'>
      {youtubeNav.map((item) => {
        // Check if current path matches this nav item or is a child route
        const isActive =
          pathname === item.href || pathname?.startsWith(item.href + '/');

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'hover:text-primary flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
              isActive
                ? 'bg-muted text-primary font-medium'
                : 'text-muted-foreground'
            )}
          >
            <item.icon className='h-4 w-4' />
            <span>
              {t(`youtube.navigation.${item.key}`) ||
                (locale === 'zh' ? item.titleZh : item.title)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
