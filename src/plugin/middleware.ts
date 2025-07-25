import { FreshContext } from "$fresh/server.ts";
import { BaseSchema } from "../lib/model/Model.ts";
import { MdastNode } from "../parsers/markdown/MdastNode.ts";
import { PreloadFulfilled, PreloadPending } from "../preload/types.ts";
import { setFreshConfig } from "./config.ts";

export interface FoblogData {
  getAll: <S extends BaseSchema>(type: string) => Promise<S>;
  getItem: <S extends BaseSchema>(type: string, slug: string) => Promise<S>;
  getResourceFromXRef: (
    xref: string,
  ) => Promise<{ type: string; slug: string } | null>;
  getAttachment: (
    type: string,
    slug: string,
    variant: string,
  ) => ReadableStream<Uint8Array> | Promise<Uint8Array>;
  getContent: (
    type: string,
    slug: string,
  ) => Promise<{ content: MdastNode; preloads: PreloadFulfilled[] }>;
}

export const foblogMiddleware = async (
  _req: Request,
  ctx: FreshContext<FoblogData>,
) => {
  setFreshConfig(ctx.config);

  return await ctx.next();
};
