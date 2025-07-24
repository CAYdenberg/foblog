import { z } from "../../../deps.ts";
import {
  getPostMetadata,
  MdastNodeTy,
  parseMd,
} from "../../../parsers/index.ts";
import { getContentType } from "../../../parsers/markdown/metadata.ts";
import { disambiguateTitle } from "../../../parsers/title.ts";
import { Model } from "../Model.ts";

export const PostSchema = z.object({
  slug: z.string(),
  title: z.string(),
  summary: z.string().optional(),
  content: z.any(),
  content_text: z.string().optional(),
  image: z.string().optional(),
  banner_image: z.string().optional(),
  date_published: z.string().optional(),
  date_modified: z.string().optional(),
  external_url: z.string().optional(),
  author: z
    .object({
      name: z.string().optional(),
      url: z.string().optional(),
      avatar: z.string().optional(),
    })
    .optional(),
});

export interface Author {
  name?: string;
  url?: string;
  avatar?: string;
}

export interface PostTy extends z.infer<typeof PostSchema> {
  content?: MdastNodeTy.Root;
}

export const post: Model<PostTy> = {
  name: "post",
  schema: PostSchema,
  onRead: (file) => {
    if (file.extension.toLowerCase() !== ".md") return Promise.resolve(null);

    const decoder = new TextDecoder("utf-8");
    const text = decoder.decode(file.data);
    const content = parseMd(text);
    if (getContentType(content) !== "Post") {
      return Promise.resolve(null);
    }

    const metadata = getPostMetadata(content);
    return Promise.resolve({
      slug: file.defaultSlug,
      ...metadata,
      title: disambiguateTitle(file.filename),
      content,
    });
  },
};
