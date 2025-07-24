import { FoblogContext } from "foblog";
import { ImageTy } from "./image.ts";

export const getImage =
  (fob: FoblogContext) => async (slug: string, width?: number) => {
    const data = await fob.getItem<ImageTy>("image", slug);
    if (!data) return null;

    if (typeof width === "undefined" || !data.variants) {
      return fob.getAttachment("image", data, null);
    }

    // sort the sizes in ASC order, then find the first one that is larger
    // than the reqeusted size.
    const neededSize = data.variants?.map((variant) => parseInt(variant))
      .filter((size) => !isNaN(size)).sort((a, b) => a - b).find((size) =>
        size >= width
      );

    return fob.getAttachment("image", data, neededSize?.toString() || null);
  };
