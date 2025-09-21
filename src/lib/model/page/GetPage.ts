import { Context, HandlerFn } from "fresh";
import { FoblogState } from "../../../plugin/index.ts";
import { preloadAssembler } from "../../../preload/index.ts";
import { PreloadFulfilled } from "../../../preload/types.ts";
import { PageTy } from "../../index.ts";
import type { MdastNodeTy } from "../../../parsers/index.ts";
import { HttpError } from "fresh";

type ContentRoot = MdastNodeTy.Root;

interface PageHandlerOptions {
  decodeUrl: (
    url: string | URL,
    context: Context<FoblogState>,
  ) => string;
}

const defaultPageHandlerOptions: PageHandlerOptions = {
  decodeUrl(_url, context) {
    const slug = context.params.slug;
    return slug;
  },
};

export interface PageProps {
  page: PageTy & { content: ContentRoot };
  preloads: PreloadFulfilled[];
}

export const PageHandler = (
  options?: Partial<PageHandlerOptions>,
): HandlerFn<PageProps, FoblogState> => {
  const { decodeUrl } = { ...defaultPageHandlerOptions, ...options };

  return async (context) => {
    const slug = decodeUrl(context.req.url, context);
    const foblog = context.state.foblog;

    const page = await Promise.all([
      foblog.getItem<PageTy>("page", slug),
      foblog.getContent("page", slug),
    ]).then(([model, content]) => {
      if (!model || !content) return null;
      return { ...model, content };
    }).catch(() => null);

    if (!page) {
      throw new HttpError(404);
    }

    const preloads = await preloadAssembler.assemble(
      context.req,
      context,
      page.content,
    );

    return { data: { page, preloads } };
  };
};
