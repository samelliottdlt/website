<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

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

Keep `README.md` focused on what the site does, repository contents, and essential
development commands. Put detailed coding-agent and maintenance workflows here.

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
- Lockfile `resolved` URLs must stay on `https://registry.npmjs.org/`; Vercel,
  GitHub Actions, and Dependabot install from the public registry. Some local
  machines are configured with a corporate npm mirror that cannot reach the
  public registry and lags recent releases, so `npm ci` fails there with 404s
  for newly published versions. Do not rewrite the lockfile against that mirror
  or downgrade packages to work around it. Run installs, lockfile changes, and
  full validation in a remote session (Codespace or cloud agent) with public
  registry access, or rely on GitHub Actions CI.
- TypeScript 7 provides `tsc` through `@typescript/native`. The `typescript`
  package intentionally aliases the TypeScript 6 compatibility package needed
  by Next.js and typescript-eslint until they support the TypeScript 7 API.
- `overrides` pins `glob` and `minimatch` inside the `jest` tree to patched
  majors (GHSA-3g3m-2fjr-6pw4, GHSA-g3hv-75wg-m249). Remove them once Jest
  depends on fixed versions directly.
- Keep runtime packages in `dependencies` and tooling in `devDependencies`.
- Do not add a package when the platform or an existing dependency provides the
  capability.

## Automated dependency maintenance

Dependabot opens npm updates weekly. The **Website dependency maintenance**
automation runs daily in the Copilot app, locally under the owner's GitHub
account. Its schedule and prompt are managed in the app, not this repository;
the computer and app must be available.

- Use `.github/scripts/dependabot-merge.cjs` as the deterministic merge gate.
  Copy it from freshly fetched `main` into session artifacts before checking out
  any PR; never execute a PR's replacement gate.
- Require the gate on `main` and the legacy `dependabot-audit` and
  `dependabot-auto-merge` workflows to be absent before automated writes.
- The coordinator starts one remote worker per qualifying PR, each with only
  that PR's context, and caps concurrent workers to avoid overlapping installs.
- Use `node TRUSTED_GATE_PATH --check PR_NUMBER HEAD_SHA` to inspect eligibility
  and tier, then merge in a clean, isolated checkout of that exact head.
- **Automatic tier** (`--merge`): stable forward updates, including majors, of
  tooling that cannot change shipped output (`@types/*`, ESLint, Prettier,
  Jest, TypeScript) and their tooling-only transitive packages, plus
  semver-compatible updates of everything else.
- **Runtime tier** (`--merge-runtime`): majors or 0.x minors reachable from
  runtime or build-affecting dependencies (for example Next.js, React, MDX,
  Tailwind), added runtime packages, metadata changes, and bounded `fix(deps):`
  repairs of at most 300 lines in `app/`, `components/`, `hooks/`, or `lib/`.
  Before using it, read release notes and migration guides, run the production
  build locally, and check every affected route in a browser for errors and
  working interactions. Leave the PR for human review when that is not possible.
- Always refused: prereleases, downgrades, changed range operators, direct
  dependency additions/removals, npm script or other manifest changes,
  install-script packages, non-registry or unpinned tarballs, license changes,
  more than three repair commits, and changes to tests, config, `.github/**`,
  or instruction files.
- The merge gate runs installation, formatting, lint, type checks, tests, build,
  and an HTTP smoke test of every static and prerendered route on a local
  production server. It rechecks the exact head/base, required CI, an
  up-to-date head, resolved review threads, deployment statuses, and review
  blockers before a SHA-guarded squash merge. Only regeneration of Next.js's
  managed `next-env.d.ts` is tolerated during validation.
- Never bypass a refusal, weaken protection, force-push, use admin merging, or
  queue auto-merge for an unvalidated later commit. Independently withhold updates
  with known advisories.
- After a repair push, wait for fresh CI on the new head before merging. The
  automation never closes PRs automatically.
- Remote workers need public npm, `fonts.googleapis.com`, and
  `fonts.gstatic.com` access because `next/font/google` downloads Inter during
  builds.

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
