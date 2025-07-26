import { FreshContext } from "$fresh/server.ts";
import { BaseSchema } from "../lib/model/Model.ts";
import { Root as MdastContent } from "../parsers/markdown/MdastNode.ts";
import { setFreshConfig } from "./config.ts";

export interface FoblogContext {
  getAll: <S extends BaseSchema>(type: string) => Promise<S[]>;

  getItem: <S extends BaseSchema>(
    type: string,
    slug: string,
  ) => Promise<S | null>;

  getResourceFromXRef: (
    xref: string,
  ) => Promise<{ type: string; slug: string } | null>;

  getAttachment: (
    type: string,
    slug: string,
    variant: string | null,
  ) => ReadableStream<Uint8Array> | null;

  getContent: (
    type: string,
    slug: string,
  ) => Promise<{ content: MdastContent }>;
}

export const foblogMiddleware = async (
  _req: Request,
  ctx: FreshContext<FoblogContext>,
) => {
  setFreshConfig(ctx.config);

  return await ctx.next();
};
