# Game of the Year

This feature presents yearly picks from local data with optional server-fetched
artwork.

- `goty.json` is the canonical ordered list of winners and honorable mentions.
- Generate static params for every listed year and return `notFound()` for
  unknown years.
- `RAWG_API_KEY` is optional and server-only. Builds must succeed without it.
- Keep RAWG requests cached and never expose the API key to `GameDisplay`.
- Preserve the placeholder when no image is available and the pending state
  while navigating between years.
- Add a year by updating the data file; do not create a new route manually.
