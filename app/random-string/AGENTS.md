# Random string generator

This client tool generates strings from a configurable character set.

- `length` and `allowOverLimit` are URL-backed state; the character set and
  generated result are intentionally local state.
- Keep the default safety limit at one million characters unless requirements
  explicitly change.
- Large requests must generate in chunks and yield to the browser to avoid
  blocking the UI.
- Starting a new generation cancels the previous one.
- Preserve Ctrl/Cmd+Enter generation, clipboard status feedback, preset
  lengths, and UTF-8 byte-size reporting.
- Keep the page wrapped in `Suspense` because its state reads search params.
