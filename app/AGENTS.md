# App Router guidance

These rules apply to every route under `app/`.

- Each route is an independent feature. Keep its components, utilities, data,
  and scoped guidance in its route directory.
- Treat `page.tsx`, `layout.tsx`, `loading.tsx`, and metadata image files as
  framework entry points even when they have no explicit imports.
- Keep pages as Server Components unless interactivity requires a client
  component.
- Wrap client components that call `useSearchParams` in `Suspense`.
- Preserve the shared `Sidebar` and page scroll behavior in `layout.tsx`.
- Put site-wide behavior in the root layout; do not duplicate it per route.

The `/` route is intentionally minimal: it renders the animated gradient in
`page.css` and the referenced `/kiki-fly.svg` asset.
