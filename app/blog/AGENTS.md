# Blog

The blog reads local files from `posts/` and renders them through
`next-mdx-remote`.

- Every post is an `.mdx` file with `title`, `date`, and `description`
  frontmatter.
- `parser.tsx` owns post discovery, reverse-date sorting, MDX compilation,
  syntax highlighting, and custom MDX components.
- The index uses the filename as the slug. Keep links and `[slug]` resolution
  consistent with that convention.
- Keep filesystem and MDX compilation code server-only.
- Register reusable MDX components in the central `components` map rather than
  adding page-specific parsing paths.
- Posts are trusted repository content. Do not extend this pipeline to execute
  untrusted user-supplied MDX.
