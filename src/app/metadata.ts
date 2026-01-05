import { Metadata } from 'next';

export const siteConfig = {
  name: 'YouTube AI Video Tool',
  description:
    'AI-powered video production pipeline with storyboard parsing, prompt generation, image/video generation',
  url: 'https://youtube-ai-tool.example.com',
  ogImage: 'https://youtube-ai-tool.example.com/og.jpg',
  links: {
    twitter: 'https://twitter.com/youtubeaitool',
    github: 'https://github.com/youtube-ai-tool'
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
    'YouTube',
    'AI',
    'Video Production',
    'Storyboard',
    'Prompt Generation',
    'Image Generation'
  ],
  authors: [
    {
      name: 'YouTube AI Tool Team',
      url: siteConfig.url
    }
  ],
  creator: 'YouTube AI Tool Team',
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
    creator: '@youtubeaitool'
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png'
  }
};
