import { BaseSchema, FileHandle, Model } from "../lib/model/Model.ts";
import { warn } from "../log.ts";
import { config } from "../plugin/config.ts";
import { getAttachmentPath, getIndicesPath, openFile } from "./disk.ts";

export class Repository<S extends BaseSchema> {
  public modelName: string;
  private model: Model<S>;
  private data: S[] | null;

  constructor(model: Model<S>) {
    this.modelName = model.name;
    this.model = model;
    this.data = null;
  }

  public upsertDataFromFile(
    file: FileHandle,
  ) {
    const existingData = this.data || [];

    const result = this.model.resourcesFromFile(file);
    if (!result) return [];

    const newData = Array.isArray(result) ? result : [result];
    return newData.map((item) => {
      this.checkItem(item);
      this.data = [...existingData, item];
      return {
        type: this.model.name,
        slug: item.slug,
      };
    });
  }

  public async getAll(): Promise<S[]> {
    if (!this.data) {
      const data = await this.readFromDisk();
      return data;
    }
    return this.data;
  }

  public async deleteItem(slug: string) {}

  public async getItem(slug: string) {}

  public async buildAttachments() {
    if (!this.model.getAttachments) return;
    if (!this.data) {
      throw new Error("NoDataBeforeAttachmentBuild");
    }

    await Promise.all(this.data.map(async (resource) => {
      const file = await openFile(`${resource.filename}${resource.extension}`);
      const attachments = await this.model.getAttachments!(resource, file);
      await Promise.all(attachments.map((attachment) => {
        const path = getAttachmentPath(
          `${resource.slug}_${attachment.variant}${resource.extension}`,
        );
        return Deno.writeFile(path, attachment.data);
      }));
    }));
    return true;
  }

  public async getAttachment(slug: string, variant: string) {}

  public writeToDisk() {
    return Deno.writeTextFile(
      getIndicesPath(`${this.modelName}.json`),
      JSON.stringify(this.data),
    );
  }

  public async readFromDisk(): Promise<S[]> {
    const text = await Deno.readTextFile(
      getIndicesPath(`${this.modelName}.json`),
    );
    return JSON.parse(text);
  }

  private checkItem(item: S) {
    const { success, error } = this.model.schema.safeParse(item);
    if (success) return;
    if (config.freshConfig?.dev) {
      warn(
        `Model ${this.modelName} Resource ${item.slug} did not match schema`,
      );
      return;
    }
    throw error;
  }
}

// need a way to specify a generic repositroy
// deno-lint-ignore no-explicit-any
export type AnyRepository = Repository<any>;
