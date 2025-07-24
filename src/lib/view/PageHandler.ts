import { FreshContext, Handler } from "../../deps.ts";
import { preloadAssembler } from "../../preload/index.ts";
import { PreloadFulfilled } from "../../preload/types.ts";
import { getPage, PageTy } from "../index.ts";

interface PageHandlerOptions {
  decodeUrl: (url: string | URL, context: FreshContext) => string;
}

const defaultPageHandlerOptions: PageHandlerOptions = {
  decodeUrl(_url, context) {
    const slug = context.params.slug;
    return slug;
  },
};

export interface PageHandlerProps {
  page: PageTy;
  preloads: PreloadFulfilled[];
}

export const PageHandler = (
  options?: Partial<PageHandlerOptions>,
): Handler<PageHandlerProps> => {
  const { decodeUrl } = { ...defaultPageHandlerOptions, ...options };

  return async (request, context) => {
    const slug = decodeUrl(request.url, context);

    const page = await getPage(slug);
    if (!page) {
      return context.renderNotFound();
    }

    const preloads = await preloadAssembler.assemble(
      request,
      context,
      page.content,
    );

    return context.render({ page, preloads });
  };
};
