/// <reference lib="deno.unstable" />

import { warn } from "../log.ts";
import { Model } from "../lib/model/Model.ts";

let kv: Deno.Kv;

export const startDb = (db?: Deno.Kv) => {
  if (db) {
    kv = db;
  }
};

export const Repository = <S extends { slug: string }>(model: Model<S>) => {
  return {
    getAll: async () => {
      const all = kv.list<S>({ prefix: ["fob", model.name] });
      const results: Array<S & { slug: string }> = [];
      for await (const item of all) {
        results.push({ ...item.value, slug: item.key[2] as string });
      }
      return results;
    },

    get: async (slug: string) => {
      const result = await kv.get<S>(["fob", model.name, slug]);
      return result ? result.value : null;
    },

    upsert: (slug: string, data: S) => {
      const match = model.schema.safeParse(data);
      if (match.success) {
        return kv.set(["fob", model.name, slug], match.data).then(() => {
          return true;
        }).catch((err) => {
          warn(`Error while writing: ${model.name}; Slug: ${slug}`);
          throw err;
        });
      }
      throw match.error;
    },

    remove: (slug: string) => {
      return kv.delete(["fob", model.name, slug]).then(() => true).catch(() =>
        false
      );
    },

    removeAll: async () => {
      const all = kv.list({ prefix: ["fob", model.name] });
      for await (const item of all) {
        kv.delete(item.key);
      }
      return true;
    },
  };
};

export const clearDb = async () => {
  const all = kv.list({ prefix: ["fob"] });
  for await (const item of all) {
    kv.delete(item.key);
  }
  return true;
};
