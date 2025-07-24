import { getBlogList, PaginationOptions } from "../model/index.ts";
import { CreateMd, ShortcodeComponents } from "./CreateMd.tsx";
import { config } from "../../plugin/config.ts";
import { Handler } from "$fresh/server.ts";
import { renderToString } from "../../deps.ts";
import { FoblogContext, getPost } from "foblog";
import { getPlainText } from "../../parsers/markdown/metadata.ts";

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
): Handler<unknown, FoblogContext> => {
  const _options = {
    ...jsonFeedHandlerOptionsDefaults,
    ...options,
  };

  const getBlogListFromUrl = getBlogList(_options);

  return async (req, ctx) => {
    const { posts, pagination } = await getBlogListFromUrl(ctx.state)(req.url);
    const getPostBySlug = getPost(ctx.state);

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
