import { AnyModel, BaseSchema, FileHandle } from "../lib/model/Model.ts";
import { log } from "../log.ts";
import {
  buildLs,
  createOutDirIfNotExists,
  findPrevEntry,
  LsEntry,
  openFile,
  Resource,
} from "./disk.ts";
import { AnyRepository, Repository } from "./Repository.ts";

export class ContentBuilder {
  private ls: LsEntry[] | null;
  private prevLs: LsEntry[] | null;
  private repositories: AnyRepository[];

  constructor(...models: AnyModel[]) {
    this.repositories = models.map((model) => new Repository(model));
    this.ls = null;
    this.prevLs = null;
  }

  public getRepository<S extends BaseSchema>(modelName: string) {
    const repo = this.repositories.find((repo) => repo.modelName === modelName);
    return repo as Repository<S>;
  }

  public async init() {
    log("Building...");
    await createOutDirIfNotExists();
    this.ls = await buildLs((entry, context) =>
      this.buildLsEntryForFile(entry, context)
    );
    return this.ls;
  }

  public watch() {}

  public buildAll() {
    return Promise.all(this.repositories.map(async (repo) => {
      await repo.writeToDisk();
      await repo.buildAttachments();
    }));
  }

  private async buildLsEntryForFile(
    entry: Deno.DirEntry,
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

      const resources = this.runModels(file, false);
      return {
        ...metadata,
        resources,
      };
    }

    if (prevEntry.checksum !== file.checksum) {
      log(`Update: ${metadata.basename}`);

      const resources = this.runModels(file, true);
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
  ): Resource[] {
    const results = this.repositories.map((repo) => {
      return repo.upsertDataFromFile(file);
    });

    return results.flat();
  }
}
