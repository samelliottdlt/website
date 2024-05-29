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

export function getSortedPostsData(): Post[] {
  // Get file names under /posts
  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData: Post[] = fileNames.map((fileName) => {
    const id = fileName.replace(/\.mdx$/, "");
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const matterResult = matter(fileContents);

    return {
      id,
      ...matterResult.data,
    } as Post;
  });

  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

export interface PostData {
  id: string;
  date: string;
  title: string;
}

const components = {
  h1: (props: object) => <h1 className="text-4xl font-bold" {...props} />,
  h2: (props: object) => <h2 className="text-3xl font-bold" {...props} />,
  h3: (props: object) => <h3 className="text-2xl font-bold" {...props} />,
  h4: (props: object) => <h4 className="text-xl font-bold" {...props} />,
  h5: (props: object) => <h5 className="text-lg font-bold" {...props} />,
  h6: (props: object) => <h6 className="text-base font-bold" {...props} />,
  img: (props: object) => <img className="max-w-full h-auto" {...props} />,
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
  const fullPath = path.join(postsDirectory, `${slug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, "utf8");

  const { content, frontmatter } = await compileMDX({
    source: fileContents,
    components,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        rehypePlugins: [rehypeHighlight],
      },
    },
  });

  return {
    content,
    frontmatter: frontmatter as unknown as PostData,
  };
}

export function getAllPostIds() {
  const fileNames = fs.readdirSync(postsDirectory);

  return fileNames.map((fileName) => {
    return {
      params: {
        id: fileName.replace(/\.md$/, ""),
      },
    };
  });
}
