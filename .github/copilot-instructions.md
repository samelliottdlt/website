# Copilot Instructions

## Project Overview

Personal portfolio website built with Next.js 15+ (App Router), React 19, TypeScript, and Tailwind CSS 4+. Hosts interactive side projects (calculators, games, utilities) and an MDX-powered blog.

## Tech Stack

- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4+ (utility classes only, avoid custom CSS)
- **UI**: Headless UI, Heroicons
- **Content**: MDX with gray-matter frontmatter, rehype-highlight for syntax highlighting
- **Testing**: Jest with ts-jest
- **Code Quality**: ESLint, Prettier

## Repository Structure

- `app/` — Pages and route-specific components (App Router)
- `components/` — Reusable React components (PascalCase)
- `hooks/` — Custom React hooks (camelCase, `use` prefix)
- `lib/` — Shared utilities (only truly general-purpose code)
- `posts/` — MDX blog posts with YAML frontmatter
- `styles/` — Global CSS
- `__tests__/` — Jest tests (`*.spec.ts`)

## Conventions

### Naming

- **Directories/routes**: kebab-case (`fusion-calculator`, `game-of-the-year`)
- **Components**: PascalCase (`Navbar.tsx`, `Alert.tsx`)
- **Utilities/hooks**: camelCase (`util.ts`, `useLocalStorage.ts`)
- **Data files**: kebab-case JSON (`card.json`, `ingredients.json`)

### Components

- Server components by default; push `"use client"` to leaf components
- Functional components with hooks
- Type props with TypeScript `type` (prefer over `interface`)
- Use `<>` fragments over unnecessary wrapper divs

### Code Organization

- Colocate utilities with their page/feature
- Only move to `lib/` if used across multiple pages
- New projects go in `app/<project-name>/` with `page.tsx`, optional `util.ts`, and data files

### Testing

- Unit tests for core logic and calculations in `__tests__/*.spec.ts`
- Test edge cases and error conditions
- Run with `npm run test`

## Commands

- `npm run dev` — Dev server
- `npm run build` — Build (auto-lints first)
- `npm run lint` — ESLint
- `npm run prettier` — Check formatting
- `npm run prettier:fix` — Fix formatting
- `npm run test` — Run tests
