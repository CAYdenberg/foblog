import { BaseSchema } from "../lib/model/Model.ts";
import { warn } from "../log.ts";

import type { Root as MdastContent } from "../parsers/markdown/MdastNode.ts";
import { ContentBuilder } from "../storage/ContentBuilder.ts";
import type { AnyRepository } from "../storage/Repository.ts";

export interface FoblogContext {
  getAll: <S extends BaseSchema>(type: string) => Promise<S[]>;

  getItem: <S extends BaseSchema>(
    type: string,
    slug: string,
  ) => Promise<S | null>;

  getResourceFromXRef: (
    xref: string,
  ) => Promise<{ type: string; slug: string } | null>;

  getAttachment: <S extends BaseSchema>(
    type: string,
    resource: S,
    variant: string | null,
  ) => Promise<ReadableStream<Uint8Array> | null>;

  getContent: (
    type: string,
    slug: string,
  ) => Promise<MdastContent | null>;
}

export const createFoblogContextPrebuilt = (
  repositories: Record<string, AnyRepository>,
): FoblogContext => {
  const getAll = (type: string) => {
    const repo = repositories[type];
    if (!repo) {
      warn(`Repository ${type} not configured`);
      return Promise.resolve([]);
    }
    return repo.getAll();
  };

  const getItem = (type: string, slug: string) => {
    const repo = repositories[type];
    if (!repo) {
      warn(`Repository ${type} not configured`);
      return Promise.resolve(null);
    }
    return repo.getItem(slug);
  };

  const getResourceFromXRef = async (xref: string) => {
    for (const [modelName, repo] of Object.entries(repositories)) {
      const item = await repo.getByFilename(xref);
      if (item) {
        return {
          type: modelName,
          slug: item.slug,
        };
      }
    }
    return null;
  };

  const getAttachment = <S extends BaseSchema>(
    type: string,
    resource: S,
    variant: string | null,
  ) => {
    const repo = repositories[type];
    if (!repo) {
      warn(`Repository ${type} not configured`);
      return Promise.resolve(null);
    }
    return repo.getAttachment(resource, variant);
  };

  const getContent = (
    type: string,
    slug: string,
  ): Promise<MdastContent | null> => {
    const repo = repositories[type];
    if (!repo) {
      warn(`Repository ${type} not configured`);
      return Promise.resolve(null);
    }
    return repo.getContent(slug);
  };

  return {
    getAll,
    getItem,
    getResourceFromXRef,
    getAttachment,
    getContent,
  };
};

export const createFoblogContextDev = (
  contentBuilder: ContentBuilder,
): FoblogContext => {
  contentBuilder.watch();

  const getAll = async <S extends BaseSchema>(type: string) => {
    await contentBuilder.init();
    return contentBuilder.getRepository<S>(type).getAll();
  };

  const getItem = async <S extends BaseSchema>(type: string, slug: string) => {
    await contentBuilder.init();
    return contentBuilder.getRepository<S>(type).getItem(slug);
  };

  const getResourceFromXRef = async (xref: string) => {
    await contentBuilder.init();
    const repositories = contentBuilder.getAllRepositories();

    for (const [modelName, repo] of Object.entries(repositories)) {
      const item = await repo.getByFilename(xref);
      if (item) {
        return {
          type: modelName,
          slug: item.slug,
        };
      }
    }
    return null;
  };

  const getAttachment = async <S extends BaseSchema>(
    type: string,
    resource: S,
    variant: string | null,
  ) => {
    await contentBuilder.init();
    return contentBuilder.getRepository<S>(type).getAttachment(
      resource,
      variant,
    );
  };

  const getContent = async <S extends BaseSchema>(
    type: string,
    slug: string,
  ): Promise<MdastContent | null> => {
    await contentBuilder.init();
    return contentBuilder.getRepository<S>(type).getContent(slug);
  };

  return {
    getAll,
    getItem,
    getResourceFromXRef,
    getAttachment,
    getContent,
  };
};
