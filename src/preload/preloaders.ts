import { Preloader } from "./types.ts";
import { config } from "../plugin/config.ts";
import { getImage } from "../lib/index.ts";
import { ResourceFinder } from "./ResourceFinder.ts";

export const preloadXLinks: Preloader = (node) => {
  if (node.type !== "xlink") return null;

  const xlinkNode = node;

  return {
    key: `xlink:${xlinkNode.filename}`,
    query: async () => {
      const findResources = await ResourceFinder();

      const resource = findResources(xlinkNode.filename).find((resource) => {
        return ["post", "page"].includes(resource.type);
      });

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
    query: async () => {
      const findResources = await ResourceFinder();

      const resource = findResources(imageNode.filename, imageNode.extension)
        .find((resource) => {
          return resource.type === "image";
        });
      if (!resource) {
        throw new Error("NotFound");
      }

      const image = await getImage(resource.slug);
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
