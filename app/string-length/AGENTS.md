# UTF-8 length checker

This client tool compares JavaScript string length with UTF-8 byte size.

- The `text` query parameter is the shareable source of truth.
- Character count uses JavaScript's `string.length`; byte count uses the shared
  helpers in `lib/utf8.ts`. Keep the distinction visible to users.
- Reuse the shared formatter rather than implementing byte logic in the page.
- Keep the page wrapped in `Suspense` because it reads search params.
- Update `__tests__/utf8.spec.ts` when changing byte counting or formatting.
