import { ContentBuilder } from "../ContentBuilder.ts";
import { setConfig, setFreshConfig } from "../../plugin/config.ts";
import { assert, path, z } from "../../deps.ts";
import { image, page, PageTy } from "../../lib/index.ts";
import { smooshResources } from "../disk.ts";
import { exists } from "$std/fs/exists.ts";

if (!import.meta.dirname) {
  throw new Error("TestNoLocalFs");
}
const dirname = import.meta.dirname;
const tmp = path.join(dirname, "../tmp");

setConfig((config) => {
  return {
    ...config,
    logLevel: false,
    contentDir: "src/storage/__content__",
  };
});
setFreshConfig({
  dev: false,
  build: {
    outDir: tmp,
  },
  // do not want to mock the entire Fresh config
  // deno-lint-ignore no-explicit-any
} as any);

Deno.test("ContentBuilder: init and analyze Ls", async () => {
  const contentBuilder = new ContentBuilder(page);

  const ls = await contentBuilder.init();
  const resources = smooshResources(ls).filter((res) => res.type === "page");
  assert.assertEquals(resources.length, 2);

  await Deno.remove(tmp, { recursive: true });
});

Deno.test("ContentBuilder: repos are successfully built", async () => {
  const contentBuilder = new ContentBuilder(page);

  await contentBuilder.init();
  await contentBuilder.buildAll();

  const text = await Deno.readTextFile(path.join(tmp, "fob/repo/page.json"));
  const pages: PageTy[] = JSON.parse(text);

  assert.assertEquals(pages.length, 2);
  assert.assertEquals(pages[0].extension, ".md");

  await Deno.remove(path.join(dirname, "../tmp"), { recursive: true });
});

Deno.test("ContentBuilder: build attachments", async () => {
  const contentBuilder = new ContentBuilder(image);

  await contentBuilder.init();
  await contentBuilder.buildAll();

  const attachmentExists = await exists(
    path.join(tmp, "fob/attachments/scerevisiae_200.jpg"),
  );
  assert.assert(attachmentExists);

  await Deno.remove(path.join(dirname, "../tmp"), { recursive: true });
});

const failingPage = {
  ...page,
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    filename: z.string(),
    extension: z.literal(".md"),
    propThatNeverExists: z.string(),
  }),
};

Deno.test("ContentBuilder: check resources", async () => {
  const contentBuilder = new ContentBuilder(failingPage);

  let didThrow = false;
  try {
    await contentBuilder.init();
  } catch (_) {
    didThrow = true;
  }
  assert.assert(didThrow);

  await Deno.remove(tmp, { recursive: true });
});
