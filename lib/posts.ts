import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import rehypeHighlight from "rehype-highlight";
import remarkParse from "remark-parse";
// package has no typings, just ignore
// @ts-ignore
import remarkOembed from "remark-oembed";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";

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
    const id = fileName.replace(/\.md$/, "");
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
  contentHtml: string;
  date: string;
  title: string;
}

export async function parsePost(id: string): Promise<PostData> {
  const fs = require("fs");
  const path = require("path");
  const markdownPath = path.join(process.cwd(), "posts", `${id}.md`);
  const markdownContent = fs.readFileSync(markdownPath, "utf-8");

  const matterResult = matter(markdownContent);

  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkOembed)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .process(matterResult.content);

  const contentHtml = processedContent.toString();

  return {
    id,
    contentHtml,
    ...matterResult.data,
  } as PostData;
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
