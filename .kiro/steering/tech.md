# Tech Stack

## Framework & Runtime
- Next.js 15.2.4 (App Router with Turbopack)
- React 19
- TypeScript 5.7 (strict mode)

## Styling
- Tailwind CSS 4.0
- shadcn/ui components (Radix UI primitives)
- class-variance-authority for component variants
- tailwind-merge for class merging

## State Management
- Zustand for client state
- nuqs for URL search params state
- React Hook Form + Zod for forms

## UI Components
- Radix UI primitives (dialog, dropdown, tabs, etc.)
- Recharts for data visualization
- @dnd-kit for drag-and-drop (Kanban)
- kbar for command palette
- Lucide React + Tabler icons

## Authentication
- Clerk (@clerk/nextjs)

## Data Tables
- TanStack Table (react-table)

## Testing
- Vitest + React Testing Library
- happy-dom/jsdom for DOM testing

## Code Quality
- ESLint (next/core-web-vitals)
- Prettier with Tailwind plugin
- Husky + lint-staged for pre-commit hooks

## Common Commands

```bash
# Development
pnpm dev          # Start dev server with Turbopack

# Build & Production
pnpm build        # Production build
pnpm start        # Start production server

# Code Quality
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix lint issues + format
pnpm format       # Format with Prettier

# Testing
pnpm test         # Run tests in watch mode
pnpm test:run     # Run tests once
```

## Path Aliases
- `@/*` → `./src/*`
- `~/*` → `./public/*`
