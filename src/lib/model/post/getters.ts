import { processMetadataXRef } from "../../../parsers/index.ts";
import { FoblogContext } from "../../../plugin/index.ts";
import { Paginate } from "./index.ts";
import { Pagination, PaginationOptions } from "./pagination.ts";
import { PostTy } from "./post.ts";

export interface BlogList {
  posts: PostTy[];
  pagination: Pagination;
}

export const getBlogList = (options: Partial<PaginationOptions> = {}) => {
  const paginate = Paginate(options);

  return (data: FoblogContext) => {
    const xrefProcessor = processMetadataXRef(data);

    return async (
      url?: string | URL | null,
    ): Promise<BlogList> => {
      const all = await data.getAll<PostTy>("post");
      const pagination = paginate(all, url);

      // decorate posts with full URLs from image and banner_image
      const posts = await Promise.all(
        all.slice(pagination.params.skip, pagination.params.limit + 1).map(
          async (model) => {
            const [image, banner_image] = await Promise.all([
              xrefProcessor(model.image),
              xrefProcessor(model.banner_image),
            ]);
            return { ...model, image, banner_image };
          },
        ),
      );

      return {
        posts,
        pagination,
      };
    };
  };
};

export const getPost = (data: FoblogContext) => (slug: string) => {
  const xrefProcessor = processMetadataXRef(data);
  return Promise.all([
    data.getItem<PostTy>("post", slug).then(async (model) => {
      if (!model) return model;
      const [image, banner_image] = await Promise.all([
        xrefProcessor(model.image),
        xrefProcessor(model.banner_image),
      ]);
      return { ...model, image, banner_image };
    }),
    data.getContent("post", slug),
  ]).then(([model, content]) => {
    if (!model || !content) return null;
    return { ...model, content };
  }).catch(() => null);
};
