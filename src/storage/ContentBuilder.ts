import { AnyModel, BaseSchema, FileHandle } from "../lib/model/Model.ts";
import { log } from "../log.ts";
import { config } from "../plugin/config.ts";
import {
  buildLs,
  createOutDirIfNotExists,
  getContentDir,
  LsEntry,
  openFile,
  Resource,
} from "./disk.ts";
import { warnIfNoKv, wrapWithCache } from "./ModelCache.ts";
import { AnyRepository, Repository } from "./Repository.ts";

export class ContentBuilder {
  private repositories: AnyRepository[];
  private initPromise?: Promise<LsEntry[]>;
  private watcher?: Deno.FsWatcher;

  constructor(...models: AnyModel[]) {
    this.repositories = models.map((model) =>
      new Repository(wrapWithCache(model))
    );
  }

  public getRepository<S extends BaseSchema>(modelName: string) {
    const repo = this.repositories.find((repo) => repo.modelName === modelName);
    return repo as Repository<S>;
  }

  public getAllRepositories() {
    return this.repositories;
  }

  public init(): Promise<LsEntry[]> {
    if (this.initPromise) return this.initPromise;

    if (config.freshConfig?.dev) {
      warnIfNoKv();
    }

    this.repositories.forEach((repo) => repo.init());

    const start = Date.now();

    const promise = createOutDirIfNotExists().then(() =>
      buildLs((entry, context) => this.buildLsEntryForFile(entry, context))
    ).then((ls) => {
      log(`Built file list in ${Date.now() - start}ms`);
      return ls;
    });

    this.initPromise = promise;
    return promise;
  }

  public async watch() {
    if (this.watcher) return;

    const queue = new Set<string>();

    setInterval(() => {
      Array.from(queue).forEach((path) => {
        log(`Rebuilding resources for file "${path}"`);
        this.buildLsEntryForFile(path);
        queue.delete(path);
      });
    }, config.contentWatchDebounceInterval);

    this.watcher = Deno.watchFs(getContentDir());
    for await (const event of this.watcher) {
      event.paths.forEach((path) => {
        queue.add(path.replace(`${getContentDir()}/`, ""));
      });
    }
  }

  public async buildAll() {
    for (const repo of this.repositories) {
      await repo.buildAllAttachments();
      await repo.writeToDisk();
    }
  }

  private async buildLsEntryForFile(
    entry: Deno.DirEntry | string,
    prefix?: string,
  ): Promise<LsEntry> {
    const file = await openFile(entry, prefix);

    const metadata = {
      basename: file.filename,
      extension: file.extension,
      checksum: file.checksum,
    };

    const resources = await this.runModels(file);
    return {
      ...metadata,
      resources,
    };
  }

  private async runModels(
    file: FileHandle,
  ): Promise<Resource[]> {
    const results = await Promise.all(
      this.repositories.map((repo) => repo.insertDataFromFile(file)),
    );

    return results.flat();
  }
}
