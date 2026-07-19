# Coding agent guidance

## Instruction hierarchy

This is the canonical repository-wide instruction file. Do not create or
maintain a parallel `.github/copilot-instructions.md`; Copilot and other coding
agents support hierarchical `AGENTS.md` files.

When working in a directory, read this file and every nearer `AGENTS.md`.
Nested files supplement these rules with feature-specific behavior and
invariants.

## Project context

This is a personal Next.js App Router site containing independent interactive
tools and an MDX-backed blog. Use `package.json` and `.nvmrc` as the source of
truth for tool versions.

Before changing Next.js behavior, read the relevant documentation in
`node_modules/next/dist/docs/`. The installed docs take precedence over
remembered framework behavior.

## Repository map

- `app/`: routes and feature-specific code and data
- `components/`: reusable site-wide React components
- `hooks/`: reusable client hooks
- `lib/`: utilities shared by multiple features
- `posts/`: local MDX blog posts
- `styles/globals.css`: global Tailwind CSS entry point
- `public/`: referenced static assets
- `__tests__/`: Jest unit tests named `*.spec.ts`

Keep feature logic beside its route. Move code to a shared directory only when
multiple features use it.

## Implementation conventions

- Write strict TypeScript; do not bypass errors with `any` or unsafe casts.
- Use Server Components by default. Add `"use client"` only where browser APIs,
  state, effects, or event handlers require it, and keep the boundary low.
- Use kebab-case route directories, PascalCase components, and `useCamelCase`
  hooks.
- Prefer Tailwind utilities. Keep custom CSS limited to behavior that utilities
  cannot express clearly.
- Use Next.js primitives for links, images, fonts, metadata, and navigation.
- Preserve accessibility for forms, controls, keyboard interactions, images,
  and Headless UI components.
- Keep secrets server-side. Optional environment variables must not make a
  clean build fail when absent.
- Remove abandoned implementations and unreferenced assets instead of keeping
  speculative alternatives.

## Dependencies and generated files

- Use npm and commit `package-lock.json` with dependency changes.
- Do not edit `package-lock.json` or `next-env.d.ts` manually.
- TypeScript 7 provides `tsc` through `@typescript/native`. The `typescript`
  package intentionally aliases the TypeScript 6 compatibility package needed
  by Next.js and typescript-eslint until they support the TypeScript 7 API.
- Keep runtime packages in `dependencies` and tooling in `devDependencies`.
- Do not add a package when the platform or an existing dependency provides the
  capability.

## Validation

Use focused checks while iterating. Before finishing code or dependency work,
run:

```bash
npm run prettier
npm run lint
npm run typecheck
npm test
npm run build
```

Add or update Jest tests for calculation and utility behavior, including edge
cases and error paths.
