import { datetime } from "ptera";
import { formatDate } from "ptera/format.ts";

export const postDate = (date?: string) => {
  if (!date) return null;
  return formatDate(datetime(date), "MMM dd, YYYY");
};
