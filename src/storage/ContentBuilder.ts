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
  private initPromise?: Promise<LsEntry[] | null>;

  constructor(...models: AnyModel[]) {
    this.repositories = models.map((model) => new Repository(model));
    this.ls = null;
  }

  public getRepository<S extends BaseSchema>(modelName: string) {
    const repo = this.repositories.find((repo) => repo.modelName === modelName);
    return repo as Repository<S>;
  }

  public getAllRepositories() {
    return this.repositories;
  }

  public init() {
    if (this.initPromise) return this.initPromise;

    const start = Date.now();

    const promise = createOutDirIfNotExists().then(() =>
      buildLs((entry, context) => this.buildLsEntryForFile(entry, context))
    ).then((ls) => {
      this.ls = ls;
      log(`Built file list in ${Date.now() - start}ms`);
      return ls;
    });

    this.initPromise = promise;
    return promise;
  }

  public watch() {}

  public buildAll() {
    return Promise.all(this.repositories.map(async (repo) => {
      await repo.buildAllAttachments();
      await repo.writeToDisk();
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
