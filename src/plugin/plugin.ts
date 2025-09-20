/// <reference lib="deno.unstable" />

import type { Context as FreshContext } from "fresh";
import { image, page, post } from "../lib/index.ts";
import { ContentBuilder } from "../storage/ContentBuilder.ts";
import { Repository } from "../storage/Repository.ts";
import { ConfigSetter, setConfig } from "./config.ts";
import {
  createFoblogContextDev,
  createFoblogContextPrebuilt,
} from "./context.ts";
import { FoblogContext, FoblogPluginConfig } from "./index.ts";

class Foblog {
  private config: FoblogPluginConfig;
  private content: FoblogContext;
  private contentBuilder: ContentBuilder;

  constructor(config?: ConfigSetter) {
    this.config = setConfig(config);
    this.contentBuilder = new ContentBuilder(post, page, image);
    this.content = Deno.env.get("NODE_ENV") === "development"
      ? createFoblogContextDev(this.contentBuilder)
      : createFoblogContextPrebuilt({
        post: new Repository(post),
        page: new Repository(page),
        image: new Repository(image),
      });
  }

  public async build() {
    await this.contentBuilder.init();
    await this.contentBuilder.buildAll();
  }

  public handle(
    handler: (context: FreshContext<unknown>) => Promise<Response>,
  ) {
    return async (ctx: FreshContext<unknown>) => {
      const response = await handler(ctx);
      return response;
    };
  }
}

export default Foblog;
