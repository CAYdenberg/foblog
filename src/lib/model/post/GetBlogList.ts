import { HandlerFn } from "fresh";
import { FoblogState } from "../../../plugin/index.ts";
import {
  Paginate,
  Pagination,
  PaginationOptions,
  type PostTy,
} from "../index.ts";
import { processMetadataXRef } from "../../../parsers/markdown/metadata.ts";

export type GetBlogListOptions = PaginationOptions;

export interface BlogListProps {
  posts: PostTy[];
  pagination: Pagination;
}

export const GetBlogList = (
  options?: Partial<GetBlogListOptions>,
): HandlerFn<BlogListProps, FoblogState> => {
  const paginate = Paginate(options);

  return async (context) => {
    const state = context.state;
    const xrefProcessor = processMetadataXRef(state.foblog);
    const all = await state.foblog.getAll<PostTy>("post");
    const pagination = paginate(all, context.req.url);

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
      data: {
        posts,
        pagination,
      },
    };
  };
};
