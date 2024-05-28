import { getSortedPostsData } from "./parser";

function Blog({ params }: { params: { slug: string } }) {
  const posts = getSortedPostsData();
  console.log(params.slug);
  return (
    <div className="m-5">
      <ul role="list" className="divide-y divide-gray-200">
        {posts.map((post) => (
          <li
            key={post.id}
            className="relative bg-white py-5 px-4 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 hover:bg-gray-50"
          >
            <div className="flex justify-between space-x-3">
              <div className="min-w-0 flex-1">
                <a
                  href={`blog/${post.id}`}
                  className="block focus:outline-none"
                >
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="truncate text-sm text-gray-500">{post.title}</p>
                </a>
              </div>
              <time
                dateTime={post.date}
                className="flex-shrink-0 whitespace-nowrap text-sm text-gray-500"
              >
                {post.date}
              </time>
            </div>
            <div className="mt-1">
              <p className="text-sm text-gray-600 line-clamp-2">
                {post.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Blog;
