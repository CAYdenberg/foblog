import { FreshContext, Handler } from "$fresh/server.ts";
import { preloadAssembler } from "../../preload/index.ts";
import { PreloadFulfilled } from "../../preload/types.ts";
import { getPost, PostTy } from "../index.ts";

interface PostHandlerOptions {
  decodeUrl: (url: string | URL, context: FreshContext) => string;
}

const defaultPostHandlerOptions: PostHandlerOptions = {
  decodeUrl(_url, context) {
    const slug = context.params.slug;
    return slug;
  },
};

export interface PostHandlerProps {
  post: PostTy;
  preloads: PreloadFulfilled[];
}

export const PostHandler = (
  options?: Partial<PostHandlerOptions>,
): Handler<PostHandlerProps> => {
  const { decodeUrl } = { ...defaultPostHandlerOptions, ...options };

  return async (request, context) => {
    const slug = decodeUrl(request.url, context);

    const post = await getPost(slug);
    if (!post) {
      return context.renderNotFound();
    }

    const preloads = await preloadAssembler.assemble(
      request,
      context,
      post.content,
    );

    return context.render({ post, preloads });
  };
};
