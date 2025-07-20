import { parsePost } from "../parser";
import "@highlightjs/cdn-assets/styles/github.min.css";

async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { content, frontmatter } = await parsePost(slug);

  return (
    <div className="m-5">
      <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold leading-8 tracking-tight text-indigo-600">
          {frontmatter.title}
        </h2>
        {content}
      </div>
    </div>
  );
}

export default Post;
