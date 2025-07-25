import type { AnyModel, ReadData } from "../lib/model/Model.ts";
import { image, page, post } from "../lib/index.ts";
import { Repository } from "../storage/db.ts";
import {
  buildLs,
  findPrevEntry,
  Ls,
  LsEntry,
  LsRepository,
  openFile,
  Resource,
  resourcesToDelete,
} from "../storage/disk.ts";
import { path } from "../deps.ts";
import { config } from "./config.ts";
import { log } from "../log.ts";

export const ContentBuilder = (...models: AnyModel[]) => {
  const runModels = (
    file: ReadData,
    isUpdate: boolean,
  ): Promise<Resource[]> => {
    return Promise.all(models.map(async (model) => {
      const table = Repository(model);
      if (!model.onRead) return [];

      const resource = await model.onRead(file, { isUpdate });
      if (!resource) return Promise.resolve([]);
      const resources = Array.isArray(resource) ? resource : [resource];

      return Promise.all(
        resources.map(async (resource) => {
          await table.upsert(resource.slug, resource);
          return {
            type: model.name,
            slug: resource.slug,
          };
        }),
      );
    })).then((results) => results.flat());
  };

  const doFile = async (
    entry: Deno.DirEntry | string,
    compareEntries: (filename: string, extension: string) => LsEntry | null,
    context?: string,
  ) => {
    const file = await openFile(entry, context);
    const prevEntry = compareEntries(file.filename, file.extension);

    const metadata = {
      basename: file.filename,
      extension: file.extension,
      checksum: file.checksum,
    };

    if (!prevEntry) {
      log(`Create: ${metadata.basename}`);

      const resources = await runModels(file, false);
      return {
        ...metadata,
        resources,
      };
    }

    if (prevEntry.checksum !== file.checksum) {
      log(`Update: ${metadata.basename}`);

      const resources = await runModels(file, true);
      return {
        ...metadata,
        resources,
      };
    }

    return prevEntry;
  };

  const deleteResource = async (resource: Resource) => {
    const model = models.find((model) => model.name === resource.type);
    if (!model) return;

    log(`Delete: ${resource.slug}`);

    await Repository(model).remove(resource.slug);

    if (model.onDelete) {
      await model.onDelete(resource.slug);
    }
    return true;
  };

  const doIt = async () => {
    const prevLs = await LsRepository.get("ls");
    const compareEntries = findPrevEntry(prevLs);

    const nextLs: Ls = await buildLs((entry, context) => {
      return doFile(entry, compareEntries, context);
    });

    await Promise.all(
      resourcesToDelete(prevLs, nextLs).map((resource) => {
        return deleteResource(resource);
      }),
    );

    await LsRepository.upsert("ls", nextLs);

    return nextLs;
  };

  return {
    build: (isProduction?: boolean) =>
      doIt().catch(handleBuildError(isProduction)),

    watch: async (
      onChange: (digest: string, watcher: Deno.FsWatcher) => void,
    ) => {
      const prevLs = await LsRepository.get("ls");
      const compareEntries = findPrevEntry(prevLs);

      const watcher = Deno.watchFs(path.join(Deno.cwd(), config.contentDir), {
        recursive: false,
      });

      const handleEntryPath = (
        kind: Deno.FsEvent["kind"],
        fullPath: string,
      ) => {
        const extension = path.extname(fullPath);
        const filename = path.basename(fullPath, path.extname(fullPath));
        const prev = compareEntries(filename, extension);

        switch (kind) {
          case "create": {
            if (!prev) {
              onChange(`modify:${fullPath}`, watcher);
            }
            return;
          }

          case "modify": {
            openFile(fullPath).then((file) => {
              if (prev?.checksum !== file.checksum) {
                onChange(`modify:${fullPath}`, watcher);
              }
            });
            return;
          }

          case "remove": {
            if (prev) {
              onChange(`remove:${fullPath}`, watcher);
            }
            return;
          }
        }
      };

      for await (const event of watcher) {
        event.paths.forEach((path) => {
          handleEntryPath(event.kind, path);
        });
      }
    },
  };
};

export const handleBuildError =
  (isProduction?: boolean) => (error: Error | unknown) => {
    console.error("foblog build error", error);

    if (isProduction) {
      throw error;
    }

    return false;
  };

export const contentBuilder = ContentBuilder(post, page, image);
