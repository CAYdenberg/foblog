/// <reference lib="deno.unstable" />

import { FreshContext, Plugin } from "$fresh/server.ts";
import { log } from "../log.ts";
import { createOutDirIfNotExists } from "../storage/disk.ts";
import { config, ConfigSetter, setConfig, setFreshConfig } from "./config.ts";

class Context {
  public isSetup: boolean;

  constructor() {
    this.isSetup = false;
  }

  public doSetup() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.isSetup = true;
        resolve();
      }, 0);
    });
  }
}

let context: Context;

const foblogMiddleware = async (_req: Request, ctx: FreshContext) => {
  setFreshConfig(ctx.config);

  console.log(context.isSetup);
  await context.doSetup();

  await createOutDirIfNotExists();

  return await ctx.next();
};

export default (config: ConfigSetter): Plugin => {
  setConfig(config);
  context = new Context();

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
