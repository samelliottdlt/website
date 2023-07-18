import { parsePost } from "../../../lib/posts";
import "@highlightjs/cdn-assets/styles/default.min.css";

async function Post({ params }: { params: { slug: string } }) {
  const post = await parsePost(params.slug);
  return (
    <div className="m-5">
      <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold leading-8 tracking-tight text-indigo-600">
          {post.title}
        </h2>
        <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
      </div>
    </div>
  );
}

export default Post;
