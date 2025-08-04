import { z } from "../../deps.ts";
import { ContentRoot } from "../../mod.ts";

export interface FileHandle {
  filename: string;
  extension: string;
  defaultSlug: string;
  data: Uint8Array;
}

export interface BaseSchema {
  slug: string;
  filename: string;
  extension: string;
  variants?: string[];
}

export interface Model<S extends BaseSchema> {
  name: string;

  schema: z.Schema<S>;

  resourcesFromFile: (file: FileHandle) => S | S[] | null;

  getContent?: (
    resource: S,
    file: FileHandle,
  ) => Promise<ContentRoot>;

  getAttachments?: (
    resource: S,
    file: FileHandle,
    getDestPath: (variant: string) => string,
  ) => Promise<string[]>;
}

// deno-lint-ignore no-explicit-any
export type AnyModel = Model<BaseSchema & any>;
