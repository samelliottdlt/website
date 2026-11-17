import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import rehypeHighlight from "rehype-highlight";
import YoutubeEmbed from "../../components/YoutubeEmbed";

const postsDirectory = path.join(process.cwd(), "posts");

export type Post = {
  id: string;
  date: string;
  title: string;
  description: string;
};

const POST_EXTENSION = ".mdx";

function frontmatterString(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return typeof value === "string" ? value : "";
}

/** Returns the slugs of every post, derived from `.mdx` filenames. */
export function getPostSlugs(): string[] {
  return fs
    .readdirSync(postsDirectory)
    .filter((fileName) => fileName.endsWith(POST_EXTENSION))
    .map((fileName) => fileName.slice(0, -POST_EXTENSION.length));
}

function readPostSource(slug: string): string | null {
  // Only resolve known slugs so request input never reaches the filesystem.
  if (!getPostSlugs().includes(slug)) return null;
  return fs.readFileSync(
    path.join(postsDirectory, `${slug}${POST_EXTENSION}`),
    "utf8",
  );
}

function toPost(id: string, source: string): Post {
  const { data } = matter(source);
  return {
    id,
    date: frontmatterString(data.date),
    title: frontmatterString(data.title),
    description: frontmatterString(data.description),
  };
}

export function getPostData(slug: string): Post | null {
  const source = readPostSource(slug);
  return source === null ? null : toPost(slug, source);
}

export function getSortedPostsData(): Post[] {
  return getPostSlugs()
    .map((slug) => getPostData(slug))
    .filter((post): post is Post => post !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

const components = {
  h1: (props: object) => <h1 className="text-4xl font-bold" {...props} />,
  h2: (props: object) => <h2 className="text-3xl font-bold" {...props} />,
  h3: (props: object) => <h3 className="text-2xl font-bold" {...props} />,
  h4: (props: object) => <h4 className="text-xl font-bold" {...props} />,
  h5: (props: object) => <h5 className="text-lg font-bold" {...props} />,
  h6: (props: object) => <h6 className="text-base font-bold" {...props} />,
  // Using img element for MDX content where images come from markdown and need flexibility for external sources
  img: (props: object) => <img className="max-w-full h-auto" {...props} />, // eslint-disable-line @next/next/no-img-element, jsx-a11y/alt-text
  blockquote: (props: object) => (
    <blockquote className="border-l-4 border-gray-500 pl-4 italic" {...props} />
  ),
  code: (props: object) => (
    <code className="bg-gray-200 rounded px-1 py-0.5" {...props} />
  ),
  pre: (props: object) => (
    <pre className="rounded p-4 overflow-auto" {...props} />
  ),
  a: (props: object) => (
    <a className="text-blue-500 hover:underline" {...props} />
  ),
  ul: (props: object) => <ul className="list-disc list-inside" {...props} />,
  ol: (props: object) => <ol className="list-decimal list-inside" {...props} />,
  li: (props: object) => <li className="my-1" {...props} />,
  YoutubeEmbed: (props: object) => <YoutubeEmbed {...props} />,
};

export async function parsePost(slug: string) {
  const source = readPostSource(slug);
  if (source === null) return null;

  const { content } = await compileMDX({
    source,
    components,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        rehypePlugins: [rehypeHighlight],
      },
    },
  });

  return { content, post: toPost(slug, source) };
}
