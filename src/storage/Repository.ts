import { BaseSchema, FileHandle, Model } from "../lib/model/Model.ts";

export class Repository<S extends BaseSchema> {
  public modelName: string;
  private model: Model<S>;
  private data: S[] | null;

  constructor(model: Model<S>) {
    this.modelName = model.name;
    this.model = model;
    this.data = null;
  }

  public async upsertDataFromFile(
    file: FileHandle,
  ) {
    const existingData = this.data || [];

    const result = await this.model.resourcesFromFile(file);
    if (!result) return [];

    const newData = Array.isArray(result) ? result : [result];
    return newData.map((item) => {
      this.data = [...existingData, item];
      return {
        type: this.model.name,
        slug: item.slug,
      };
    });
  }

  public async deleteItem(slug: string) {}

  public async getList() {}

  public async getItem(slug: string) {}

  public async getAttachment(slug: string, variant: string) {}

  public async writeToDisk() {}

  public async readFromDisk() {}
}
