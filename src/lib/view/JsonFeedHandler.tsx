import { CreateMd, ShortcodeComponents } from "./CreateMd.tsx";
import { config } from "../../plugin/config.ts";
import { HandlerFn } from "fresh";
import { renderToString } from "../../deps.ts";
import { getPlainText } from "../../parsers/markdown/metadata.ts";
import { FoblogState } from "../../plugin/index.ts";
import { GetBlogList, PaginationOptions } from "../model/index.ts";
import { BlogListProps, PostTy } from "../index.ts";
import { MdastNodeTy } from "../../parsers/index.ts";

interface JsonFeedHandlerOptions extends Omit<PaginationOptions, "decodeUrl"> {
  shortcodeComponents: ShortcodeComponents;
}

const jsonFeedHandlerOptionsDefaults: JsonFeedHandlerOptions = {
  perPage: 10,
  encodeUrl: (page: number) => `${config.posts.feedUrl}?page=${page}`,
  shortcodeComponents: {},
};

export const JsonFeedHandler = (
  options: Partial<JsonFeedHandlerOptions> = {},
): HandlerFn<unknown, FoblogState> => {
  const _options = {
    ...jsonFeedHandlerOptionsDefaults,
    ...options,
  };
  const getBlogList = GetBlogList(options);

  return async (ctx) => {
    const data = await getBlogList(ctx);
    const { posts, pagination } = data as unknown as BlogListProps;
    const getPostBySlug = (slug: string) =>
      ctx.state.foblog.getItem<PostTy & { content: MdastNodeTy.Root }>(
        "post",
        slug,
      );

    const Md = CreateMd({ shortcodeComponents: _options.shortcodeComponents });
    const createItem = (slug: string) =>
      getPostBySlug(slug).then((post) => {
        if (!post) return null;
        const content_text = getPlainText(post.content);
        const content_html = renderToString(<Md node={post.content} />);
        return {
          id: post.slug,
          url: `${config.siteUrl}/blog/${post.slug}`,
          title: post.title,
          content_text,
          content_html,
          summary: post.summary || content_text?.slice(0, 240),
          image: post.image,
          banner_image: post.banner_image,
          date_published: post.date_published,
          author: post.author || config.siteMainAuthor,
        };
      });

    const items = await Promise.all(posts.map((post) => createItem(post.slug)));

    const feed = {
      version: "https://jsonfeed.org/version/1",
      title: config.siteTitle,
      home_page_url: config.siteUrl,
      feed_url: config.posts.feedUrl,
      description: config.siteDescription,
      favicon: config.siteUrl ? `${config.siteUrl}/favicon.ico` : undefined,
      author: config.siteMainAuthor,
      next_url: pagination.url.next,
      items,
    };

    return new Response(JSON.stringify(feed), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  };
};
