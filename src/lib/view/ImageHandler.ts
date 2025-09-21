import { Context, HandlerFn } from "fresh";
import { z } from "../../deps.ts";
import { warn } from "../../log.ts";
import { getErrorMessage, HttpError } from "../../errors.ts";
import { parseQuery } from "../../parsers/index.ts";
import { FoblogState } from "../../plugin/index.ts";
import { ImageTy } from "../model/index.ts";

interface ImageParams {
  slug: string;
  width?: number;
}

interface ImageHandlerOptions {
  decodeUrl: (
    url: string | URL,
    context: Context<FoblogState>,
  ) => ImageParams;
}

const queryParser = parseQuery(z.object({
  width: z.coerce.number().optional(),
}));

const defaultImageHandlerOptions: ImageHandlerOptions = {
  decodeUrl: (url, context) => {
    const _url = typeof url === "string" ? new URL(url) : url;
    const parsedQuery = queryParser(_url.search);
    const slug = context.params.slug;
    return {
      slug,
      width: parsedQuery.width,
    };
  },
};

export const ImageHandler = (
  options?: Partial<ImageHandlerOptions>,
): HandlerFn<unknown, FoblogState> => {
  const { decodeUrl } = {
    ...defaultImageHandlerOptions,
    ...options,
  };

  return async (context: Context<FoblogState>) => {
    let params: ImageParams;
    try {
      params = decodeUrl(context.req.url, context);
    } catch (err) {
      warn(getErrorMessage(err));
      throw new HttpError(400);
    }

    const fob = context.state.foblog;

    const data = await fob.getItem<ImageTy>("image", params.slug);
    if (!data) {
      throw new HttpError(404);
    }

    if (typeof params.width === "undefined" || !data.variants) {
      const attachment = await fob.getAttachment("image", data, null);
      if (!attachment) {
        throw new HttpError(404);
      }
      return new Response(attachment);
    }

    // sort the sizes in ASC order, then find the first one that is larger
    // than the reqeusted size.
    const neededSize = data.variants?.map((variant) => parseInt(variant))
      .filter((size) => !isNaN(size)).sort((a, b) => a - b).find((size) =>
        size >= params.width!
      );

    const attachment = await fob.getAttachment(
      "image",
      data,
      neededSize?.toString() || null,
    );

    if (!attachment) {
      throw new HttpError(404);
    }
    return new Response(attachment);
  };
};
