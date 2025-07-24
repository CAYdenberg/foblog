import { FreshContext } from "$fresh/server.ts";
import { HttpError } from "../errors.ts";
import { MdastNodeTy } from "../parsers/index.ts";

export interface PreloadPending {
  key: string;
  query: (
    request: Request,
    context: FreshContext,
  ) => Promise<MdastNodeTy.MdastNode>;
}

export interface PreloadFulfilled {
  key: string;
  preloadStatus: "fulfilled";
  data: MdastNodeTy.MdastNode;
}

export interface PreloadErrored {
  key: string;
  preloadStatus: "error";
  error: Error | HttpError | unknown;
}

export type Preloader = (
  node: MdastNodeTy.MdastNode,
) => PreloadPending | Array<PreloadPending> | null;
