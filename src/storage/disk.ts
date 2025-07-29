import { crypto, encodeHex, path } from "../deps.ts";
import { config } from "../plugin/config.ts";
import { exists } from "$std/fs/exists.ts";
import { slugifyAsPath } from "../parsers/index.ts";

const IGNORE_DIR = ["templates", ".obsidian"];
const REPO_OUT_DIR = "repo";
const ATTACHMENT_OUT_DIR = "attachments";

export const getContentDir = () => path.join(Deno.cwd(), config.contentDir);

export const getContentPath = (filename: string, context?: string) =>
  context
    ? path.join(getContentDir(), context, filename)
    : path.join(getContentDir(), filename);

export interface LsEntry {
  basename: string;
  extension: string;
  checksum: string;
  resources: Array<{
    type: string;
    slug: string;
  }>;
}
export type Resource = LsEntry["resources"][number];

export const getChecksum = async (data: Uint8Array): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return encodeHex(digest);
};

export const buildLs = async (
  forEachFile: (entry: Deno.DirEntry, context?: string) => Promise<LsEntry>,
  contentDir = getContentDir(),
): Promise<LsEntry[]> => {
  const dir = Deno.readDir(contentDir);

  let entries: LsEntry[] = [];
  for await (const dirEntry of dir) {
    if (dirEntry.isFile) {
      const context = contentDir.replace(getContentDir(), "").slice(1) ||
        undefined;
      const lsEntry = await forEachFile(dirEntry, context);
      entries = [...entries, lsEntry];
    } else if (dirEntry.isDirectory && !IGNORE_DIR.includes(dirEntry.name)) {
      const result = await buildLs(
        forEachFile,
        path.join(contentDir, dirEntry.name),
      );
      entries = [...entries, ...result];
    }
  }

  return entries;
};

export const openFile = async (
  entry: Deno.DirEntry | string,
  context?: string,
) => {
  const fullPath = typeof entry === "string"
    ? getContentPath(entry)
    : getContentPath(entry.name, context);

  const extension = path.extname(fullPath);
  const basename = path.basename(fullPath, path.extname(fullPath));
  const filename = context ? path.join(context, basename) : basename;

  const data = await Deno.readFile(fullPath);
  const checksum = await getChecksum(data);
  const defaultSlug = slugifyAsPath(filename);

  return {
    filename,
    extension,
    defaultSlug,
    checksum,
    data,
  };
};

export const findPrevEntry = (prev: LsEntry[] | null) =>
(
  basename: string,
  extension: string,
): LsEntry | null => {
  return prev?.find((entry) =>
    entry.basename == basename && entry.extension === extension
  ) || null;
};

export const smooshResources = (ls: LsEntry[]): Resource[] => {
  return ls.reduce((acc, file) => {
    return [...acc, ...file.resources];
  }, [] as Resource[]);
};

export const resourcesToDelete = (
  prev: LsEntry[] | null,
  next: LsEntry[],
): Resource[] => {
  if (!prev) return [];

  const prevResources = smooshResources(prev);
  const nextResources = smooshResources(next);

  return prevResources.filter((prevItem) =>
    !nextResources.find((nextItem) =>
      prevItem.type === nextItem.type && prevItem.slug === nextItem.slug
    )
  );
};

const getOutDir = () => {
  const { freshConfig, outDir } = config;
  if (!freshConfig?.build?.outDir) throw new Error("NoFreshConfigSetUp");
  return path.join(freshConfig.build.outDir, outDir);
};

export const getAttachmentPath = (filename: string) => {
  return path.join(getOutDir(), ATTACHMENT_OUT_DIR, filename);
};

export const getIndicesPath = (filename: string) => {
  return path.join(getOutDir(), REPO_OUT_DIR, filename);
};

const createDirsRecursively = async (...paths: string[]) => {
  if (!paths.length) return;

  const dirPath = path.join(...paths);
  const dirExists = await exists(dirPath);
  if (dirExists) return;
  await createDirsRecursively(...paths.slice(0, paths.length - 1));
  await Deno.mkdir(dirPath);
};

export const createOutDirIfNotExists = async () => {
  const { freshConfig, outDir } = config;
  if (!freshConfig?.build?.outDir) throw new Error("NoFreshConfigSetUp");

  await createDirsRecursively(
    freshConfig.build.outDir,
    outDir,
    ATTACHMENT_OUT_DIR,
  );
  await createDirsRecursively(
    freshConfig.build.outDir,
    outDir,
    REPO_OUT_DIR,
  );
};
