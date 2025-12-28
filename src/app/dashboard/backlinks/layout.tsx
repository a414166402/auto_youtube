import { Metadata } from 'next';
import { ReactNode } from 'react';
import { siteConfig } from '@/app/metadata';

export const metadata: Metadata = {
  title: 'Backlinks Management',
  description: 'Manage your backlinks and automate tasks',
  keywords: ['Backlinks', 'SEO', 'Link Building', 'Automation'],
  openGraph: {
    title: 'Backlinks Management',
    description: 'Manage your backlinks and automate tasks'
  }
};

export default function BacklinksLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
