import { path, slugify as _slugify } from "../deps.ts";

_slugify.extend({
  ["_"]: "-",
});

export const slugify = (input: string) =>
  _slugify(input, {
    replacement: "-",
    remove: /[:\,\/\\\'\"\(\)\?]/,
    lower: true,
  });

export const slugifyAsPath = (input: string) =>
  input.split("/").map((part) => slugify(part)).join(
    "/",
  );

export const slugFromFilename = (filePath: string) => {
  const filename = path.basename(filePath, path.extname(filePath));
  return slugify(filename);
};
