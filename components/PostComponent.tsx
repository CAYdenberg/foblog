import type { PostHandlerProps } from "foblog";
import { CreateMd, Icon } from "foblog";

import { postDate } from "../lib/datetime.ts";
import { Wrapper } from "./Wrapper.tsx";
import { ArrowLeft } from "./icons.tsx";

const Md = CreateMd();

export default function PostPage(props: PostHandlerProps) {
  const { post, preloads, url } = props;

  return (
    <Wrapper
      url={url}
      pageTitle="Blog"
      pageDescription={post.summary}
      pageSocialImage={post.image}
    >
      <img
        src={post.banner_image}
        alt={`Banner image for ${post.title}`}
      />
      <div class="container max-w-3xl mx-auto">
        <p class="text-xs font-bold my-4">
          <a href="/blog">
            <Icon icon={ArrowLeft} className="mr-2 inline" />
            <span>Blog</span>
          </a>
        </p>

        <h1 class="text-info text-2xl font-bold my-4">
          {post.title}
        </h1>
        <p class="text-xs font-bold my-4">
          {postDate(post.date_published)}
        </p>

        <hr className="my-4" />

        <div className="content">
          <Md node={post.content} preloads={preloads} />
        </div>

        <hr className="my-4" />

        <p class="text-xs font-bold my-4">
          <a href="/blog">
            <Icon icon={ArrowLeft} className="mr-2 inline" />
            <span>Blog</span>
          </a>
        </p>
      </div>
    </Wrapper>
  );
}
