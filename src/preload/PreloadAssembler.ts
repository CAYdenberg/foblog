import { FreshContext } from "$fresh/server.ts";
import { warn } from "../log.ts";
import { isLeaf } from "../parsers/index.ts";
import { MdastNodeTy } from "../parsers/markdown/index.ts";
import {
  Preloader,
  PreloadErrored,
  PreloadFulfilled,
  PreloadPending,
} from "./types.ts";

const runPreloads = (
  preloads: PreloadPending[],
) =>
(
  request: Request,
  context: FreshContext,
): Promise<Array<PreloadFulfilled | PreloadErrored>> => {
  const promises = preloads.map((preload) => preload.query(request, context));

  return Promise.allSettled(promises).then((settled) => {
    return settled.map((promise, idx) =>
      promise.status === "fulfilled"
        ? {
          key: preloads[idx].key,
          preloadStatus: "fulfilled",
          data: promise.value,
        }
        : {
          key: preloads[idx].key,
          preloadStatus: "error",
          error: promise.reason,
        }
    );
  });
};

export const PreloadAssembler = (preloaders: Preloader[]) => {
  const preloadsForNodes = (
    node: MdastNodeTy.MdastNode,
    recur?: boolean,
  ): PreloadPending[] => {
    const resultFromPrimaryNode = preloaders.reduce((acc, preloader) => {
      const result = preloader(node);
      if (!result) return acc;
      if (Array.isArray(result)) return [...acc, ...result];
      return [...acc, result];
    }, [] as PreloadPending[]);

    if (recur && !isLeaf(node)) {
      return node.children.reduce((acc, child) => {
        return [...acc, ...preloadsForNodes(child, true)];
      }, resultFromPrimaryNode);
    }

    return resultFromPrimaryNode;
  };

  const transform = <NodeTy extends MdastNodeTy.MdastNode>(
    node: NodeTy,
    fulfilled: Array<PreloadFulfilled>,
  ) => {
    return preloadsForNodes(node, false).reduce((node, preload) => {
      const key = preload.key;
      const item = fulfilled.find((item) => item.key === key);
      if (!item) return node;

      if (item.data.type !== node.type) return node;
      return item.data as NodeTy;
    }, node);
  };

  const assemble = async (
    request: Request,
    context: FreshContext,
    content: MdastNodeTy.Root | undefined,
  ): Promise<PreloadFulfilled[]> => {
    if (!content) return [];

    const preloads = preloadsForNodes(content, true);
    const all = await runPreloads(preloads)(request, context);

    const errors = all.filter((preload) => preload.preloadStatus === "error");
    if (errors.length) {
      warn(`Some preloads failed: ${errors.map((err) => err.error).join(",")}`);
    }

    return all.filter((preload) => preload.preloadStatus === "fulfilled");
  };

  return {
    assemble,
    transform,
  };
};

export type PreloadAssemblerTy = ReturnType<typeof PreloadAssembler>;
