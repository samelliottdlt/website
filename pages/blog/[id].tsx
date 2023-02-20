import { GetStaticProps, GetStaticPropsContext } from "next";
import { ParsedUrlQuery } from "node:querystring";
import { getAllPostIds, parsePost, PostData } from "../../lib/posts";

interface StaticProps {
  post: PostData;
}

export async function getStaticPaths() {
  const paths = getAllPostIds();
  return {
    paths,
    fallback: false,
  };
}

interface Params extends ParsedUrlQuery {
  id: string;
}

export const getStaticProps: GetStaticProps<StaticProps, Params> = async ({
  params,
}: GetStaticPropsContext<Params>) => {
  const post = await parsePost(params!.id);
  return {
    props: {
      post,
    },
  };
};

export default function Post({ post }: StaticProps) {
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
