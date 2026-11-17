# website

This is a personal Next.js site that houses my side projects.

## Getting Started

Install dependencies:

```bash
npm install
```

Start a development server with hot reload:

```bash
npm run dev
```

## Building

Before building, linting runs automatically. To create a production build:

```bash
npm run build
```

Run the production server after building:

```bash
npm run start
```

## Code Quality

Check lint rules:

```bash
npm run lint
```

Run the TypeScript 7 type checker:

```bash
npm run typecheck
```

Validate formatting with Prettier:

```bash
npm run prettier
```

Automatically fix formatting issues:

```bash
npm run prettier:fix
```

## Testing

Run the Jest test suite:

```bash
npm test
```

Debug tests with the Node inspector:

```bash
npm run test:inspect
```

## Dependency maintenance

Dependabot opens npm updates weekly. The **Website dependency maintenance**
automation in the Copilot app reconciles all open Dependabot PRs hourly, including
ones whose earlier audits failed or were missed. It runs locally under the owner's
GitHub account and requires the computer and Copilot app to be available.
Git attributes keep text checkouts LF-normalized so the same formatting checks
work on Windows and CI.

The automation starts merging only after this policy is on `main` and the old
`dependabot-audit` and `dependabot-auto-merge` workflows have been removed there.
It copies `.github/scripts/dependabot-merge.cjs` from the current `main` into its
session artifacts before checking out a PR, so a PR cannot replace its own gate.
The app's automation configuration is separate from the repository; this README
does not install or enable it.

The deterministic gate permits single-package and grouped stable patch/minor
updates that change only `package.json` and `package-lock.json`. It rejects majors,
0.x minor updates, prereleases, dependency additions/removals, range-operator
changes, install-script packages, and dependency-graph topology or other metadata
changes. Compatible version-range advances within existing locked dependency
edges are allowed.
Conservative refusals need review; they are not permission to bypass the gate.
Updates must use integrity-pinned npm registry packages.

To inspect an exact PR head without merging:

```bash
node .github/scripts/dependabot-merge.cjs --check PR_NUMBER HEAD_SHA
```

In an isolated, clean checkout of that exact head, the trusted copy can merge it:

```bash
node TRUSTED_GATE_PATH --merge PR_NUMBER HEAD_SHA
```

The merge command runs `npm ci`, formatting, lint, type checking, tests, and the
production build. It rechecks the head, base, remote checks (including deployment
statuses), and review blockers before an immediate SHA-guarded squash merge.
Branch protection remains enabled; there is no admin bypass, force push, or
queued auto-merge that could accidentally approve a later commit.

The automation can make bounded compatibility repairs on the existing Dependabot
branch. A repaired PR must pass fresh CI and the same gate; source/config changes,
major updates, and other non-low-risk changes are left for human review with
specific evidence and validation steps. It never closes PRs automatically.
