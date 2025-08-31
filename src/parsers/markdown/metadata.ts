import { parseYaml } from "../../deps.ts";
import { isLeaf } from "./MdastNode.ts";

import type { PostTy } from "../../lib/index.ts";
import type { MdastNode, Root, Text, Yaml } from "./MdastNode.ts";
import { FoblogContext } from "../../plugin/index.ts";
import { parseCustom } from "./custom.ts";
import { config } from "../../plugin/config.ts";

export const flattenTree = (tree: MdastNode): MdastNode[] => {
  let nodes: MdastNode[] = [];

  const recur = (node: MdastNode) => {
    nodes = [...nodes, node];
    if (!isLeaf(node)) {
      node.children.forEach((node) => recur(node));
    }
  };
  recur(tree);

  return nodes;
};

export const selectNodes =
  (nodes: MdastNode[]) => <T extends MdastNode>(...types: string[]) => {
    return nodes.filter((node) => types.includes(node.type)) as T[];
  };

const normalDate = (date?: string) =>
  date ? new Date(date).toISOString() : undefined;

export const getContentType = (content: Root): string | undefined => {
  const selector = selectNodes(flattenTree(content));
  const yaml = selector<Yaml>("yaml");
  // deno-lint-ignore no-explicit-any
  const data = yaml?.length ? parseYaml(yaml[0].value) : {} as any;
  return data.type || undefined;
};

export const getPlainText = (node: MdastNode) => {
  const selector = selectNodes(flattenTree(node));
  return selector<Text>("text")
    .map((node) => node.value)
    .join("\n\n");
};

export const getPostMetadata = (content: Root): Partial<PostTy> => {
  const selector = selectNodes(flattenTree(content));
  const yaml = selector<Yaml>("yaml");

  // deno-lint-ignore no-explicit-any
  const data = yaml?.length ? parseYaml(yaml[0].value) : {} as any;

  return {
    summary: data.summary || undefined,
    image: data.image || undefined,
    banner_image: data.banner_image || undefined,
    date_published: normalDate(data.date_published) || undefined,
    external_url: data.external_url || undefined,
  };
};

export const processMetadataXRef =
  (context: FoblogContext) =>
  async (xref?: string): Promise<string | undefined> => {
    if (!xref) return undefined;

    const elements = parseCustom(xref);
    const attachment = elements?.find((el) => el.type === "attachment");
    if (!attachment) return undefined;

    const resource = await context.getResourceFromXRef(attachment.filename);
    if (!resource) return undefined;

    return config.images.permalink(resource.slug);
  };
