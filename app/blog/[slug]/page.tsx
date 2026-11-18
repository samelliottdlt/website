import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostData, getPostSlugs, parsePost } from "../parser";
import "@highlightjs/cdn-assets/styles/github.min.css";

type PostPageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostData(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
  };
}

async function Post({ params }: PostPageProps) {
  const { slug } = await params;
  const parsed = await parsePost(slug);
  if (!parsed) notFound();

  const { content, post } = parsed;

  return (
    <div className="m-5">
      <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold leading-8 tracking-tight text-indigo-600">
          {post.title}
        </h2>
        {content}
      </div>
    </div>
  );
}

export default Post;
