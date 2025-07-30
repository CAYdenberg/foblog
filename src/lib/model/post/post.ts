import { z } from "../../../deps.ts";
import { getPostMetadata, parseMd } from "../../../parsers/index.ts";
import { getContentType } from "../../../parsers/markdown/metadata.ts";
import { disambiguateTitle } from "../../../parsers/title.ts";
import { Model } from "../Model.ts";

const AuthorSchema = z
  .object({
    name: z.string().optional(),
    url: z.string().optional(),
    avatar: z.string().optional(),
  });

const PostSchema = z.object({
  slug: z.string(),
  filename: z.string(),
  extension: z.literal(".md"),
  title: z.string(),
  summary: z.string().optional(),
  image: z.string().optional(),
  banner_image: z.string().optional(),
  date_published: z.string().optional(),
  date_modified: z.string().optional(),
  external_url: z.string().optional(),
  author: AuthorSchema.optional(),
});

export type PostTy = z.infer<typeof PostSchema>;

export type Author = z.infer<typeof AuthorSchema>;

export const post: Model<PostTy> = {
  name: "post",

  schema: PostSchema,

  resourcesFromFile: (file) => {
    if (file.extension.toLowerCase() !== ".md") return null;
    const decoder = new TextDecoder("utf-8");
    const text = decoder.decode(file.data);
    const content = parseMd(text);
    if (getContentType(content) !== "Post") {
      return null;
    }
    const metadata = getPostMetadata(content);
    return {
      slug: file.defaultSlug,
      ...metadata,
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
