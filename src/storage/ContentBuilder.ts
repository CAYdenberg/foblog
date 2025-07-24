import { AnyModel, Model } from "../lib/model/Model.ts";
import { LsEntry } from "./disk.ts";
import { Repository } from "./Repository.ts";

export class ContentBuilder {
  private Ls: LsEntry[] | null;
  private prevLs: LsEntry[] | null;
  private repositories: Repository[];

  constructor(models: AnyModel[]) {}

  public async init() {}

  public watch() {}

  public async buildAll() {}

  public async getRepository(modelName: string) {}
}
