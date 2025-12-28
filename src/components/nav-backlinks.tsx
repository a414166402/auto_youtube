import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { CloudDownload, ListChecks, List, Settings } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const backlinksNav = [
  {
    key: 'fetch',
    title: 'Fetch Backlinks',
    href: '/dashboard/backlinks/fetch',
    icon: CloudDownload
  },
  {
    key: 'list',
    title: 'Analyze Backlinks',
    href: '/dashboard/backlinks/list',
    icon: List
  },
  {
    key: 'tasks',
    title: 'Tasks',
    href: '/dashboard/backlinks/tasks',
    icon: ListChecks
  },
  {
    key: 'maintenance',
    title: 'Maintenance',
    href: '/dashboard/backlinks/maintenance',
    icon: Settings,
    adminOnly: true
  }
];

interface NavBacklinksProps {
  isAdmin?: boolean;
}

export function NavBacklinks({ isAdmin = false }: NavBacklinksProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <div className='grid gap-1'>
      {backlinksNav
        .filter((item) => !item.adminOnly || (item.adminOnly && isAdmin))
        .map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'hover:text-primary flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
              pathname === item.href
                ? 'bg-muted text-primary font-medium'
                : 'text-muted-foreground'
            )}
          >
            <item.icon className='h-4 w-4' />
            <span>{t(`navigation.${item.key}`) || item.title}</span>
          </Link>
        ))}
    </div>
  );
}
