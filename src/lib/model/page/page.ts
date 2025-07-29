import { z } from "../../../deps.ts";
import { getPostMetadata, parseMd } from "../../../parsers/index.ts";
import { getContentType } from "../../../parsers/markdown/metadata.ts";
import { disambiguateTitle } from "../../../parsers/title.ts";
import { Model } from "../Model.ts";

const PageSchema = z.object({
  slug: z.string(),
  title: z.string(),
  filename: z.string(),
  extension: z.literal(".md"),
});

export type PageTy = z.infer<typeof PageSchema>;

export const page: Model<PageTy> = {
  name: "page",

  schema: PageSchema,

  resourcesFromFile: (file) => {
    if (file.extension.toLowerCase() !== ".md") return null;
    const decoder = new TextDecoder("utf-8");
    const text = decoder.decode(file.data);
    const content = parseMd(text);
    const contentType = getContentType(content);
    if (contentType && contentType !== "Page") {
      return null;
    }
    const metadata = getPostMetadata(content);
    return {
      slug: metadata.slug || file.defaultSlug,
      title: disambiguateTitle(file.filename),
      filename: file.filename,
      extension: ".md",
    };
  },

  getContent: (_resource, file) => {
    const decoder = new TextDecoder("utf-8");
    const text = decoder.decode(file.data);
    const content = parseMd(text);
    return Promise.resolve(content);
  },
};
