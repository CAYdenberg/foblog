/// <reference lib="deno.unstable" />

import { FreshContext, Plugin } from "$fresh/server.ts";
import { image, page, post } from "../lib/index.ts";
import { ContentBuilder } from "../storage/ContentBuilder.ts";
import { ConfigSetter, setConfig, setFreshConfig } from "./config.ts";

let contentBuilder: ContentBuilder;

const foblogMiddleware = async (_req: Request, ctx: FreshContext) => {
  setFreshConfig(ctx.config);

  return await ctx.next();
};

export default (config: ConfigSetter): Plugin => {
  setConfig(config);
  contentBuilder = new ContentBuilder(post, page, image);

  return {
    name: "foblog",

    buildStart: async (freshConfig) => {
      setFreshConfig(freshConfig);
      const ls = await contentBuilder.init();
      await contentBuilder.buildAll();
      console.log(ls);
    },

    middlewares: [{ middleware: { handler: foblogMiddleware }, path: "" }],
  };
};
