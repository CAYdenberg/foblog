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

  return (data: FoblogContext) =>
  async (
    url?: string | URL | null,
  ): Promise<BlogList> => {
    const all = await data.getAll<PostTy>("post");
    const pagination = paginate(all, url);
    return {
      posts: all.slice(pagination.params.skip, pagination.params.limit + 1),
      pagination,
    };
  };
};

export const getPost = (data: FoblogContext) => (slug: string) => {
  return Promise.all([
    data.getItem<PostTy>("post", slug),
    data.getContent("post", slug),
  ]).then(([model, content]) => {
    if (!model || !content) return null;
    return { ...model, content };
  }).catch(() => null);
};
