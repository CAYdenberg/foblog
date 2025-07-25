import { BaseSchema, FileHandle, Model } from "../lib/model/Model.ts";

interface UpsertOptions {
  isUpdate: boolean;
  buildAttachments: boolean;
}

export class Repository<S extends BaseSchema> {
  private model: Model<S>;
  private data: S[] | null;

  constructor(model: Model<S>) {
    this.model = model;
    this.data = null;
  }

  public async upsertDataFromFile(file: FileHandle, { isUpdate: boolean }) {}

  public async deleteItem(slug: string) {}

  public async getList() {}

  public async getItem(slug: string) {}

  public async getAttachment(slug: string, variant: string) {}

  public async writeToDisk() {}

  public async readFromDisk() {}
}
