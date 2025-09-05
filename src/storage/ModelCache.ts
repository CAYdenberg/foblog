import { log, warn } from "../log.ts";
import type { BaseSchema, Model } from "../lib/index.ts";

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

const kvSet = <D>(
  modelName: string,
  filename: string,
  extension: string,
  functionName: string,
  data: D & { checksum: string },
) => {
  if (!kv) return null;
  return kv.set(["fob", modelName, filename, extension, functionName], data);
};

const kvGet = <D>(
  modelName: string,
  filename: string,
  extension: string,
  functionName: string,
) => {
  if (!kv) return Promise.resolve(null);
  return kv.get<D & { checksum: string }>([
    "fob",
    modelName,
    filename,
    extension,
    functionName,
  ]);
};

export const wrapWithCache = <S extends BaseSchema>(
  model: Model<S>,
): Model<S> => {
  console.log(model.name);

  return { ...model };
};
