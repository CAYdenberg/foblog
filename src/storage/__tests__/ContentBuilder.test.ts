import { ContentBuilder } from "../ContentBuilder.ts";
import { setConfig } from "../../plugin/config.ts";
import { assert, path } from "../../deps.ts";
import { page } from "../../lib/index.ts";
import { smooshResources } from "../disk.ts";

setConfig((config) => {
  if (!import.meta.dirname) {
    throw new Error("TestNoLocalFs");
  }

  return {
    ...config,
    log: false,
    contentDir: path.join(import.meta.dirname, "../__content__"),
  };
});

Deno.test("ContentBuilder: init and analyze Ls", () => {
  const contentBuilder = new ContentBuilder(page);
  return contentBuilder.init().then((ls) => {
    const resources = smooshResources(ls).filter((res) => res.type === "page");
    assert.assertEquals(resources.length, 2);
  });
});
