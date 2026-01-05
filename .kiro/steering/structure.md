# Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (proxy to backend services)
│   │   └── youtube/       # YouTube API proxy ([...path] catch-all)
│   ├── auth/              # Clerk auth pages (sign-in, sign-up)
│   ├── dashboard/         # Protected dashboard routes
│   │   ├── youtube/       # YouTube tool pages
│   │   ├── kanban/        # Kanban board
│   │   ├── overview/      # Dashboard overview (parallel routes)
│   │   ├── product/       # Product management
│   │   ├── profile/       # User profile (Clerk)
│   │   └── settings/      # App settings
│   ├── layout.tsx         # Root layout (providers, theme)
│   └── page.tsx           # Landing page
│
├── components/
│   ├── ui/                # shadcn/ui base components
│   │   └── table/         # Data table components
│   ├── layout/            # App layout (sidebar, header)
│   ├── kbar/              # Command palette
│   ├── modal/             # Modal components
│   └── youtube/           # YouTube tool components
│
├── features/              # Feature-specific modules
│   ├── auth/              # Auth components
│   ├── kanban/            # Kanban board logic
│   ├── overview/          # Dashboard charts
│   ├── products/          # Product management
│   └── profile/           # Profile forms
│
├── hooks/                 # Custom React hooks
├── lib/
│   └── api/               # API client functions
├── types/                 # TypeScript type definitions
├── constants/             # Static data and nav config
├── contexts/              # React contexts (Language)
├── config/                # App configuration
└── locales/               # i18n JSON files (en, zh)
```

## Key Patterns

- **API Routes**: Catch-all routes (`[...path]`) proxy requests to backend services
- **Parallel Routes**: Dashboard overview uses `@slot` folders for parallel data loading
- **Feature Modules**: Business logic grouped in `features/` with components, utils subfolders
- **UI Components**: Base components in `components/ui/`, feature-specific elsewhere
- **Type Definitions**: Centralized in `src/types/` per domain (youtube.ts)
