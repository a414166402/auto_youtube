import { Metadata } from 'next';

export const siteConfig = {
  name: 'Backlinks Manager',
  description:
    'A powerful management system for backlinks with automated tasks execution',
  url: 'https://backlinks-manager.example.com',
  ogImage: 'https://backlinks-manager.example.com/og.jpg',
  links: {
    twitter: 'https://twitter.com/backlinksmgr',
    github: 'https://github.com/backlinks-manager/backlinks-manager'
  }
};

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  keywords: [
    'Backlinks',
    'SEO',
    'Link Building',
    'Automation',
    'Tasks',
    'Management'
  ],
  authors: [
    {
      name: 'Backlinks Manager Team',
      url: siteConfig.url
    }
  ],
  creator: 'Backlinks Manager Team',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: '@backlinksmgr'
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png'
  }
};
