import { z } from "../../deps.ts";
import { MdastNode } from "../../parsers/markdown/MdastNode.ts";

export interface FileHandle {
  filename: string;
  extension: string;
  defaultSlug: string;
  getData: () => Uint8Array;
}

export interface BaseSchema {
  slug: string;
  rev: string;
  filename: string;
  extension: string;
}

export interface Model<S extends BaseSchema> {
  name: string;

  schema: z.Schema<S>;

  getResource?: (file: FileHandle) => Promise<S | null>;

  getData?: (file: FileHandle) => MdastNode;
}

// deno-lint-ignore no-explicit-any
export type AnyModel = Model<BaseSchema & any>;
