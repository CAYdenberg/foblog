import { z } from "../../../deps.ts";
import {
  getPostMetadata,
  MdastNodeTy,
  parseMd,
} from "../../../parsers/index.ts";
import { getContentType } from "../../../parsers/markdown/metadata.ts";
import { disambiguateTitle } from "../../../parsers/title.ts";
import { Model } from "../Model.ts";

export const PageSchema = z.object({
  slug: z.string(),
  title: z.string(),
  content: z.any(),
});

export interface PageTy extends z.infer<typeof PageSchema> {
  content?: MdastNodeTy.Root;
}

export const page: Model<PageTy> = {
  name: "page",
  schema: PageSchema,
  onRead: (file) => {
    if (file.extension.toLowerCase() !== ".md") return Promise.resolve(null);

    const decoder = new TextDecoder("utf-8");
    const text = decoder.decode(file.data);
    const content = parseMd(text);
    const contentType = getContentType(content);
    if (contentType && contentType !== "Page") {
      return Promise.resolve(null);
    }

    const metadata = getPostMetadata(content);

    return Promise.resolve({
      slug: metadata.slug || file.defaultSlug,
      title: disambiguateTitle(file.filename),
      content,
    });
  },
};
