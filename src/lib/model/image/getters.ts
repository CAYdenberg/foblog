import { warn } from "../../../log.ts";
import { Repository } from "../../../storage/db.ts";
import { image } from "./image.ts";

export const getImage = (slug: string) => {
  return Repository(image).get(slug).then((result) => {
    if (!result) {
      warn(`Image ${slug} not found in database`);
    }
    return result;
  });
};
