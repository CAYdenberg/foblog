/// <reference lib="deno.unstable" />

import { FreshContext, Plugin } from "$fresh/server.ts";
import { image, page, post } from "../lib/index.ts";
import { ContentBuilder } from "../storage/ContentBuilder.ts";
import { ConfigSetter, setConfig, setFreshConfig } from "./config.ts";
import { createFoblogContext } from "./middleware.ts";

const MODELS = [post, page, image];

let contentBuilder: ContentBuilder;

const foblogMiddleware = async (_req: Request, ctx: FreshContext) => {
  setFreshConfig(ctx.config);

  const context = createFoblogContext(MODELS, ctx.config.dev);

  return await ctx.next();
};

export default (config: ConfigSetter): Plugin => {
  setConfig(config);
  contentBuilder = new ContentBuilder(...MODELS);

  return {
    name: "foblog",

    buildStart: async (freshConfig) => {
      setFreshConfig(freshConfig);
      await contentBuilder.init();
      await contentBuilder.buildAll();
    },

    middlewares: [{ middleware: { handler: foblogMiddleware }, path: "" }],
  };
};
