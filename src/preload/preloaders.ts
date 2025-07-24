import { Preloader } from "./types.ts";
import { config } from "../plugin/config.ts";
import { ImageTy } from "../lib/index.ts";

export const preloadXLinks: Preloader = (node) => {
  if (node.type !== "xlink") return null;

  const xlinkNode = node;

  return {
    key: `xlink:${xlinkNode.filename}`,
    query: async (_request, context) => {
      const resource = await context.state.getResourceFromXRef(
        xlinkNode.filename,
      );

      if (!resource) {
        throw new Error("NotFound");
      }

      return {
        ...xlinkNode,
        url: resource.type === "post"
          ? config.posts.permalink(resource.slug)
          : config.pages.permalink(resource.slug),
      };
    },
  };
};

export const preloadAttachmentImages: Preloader = (node) => {
  if (node.type !== "attachment") return null;

  const imageNode = node;

  return {
    key: `image:${imageNode.filename}${imageNode.extension}`,
    query: async (_request, context) => {
      const resource = await context.state.getResourceFromXRef(
        imageNode.filename,
      );
      if (!resource) {
        throw new Error("NotFound");
      }

      const image = await context.state.getItem<ImageTy>(
        "image",
        resource.slug,
      );
      if (!image) {
        throw new Error("NotFound");
      }

      return {
        ...imageNode,
        image,
      };
    },
  };
};
