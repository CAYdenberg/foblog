import { AnyModel, FileHandle } from "../lib/model/Model.ts";
import { log } from "../log.ts";
import {
  buildLs,
  createOutDirIfNotExists,
  findPrevEntry,
  LsEntry,
  openFile,
  Resource,
} from "./disk.ts";
import { Repository } from "./Repository.ts";

export class ContentBuilder {
  private ls: LsEntry[] | null;
  private prevLs: LsEntry[] | null;
  private repositories: Repository<any>[];

  constructor(...models: AnyModel[]) {
    this.repositories = models.map((model) => new Repository(model));
  }

  public async init() {
    log("Building...");
    await createOutDirIfNotExists();
    this.ls = await buildLs(this.buildLsEntryForFile);
  }

  public watch() {}

  public async buildAll() {}

  public async getRepository(modelName: string) {}

  private async buildLsEntryForFile(
    entry: Deno.DirEntry | string,
    prefix?: string,
  ): Promise<LsEntry> {
    const file = await openFile(entry, prefix);
    const prevEntry = findPrevEntry(this.prevLs)(file.filename, file.extension);

    const metadata = {
      basename: file.filename,
      extension: file.extension,
      checksum: file.checksum,
    };

    if (!prevEntry) {
      log(`Create: ${metadata.basename}`);

      const resources = await this.runModels(file, false);
      return {
        ...metadata,
        resources,
      };
    }

    if (prevEntry.checksum !== file.checksum) {
      log(`Update: ${metadata.basename}`);

      const resources = await this.runModels(file, true);
      return {
        ...metadata,
        resources,
      };
    }

    return prevEntry;
  }

  private runModels(
    file: FileHandle,
    isUpdate: boolean,
  ): Promise<Resource[]> {
    return Promise.all(this.repositories.map(async (repo) => {
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
  }
}
