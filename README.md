# website

My personal website, built with Next.js App Router, React, TypeScript, and
Tailwind CSS. It contains an MDX blog and interactive side projects, including
calculators, game tools, a cross-stitch editor, and a music sequencer.

## Repository contents

- `app/`: pages, interactive tools, and feature-specific code and data
- `components/`, `hooks/`, `lib/`: shared UI, hooks, and utilities
- `posts/`: MDX blog posts
- `public/`, `styles/`: static assets and global styles
- `__tests__/`: Jest tests
- `AGENTS.md`: contributor and coding-agent guidance

## Development

Use the Node.js version in `.nvmrc`, then install dependencies and start the
development server:

```bash
npm ci
npm run dev
```

Create and serve a production build:

```bash
npm run build
npm run start
```

Run formatting, lint, type, and test checks:

```bash
npm run prettier
npm run lint
npm run typecheck
npm test
```
