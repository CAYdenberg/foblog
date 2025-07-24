import { z } from "../../../deps.ts";
import { parseQuery } from "../../../parsers/index.ts";
import { PostTy } from "./post.ts";

export interface PaginationOptions {
  perPage: number;
  encodeUrl: (page: number) => string;
  decodeUrl: (url: URL | string) => number;
}

const parser = parseQuery(
  z.object({
    page: z.coerce.number(),
  }),
);

const paginationOptionsDefaults: PaginationOptions = {
  perPage: 10,
  encodeUrl: (page) => page === 1 ? `/blog` : `/blog?page=${page}`,
  decodeUrl: (url) => {
    try {
      const _url: URL = typeof url === "string" ? new URL(url) : url;
      const parsed = parser(_url.search);
      return parsed.page;
    } catch (_err) {
      return 1;
    }
  },
};

export interface Pagination {
  page: number;
  totalPages: number | null;
  params: {
    limit: number;
    skip: number;
  };
  url: {
    first: string | null;
    prev: string | null;
    next: string | null;
    last: string | null;
  };
  summary: {
    from: number;
    to: number;
    of: number | null;
  };
}

export const Paginate = (options: Partial<PaginationOptions> = {}) => {
  const { decodeUrl, encodeUrl, perPage } = {
    ...paginationOptionsDefaults,
    ...options,
  };

  return (posts: PostTy[], url?: string | URL | null): Pagination => {
    const total: number = posts.length;
    const page = url ? decodeUrl(url) : 1;

    const totalPages = Math.ceil(total / perPage);
    const isFirstPage = page < 2;
    const isLastPage = page >= totalPages;

    return {
      page,
      totalPages,
      params: {
        limit: perPage,
        skip: (page - 1) * perPage,
      },
      url: {
        first: isFirstPage ? null : encodeUrl(1),
        prev: isFirstPage ? null : encodeUrl(page - 1),
        next: isLastPage ? null : encodeUrl(page + 1),
        last: isLastPage ? null : encodeUrl(total),
      },
      summary: {
        from: (page - 1) * perPage + 1,
        to: total ? Math.min(perPage * page, total) : perPage * page,
        of: total || null,
      },
    };
  };
};
