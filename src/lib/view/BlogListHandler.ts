import { Handler } from "$fresh/server.ts";
import { FoblogContext } from "../../plugin/index.ts";
import { BlogList, getBlogList, PaginationOptions } from "../model/index.ts";

export type BlogListHandlerProps = BlogList;

export const BlogListHandler = (
  options?: Partial<PaginationOptions>,
): Handler<BlogListHandlerProps, FoblogContext> => {
  const getter = getBlogList(options);

  return async (request, context) => {
    const blogList = await getter(context.state)(request.url);
    return context.render(blogList);
  };
};
