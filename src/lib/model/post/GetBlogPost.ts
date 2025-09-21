import { Context, HandlerFn, HttpError } from "fresh";
import { MdastNodeTy, processMetadataXRef } from "../../../parsers/index.ts";
import { preloadAssembler } from "../../../preload/index.ts";
import { PreloadFulfilled } from "../../../preload/types.ts";
import { PostTy } from "../../index.ts";
import { FoblogState } from "../../../plugin/index.ts";

interface PostHandlerOptions {
  decodeUrl: (
    url: string | URL,
    context: Context<FoblogState>,
  ) => string;
}

const defaultPostHandlerOptions: PostHandlerOptions = {
  decodeUrl(_url, context) {
    const slug = context.params.slug;
    return slug;
  },
};

export interface PostProps {
  post: PostTy & { content: MdastNodeTy.Root };
  preloads: PreloadFulfilled[];
}

export const PostHandler = (
  options?: Partial<PostHandlerOptions>,
): HandlerFn<PostProps, FoblogState> => {
  const { decodeUrl } = { ...defaultPostHandlerOptions, ...options };

  return async (context) => {
    const slug = decodeUrl(context.req.url, context);
    const foblog = context.state.foblog;
    const xrefProcessor = processMetadataXRef(foblog);

    const post = await Promise.all([
      foblog.getItem<PostTy>("post", slug).then(async (model) => {
        if (!model) return model;
        const [image, banner_image] = await Promise.all([
          xrefProcessor(model.image),
          xrefProcessor(model.banner_image),
        ]);
        return { ...model, image, banner_image };
      }),
      foblog.getContent("post", slug),
    ]).then(([model, content]) => {
      if (!model || !content) return null;
      return { ...model, content };
    }).catch(() => null);

    if (!post) {
      throw new HttpError(404);
    }

    const preloads = await preloadAssembler.assemble(
      context.req,
      context,
      post.content,
    );

    return { data: { post, preloads } };
  };
};
