import { Repository } from "../../../storage/db.ts";
import { Paginate } from "./index.ts";
import { Pagination, PaginationOptions } from "./pagination.ts";
import { post, PostTy } from "./post.ts";

export interface BlogList {
  posts: PostTy[];
  pagination: Pagination;
}

export const BlogList = (options: Partial<PaginationOptions> = {}) => {
  const paginate = Paginate(options);

  return async (url?: string | URL | null): Promise<BlogList> => {
    const all = await Repository(post).getAll();
    const pagination = paginate(all, url);
    return {
      posts: all.slice(pagination.params.skip, pagination.params.limit + 1),
      pagination,
    };
  };
};

export const getPost = Repository(post).get;
