/// <reference lib="deno.unstable" />

import { FreshContext, Plugin } from "$fresh/server.ts";
import { image, page, post } from "../lib/index.ts";
import { ContentBuilder } from "../storage/ContentBuilder.ts";
import { Repository } from "../storage/Repository.ts";
import { ConfigSetter, setConfig, setFreshConfig } from "./config.ts";
import {
  createFoblogContextDev,
  createFoblogContextPrebuilt,
} from "./context.ts";

let contentBuilder: ContentBuilder;
const repos = {
  post: new Repository(post),
  page: new Repository(page),
  image: new Repository(image),
};

const foblogMiddleware = async (_req: Request, ctx: FreshContext) => {
  setFreshConfig(ctx.config);

  const context = ctx.config.dev
    ? createFoblogContextDev(contentBuilder)
    : createFoblogContextPrebuilt(repos);

  ctx.state = { ...ctx.state, ...context };

  return await ctx.next();
};

export default (config: ConfigSetter): Plugin => {
  setConfig(config);
  contentBuilder = new ContentBuilder(post, page, image);

  return {
    name: "foblog",

    buildStart: async (freshConfig) => {
      setFreshConfig(freshConfig);
      await contentBuilder.init();
      await contentBuilder.buildAll();
    },

    middlewares: [{ middleware: { handler: foblogMiddleware }, path: "" }],
    islands: {
      baseLocation: import.meta.url,
      paths: [
        "../lib/view/ImgLazy.tsx",
      ],
    },
  };
};
