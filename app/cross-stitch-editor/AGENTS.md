# Cross stitch editor

A client-side chart editor where each grid square holds a stitch instead of a
pixel.

- `util.ts` holds the pure pattern model, palette data, flood fill, resize,
  stitch counting, and the `encodePattern`/`decodePattern` share format. Keep
  those two functions mutually compatible and bump `PATTERN_VERSION` for
  breaking format changes.
- `render.ts` owns all canvas drawing so the on-screen chart and the PNG export
  stay identical. Full crosses draw both diagonals; `half-up` is `/` and
  `half-down` is `\`. Grid and guide lines share `strokeLines`, which uses
  `guideOffsets` (every `GUIDE_STEP`th line plus the far edge) and insets edge
  lines so the right and bottom borders are never clipped by the canvas.
- The default grid is `3 * GUIDE_STEP` squares per side so a new chart opens as
  a tidy 3x3 block of guides.
- `Editor.tsx` keeps browser state: tools, undo history, autosave, and pointer
  input. `patternRef` mirrors the pattern so fast drags never read stale state,
  and one drag collapses into one undo entry.
- The chart lives in a fixed-height scroll area that is measured with a
  `ResizeObserver`. While "Fit" is on, the square size follows `fitCellSize`
  so the whole chart stays visible; manual zooming turns it off. Keep the
  canvas wrapper sized to `max-content` so an enlarged chart scrolls instead of
  being clipped by the centering flexbox.
- The `p` query param carries an encoded pattern for sharing; `localStorage`
  under `cross-stitch-editor:pattern` is the local autosave. Invalid values in
  either source must fall back to a blank pattern instead of throwing.
- Grid sizes stay clamped between `MIN_GRID` and `MAX_GRID`.
- Keep the page wrapped in `Suspense` because the editor reads search params.
- Update `__tests__/cross-stitch-editor.spec.ts` when pattern logic or the
  encoding changes.
