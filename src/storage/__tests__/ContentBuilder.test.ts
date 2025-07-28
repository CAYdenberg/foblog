import { ContentBuilder } from "../ContentBuilder.ts";
import { setConfig, setFreshConfig } from "../../plugin/config.ts";
import { assert, path } from "../../deps.ts";
import { page } from "../../lib/index.ts";
import { smooshResources } from "../disk.ts";

if (!import.meta.dirname) {
  throw new Error("TestNoLocalFs");
}
const dirname = import.meta.dirname;

setConfig((config) => {
  return {
    ...config,
    log: false,
    contentDir: "src/storage/__content__",
  };
});

setFreshConfig({
  build: {
    outDir: path.join(dirname, "../tmp"),
  },
});

Deno.test("ContentBuilder: init and analyze Ls", async () => {
  const contentBuilder = new ContentBuilder(page);

  const ls = await contentBuilder.init();
  const resources = smooshResources(ls).filter((res) => res.type === "page");
  assert.assertEquals(resources.length, 2);

  await Deno.remove(path.join(dirname, "../tmp"), { recursive: true });
});
