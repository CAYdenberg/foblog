import { log, warn } from "../log.ts";
import type { BaseSchema, FileHandle, Model } from "../lib/index.ts";
import { ContentRoot } from "foblog";

let kv: Deno.Kv | undefined;
try {
  kv = await Deno.openKv();
  log("Running with KV cache");
} catch (_err) {
  // do nothing, just run without kv
}

export const warnIfNoKv = () => {
  if (!kv) {
    warn("Add `--unstable-kv` to start task to enable development cache");
  }
};

const store = <D>(modelName: string, functionName: string) => {
  return {
    get: (file: FileHandle) => {
      if (!kv) return Promise.resolve(null);
      return kv.get<{ data: D; checksum: string }>([
        "fob",
        modelName,
        functionName,
        file.filename,
        file.extension,
      ]);
    },

    set: (file: FileHandle, data: D) => {
      if (!kv) return null;
      return kv.set(
        ["fob", modelName, functionName, file.filename, file.extension],
        {
          data,
          checksum: file.checksum,
        },
      );
    },
  };
};

export const wrapWithCache = <S extends BaseSchema>(
  model: Model<S>,
): Model<S> => {
  if (!kv) return model;

  return {
    ...model,
    resourcesFromFile: async (file) => {
      const { get, set } = store<ReturnType<typeof model.resourcesFromFile>>(
        model.name,
        "resourcesFromFile",
      );

      const cached = await get(file);
      if (cached?.value?.checksum === file.checksum) return cached.value.data;

      const result = await model.resourcesFromFile(file);
      set(file, result);
      return result;
    },

    getContent: model.getContent
      ? async (resource, file) => {
        const { get, set } = store<ContentRoot>(model.name, "getContent");

        const cached = await get(file);
        if (cached?.value?.checksum === file.checksum) return cached.value.data;

        const result = await model.getContent!(resource, file);
        set(file, result);
        return result;
      }
      : undefined,

    getAttachments: model.getAttachments
      ? async (resource, file, getDestPath) => {
        const { get, set } = store<string[]>(model.name, "getAttachments");

        const cached = await get(file);
        if (cached?.value?.checksum === file.checksum) return cached.value.data;

        const result = await model.getAttachments!(resource, file, getDestPath);
        set(file, result);
        return result;
      }
      : undefined,
  };
};
