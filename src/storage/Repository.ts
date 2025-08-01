import { exists } from "$std/fs/exists.ts";
import { BaseSchema, FileHandle, Model } from "../lib/model/Model.ts";
import { log, warn } from "../log.ts";
import { disambiguateTitle } from "../parsers/title.ts";
import { config } from "../plugin/config.ts";
import {
  getAttachmentPath,
  getContentPath,
  getIndicesPath,
  openFile,
} from "./disk.ts";

import type { Root as MdastContent } from "../parsers/markdown/MdastNode.ts";

export class Repository<S extends BaseSchema> {
  public modelName: string;
  private model: Model<S>;
  private data: S[] | null;
  private variants: Record<string, string[]>;

  constructor(model: Model<S>) {
    this.modelName = model.name;
    this.model = model;
    this.data = null;
    this.variants = {};
  }

  public insertDataFromFile(
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
      this.data = data;
      return data;
    }
    return this.data;
  }

  public async getItem(slug: string): Promise<S | null> {
    const data = await this.getAll();
    const item = data.find((item) => item.slug === slug);
    if (!item) return null;

    let variants = this.variants[item.slug];
    if (!variants && this.model.getAttachments) {
      variants = await this.buildAttachments(item);
    }

    return { ...item, variants };
  }

  public async getContent(slug: string): Promise<MdastContent | null> {
    const resource = await this.getItem(slug);
    if (!resource) return null;
    const file = await openFile(`${resource.filename}${resource.extension}`);
    if (!this.model.getContent) return null;
    return this.model.getContent(resource, file);
  }

  public async getByFilename(filename: string) {
    const data = await this.getAll();
    const item = data.find((item) => {
      const titleBasename = disambiguateTitle(item.filename);
      return (titleBasename === filename ||
        `${titleBasename}${item.extension}` === filename);
    });
    return item || null;
  }

  public async buildAllAttachments() {
    if (!this.model.getAttachments) return;
    if (!this.data) {
      throw new Error("NoDataBeforeAttachmentBuild");
    }

    await Promise.all(this.data.map((resource) => {
      return this.buildAttachments(resource);
    }));
    return true;
  }

  public async getAttachment(
    resource: S,
    variant: string | null,
    writeCache?: boolean,
  ): Promise<ReadableStream<Uint8Array> | null> {
    // try to find the cached attachment in the attachments folder
    if (variant) {
      const path = getAttachmentPath(
        `${resource.slug}_${variant}${resource.extension}`,
      );
      if (await exists(path)) {
        const file = await Deno.open(path, { read: true });
        return file.readable;
      }
    }

    // if it doesn't exist or if no variant is requested, then get the original file
    const path = getContentPath(`${resource.filename}${resource.extension}`);
    if (!(await exists(path))) return null;

    const file = await Deno.open(path, { read: true });

    // if a variant was request but we don't have it, then try building it now.
    // this is fire-and-forget side-effect, if an error is throw then
    // warn the developer but don't pass the error up
    if (variant && writeCache) {
      this.buildAttachments(resource).catch(() =>
        warn(
          `Unable to build attachments for model ${this.modelName}, resource ${resource.slug} `,
        )
      );
    }

    return file?.readable || null;
  }

  public writeToDisk() {
    log(`Writing repository ${this.modelName}`);

    return Deno.writeTextFile(
      getIndicesPath(`${this.modelName}.json`),
      JSON.stringify(this.data),
    );
  }

  public async readFromDisk(): Promise<S[]> {
    log(`Reading repository ${this.modelName}`);

    const text = await Deno.readTextFile(
      getIndicesPath(`${this.modelName}.json`),
    );
    return JSON.parse(text);
  }

  private async buildAttachments(resource: S) {
    log(
      `Writing attachments for repository ${this.modelName} slug ${resource.slug}`,
    );

    const file = await openFile(`${resource.filename}${resource.extension}`);
    const attachments = await this.model.getAttachments!(resource, file);
    const variants = await Promise.all(attachments.map(async (attachment) => {
      const path = getAttachmentPath(
        `${resource.slug}_${attachment.variant}${resource.extension}`,
      );
      await Deno.writeFile(path, attachment.data);
      return attachment.variant;
    }));
    this.variants[resource.slug] = variants;
    return variants;
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
