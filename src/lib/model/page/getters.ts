import { FoblogData } from "../../../plugin/index.ts";
import { page, PageTy } from "./page.ts";

export const getPage = (data: FoblogData) => (slug: string) => {
  return data.getItem<PageTy>("page", slug);
};
