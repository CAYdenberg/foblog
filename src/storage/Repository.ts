import { BaseSchema, Model } from "../lib/model/Model.ts";

export class Repository<S extends BaseSchema> {
  private model: Model<S>;
  private data: S[] | null;

  constructor(model: Model<S>) {
    this.model = model;
    this.data = null;
  }

  public async upsertItem(data: S) {}

  public async deleteItem(slug: string) {}

  public async getList() {}

  public async getItem(slug: string) {}

  public async getAttachment(slug: string, variant: string) {}

  public async writeToDisk() {}

  public async readFromDisk() {}
}
