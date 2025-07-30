import { FoblogContext } from "../../../plugin/index.ts";
import { PageTy } from "./page.ts";

export const getPage = (data: FoblogContext) => (slug: string) => {
  return Promise.all([
    data.getItem<PageTy>("page", slug),
    data.getContent("page", slug),
  ]).then(([model, content]) => {
    if (!model || !content) return null;
    return { ...model, content };
  }).catch(() => null);
};
