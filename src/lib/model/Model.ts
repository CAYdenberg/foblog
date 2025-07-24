import { z } from "../../deps.ts";
import { MdastNode } from "../../parsers/markdown/MdastNode.ts";
import { PreloadPending } from "../../preload/types.ts";

export interface FileHandle {
  filename: string;
  extension: string;
  defaultSlug: string;
  getData: () => Promise<Uint8Array>;
}

export interface BaseSchema {
  slug: string;
  rev: string;
  filename: string;
  extension: string;
}

export interface Attachment {
  variant: string;
  data: Uint8Array;
}

export interface Model<S extends BaseSchema> {
  name: string;

  schema: z.Schema<S>;

  getResource?: (file: FileHandle) => Promise<S | S[] | null>;

  getData?: (
    resource: S,
    file: FileHandle,
  ) => Promise<
    {
      contents?: MdastNode;
      preloads?: PreloadPending[];
      attachments?: Attachment[];
    }
  >;
}

// deno-lint-ignore no-explicit-any
export type AnyModel = Model<BaseSchema & any>;
