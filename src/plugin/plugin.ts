/// <reference lib="deno.unstable" />

import { FreshContext, Plugin } from "$fresh/server.ts";
import { log } from "../log.ts";
import { createOutDirIfNotExists } from "../storage/disk.ts";
import { config, ConfigSetter, setConfig, setFreshConfig } from "./config.ts";

const foblogMiddleware = async (_req: Request, ctx: FreshContext) => {
  setFreshConfig(ctx.config);
  console.log(config);

  await createOutDirIfNotExists();

  return await ctx.next();
};

export default (config: ConfigSetter): Plugin => {
  setConfig(config);

  return {
    name: "foblog",

    buildStart: async (freshConfig) => {
      setConfig(config);
      setFreshConfig(freshConfig);

      log("Building...");
      await createOutDirIfNotExists();
    },

    middlewares: [{ middleware: { handler: foblogMiddleware }, path: "" }],
  };
};
