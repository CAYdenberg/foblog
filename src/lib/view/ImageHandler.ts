import { Handler } from "$fresh/server.ts";
import { FreshContext, z } from "../../deps.ts";
import { warn } from "../../log.ts";
import { getErrorMessage, HttpError } from "../../errors.ts";
import { parseQuery } from "../../parsers/index.ts";
import { FoblogContext } from "foblog";
import { getImage } from "../index.ts";

interface ImageParams {
  slug: string;
  width?: number;
}

interface ImageHandlerOptions {
  decodeUrl: (
    url: string | URL,
    context: FreshContext<FoblogContext>,
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
): Handler<unknown, FoblogContext> => {
  const { decodeUrl } = {
    ...defaultImageHandlerOptions,
    ...options,
  };

  return async (request, context: FreshContext<FoblogContext>) => {
    let params: ImageParams;
    try {
      params = decodeUrl(request.url, context);
    } catch (err) {
      warn(getErrorMessage(err));
      return new HttpError(
        400,
        `Unable to parse URL ${request.url}`,
      ).toHttp();
    }

    const attachment = await getImage(context.state)(params.slug, params.width);
    if (!attachment) {
      return new HttpError(404).toHttp();
    }
    return new Response(attachment);
  };
};
