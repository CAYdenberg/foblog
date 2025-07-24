import { crypto, encodeHex, path, z } from "../deps.ts";
import { Model } from "../lib/model/Model.ts";
import { config } from "../plugin/config.ts";
import { exists } from "$std/fs/exists.ts";
import { slugifyAsPath } from "../parsers/index.ts";
import { Repository } from "./db.ts";

const IGNORE_DIR = ["templates", ".obsidian"];
const INDICES_OUT_DIR = "indices";
const ATTACHMENT_OUT_DIR = "attachments";

export const getContentDir = () => path.join(Deno.cwd(), config.contentDir);

export const getContentPath = (filename: string, context?: string) =>
  context
    ? path.join(getContentDir(), context, filename)
    : path.join(getContentDir(), filename);

const LsSchema = z.object({
  slug: z.string(),
  files: z.array(z.object({
    basename: z.string(),
    extension: z.string(),
    checksum: z.string(),
    resources: z.array(z.object({
      type: z.string(),
      slug: z.string(),
    })),
  })),
});

export type Ls = z.infer<typeof LsSchema>;
export type LsEntry = Ls["files"][number];
export type Resource = LsEntry["resources"][number];

export const LsModel: Model<Ls> = {
  name: "ls",
  schema: LsSchema,
};

export const LsRepository = Repository(LsModel);

export const getChecksum = async (data: Uint8Array): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return encodeHex(digest);
};

export const buildLs = async (
  forEachFile: (entry: Deno.DirEntry, context?: string) => Promise<LsEntry>,
  contentDir = getContentDir(),
): Promise<Ls> => {
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
      entries = [...entries, ...result.files];
    }
  }

  const finishTime: number = Date.now();
  return {
    slug: `${finishTime}`,
    files: entries,
  };
};

export const openFile = async (
  entry: Deno.DirEntry | string,
  context?: string,
) => {
  const fullPath = typeof entry === "string"
    ? entry
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

export const findPrevEntry = (prev: Ls | null) =>
(
  basename: string,
  extension: string,
): LsEntry | null => {
  return prev?.files.find((entry) =>
    entry.basename == basename && entry.extension === extension
  ) || null;
};

const smooshResources = (ls: Ls): Resource[] => {
  return ls.files.reduce((acc, file) => {
    return [...acc, ...file.resources];
  }, [] as Resource[]);
};

export const resourcesToDelete = (
  prev: Ls | null,
  next: Ls,
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
  return path.join(getOutDir(), INDICES_OUT_DIR, filename);
};

const createDirsRecursively = async (...paths: string[]) => {
  if (!paths.length) return;

  const dirPath = path.join(...paths);
  const dirExists = await exists(dirPath);
  if (dirExists) return;
  await createDirsRecursively(...paths.slice(0, paths.length - 1));
  await Deno.mkdir(dirPath);
  return;
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
    INDICES_OUT_DIR,
  );
};
