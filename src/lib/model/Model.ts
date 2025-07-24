import { z } from "../../deps.ts";

export interface ReadData {
  filename: string;
  extension: string;
  defaultSlug: string;
  data: Uint8Array;
}

interface OnReadOptions {
  isUpdate: boolean;
}

interface BaseSchema {
  slug: string;
}

export interface Model<S extends BaseSchema> {
  name: string;

  schema: z.Schema<S>;

  onRead?: (
    file: ReadData,
    opts: OnReadOptions,
  ) => Promise<S | S[] | null>;

  onDelete?: (slug: string) => Promise<void>;
}

// deno-lint-ignore no-explicit-any
export type AnyModel = Model<BaseSchema & any>;
