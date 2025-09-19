/// <reference lib="deno.unstable" />

import type { Context as FreshContext } from "fresh";
import { image, page, post } from "../lib/index.ts";
import { ContentBuilder } from "../storage/ContentBuilder.ts";
import { AnyRepository, Repository } from "../storage/Repository.ts";
import { ConfigSetter, setConfig } from "./config.ts";
import {
  createFoblogContextDev,
  createFoblogContextPrebuilt,
} from "./context.ts";
import { FoblogContext, FoblogPluginConfig } from "./index.ts";

export default class {
  private config: FoblogPluginConfig;
  private contentBuilder: ContentBuilder;
  private repos: Record<string, AnyRepository>;

  constructor(config?: ConfigSetter) {
    this.config = setConfig(config);
    this.contentBuilder = new ContentBuilder(post, page, image);
    this.repos = {
      post: new Repository(post),
      page: new Repository(page),
      image: new Repository(image),
    };
  }

  public async build() {
    await this.contentBuilder.init();
    await this.contentBuilder.buildAll();
  }

  public handle(
    handler: (
      freshContext: FreshContext<unknown>,
      foblogContext: FoblogContext,
    ) => Promise<Response>,
  ) {
    return async (ctx: FreshContext<unknown>) => {
      const foblogContext = Deno.env.get("NODE_ENV")
        ? createFoblogContextDev(this.contentBuilder)
        : createFoblogContextPrebuilt(this.repos);

      const response = await handler(ctx, foblogContext);
      return response;
    };
  }
}
