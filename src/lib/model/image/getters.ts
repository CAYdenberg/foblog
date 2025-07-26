import { FoblogContext } from "foblog";
import { ImageTy } from "./image.ts";

export const getImage =
  (fob: FoblogContext) => async (slug: string, width?: number) => {
    const data = await fob.getItem<ImageTy>("image", slug);
    if (!data) return null;

    // sort the sizes in ASC order, then find the first one that is larger
    // than the reqeusted size.

    if (typeof width === "undefined") {
      return fob.getAttachment("image", slug, null);
    }

    const neededSize = data.sizes.slice().sort((a, b) => a.size - b.size).find((
      size,
    ) => size.size > width);

    return fob.getAttachment(
      "image",
      slug,
      neededSize?.variant || null,
    );
  };
