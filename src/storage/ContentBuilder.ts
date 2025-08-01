import { AnyModel, BaseSchema, FileHandle } from "../lib/model/Model.ts";
import { log } from "../log.ts";
import {
  buildLs,
  createOutDirIfNotExists,
  LsEntry,
  openFile,
  Resource,
} from "./disk.ts";
import { AnyRepository, Repository } from "./Repository.ts";

export class ContentBuilder {
  private ls: LsEntry[] | null;
  private repositories: AnyRepository[];

  constructor(...models: AnyModel[]) {
    this.repositories = models.map((model) => new Repository(model));
    this.ls = null;
  }

  public getRepository<S extends BaseSchema>(modelName: string) {
    const repo = this.repositories.find((repo) => repo.modelName === modelName);
    return repo as Repository<S>;
  }

  public async init() {
    log("Building file list");
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
      await repo.buildAllAttachments();
    }));
  }

  private async buildLsEntryForFile(
    entry: Deno.DirEntry,
    prefix?: string,
  ): Promise<LsEntry> {
    const file = await openFile(entry, prefix);

    const metadata = {
      basename: file.filename,
      extension: file.extension,
      checksum: file.checksum,
    };

    const resources = this.runModels(file);
    return {
      ...metadata,
      resources,
    };
  }

  private runModels(
    file: FileHandle,
  ): Resource[] {
    const results = this.repositories.map((repo) => {
      return repo.insertDataFromFile(file);
    });

    return results.flat();
  }
}
