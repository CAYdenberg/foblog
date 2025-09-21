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

export interface FoblogState {
  foblog: {
    config: FoblogPluginConfig;
  } & FoblogContext;
}

class Foblog {
  private config: FoblogPluginConfig;
  private context: FoblogContext;
  private contentBuilder: ContentBuilder;

  constructor(config?: ConfigSetter) {
    this.config = setConfig(config);
    this.contentBuilder = new ContentBuilder(post, page, image);
    this.context = this.config.isDev
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

  public middleware() {
    return async (ctx: FreshContext<FoblogState>) => {
      ctx.state.foblog = {
        ...this.context,
        config: this.config,
      };

      return await ctx.next();
    };
  }
}

export default Foblog;
