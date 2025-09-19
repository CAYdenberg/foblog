import { PageProps } from "$fresh/server.ts";
import { BlogListHandler, BlogListHandlerProps } from "foblog";
import { Wrapper } from "../../components/Wrapper.tsx";
import { Paginator } from "foblog";

export const handler = BlogListHandler();

export default function BlogPage(
  { url, data }: PageProps<BlogListHandlerProps>,
) {
  const { posts, pagination } = data;

  return (
    <Wrapper url={url} pageTitle="Blog">
      <div class="container max-w-3xl mx-auto">
        <h1 class="text-info text-2xl font-bold my-4">
          Blog
        </h1>

        <hr className="my-4" />

        {posts.map((post) => (
          <a key={post.slug} class="block my-2" href={`/blog/${post.slug}`}>
            <h3 class="text-primary text-xl">{post.title}</h3>
            <p class="text-sm/tight">{post.summary}</p>
          </a>
        ))}

        <hr className="my-4" />

        <Paginator
          {...pagination}
          className={{
            root: "flex flex-row items-center",
            button: "text-md text-info",
            disabledButton: "opacity-50",
            text: "m-0 flex-grow text-center",
          }}
        />
      </div>
    </Wrapper>
  );
}
