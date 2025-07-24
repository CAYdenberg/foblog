import { Handler } from "$fresh/server.ts";
import { exists } from "$std/fs/exists.ts";
import { FreshContext, z } from "../../deps.ts";
import { warn } from "../../log.ts";
import { getErrorMessage, HttpError } from "../../errors.ts";
import { parseQuery } from "../../parsers/index.ts";
import { Repository } from "../../storage/db.ts";
import { getAttachmentPath, getContentPath } from "../../storage/disk.ts";
import { image } from "../model/index.ts";

interface ImageParams {
  slug: string;
  width?: number;
}

interface ImageHandlerOptions {
  decodeUrl: (url: string | URL, context: FreshContext) => ImageParams;
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
): Handler => {
  const { decodeUrl } = {
    ...defaultImageHandlerOptions,
    ...options,
  };

  return async (request, context) => {
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

    const imageData = await Repository(image).get(params.slug);

    if (!imageData) {
      warn(`Image ${params.slug} not found`);
      return new HttpError(404).toHttp();
    }

    const sizes = imageData.sizes.slice().sort((a, b) => a.size - b.size);
    const size = typeof params.width === "number"
      ? sizes.find((size) => size.size >= (params.width as number))
      : null;

    const attachmentPath = size
      ? getAttachmentPath(size?.filename, context)
      : null;

    if (attachmentPath && await exists(attachmentPath)) {
      const file = await Deno.open(attachmentPath, { read: true });
      return new Response(file.readable);
    }

    const originalFilePath = getContentPath(imageData.originalFilename);
    if (await exists(originalFilePath)) {
      const file = await Deno.open(originalFilePath, { read: true });
      return new Response(file.readable);
    }

    return new HttpError(404).toHttp();
  };
};
