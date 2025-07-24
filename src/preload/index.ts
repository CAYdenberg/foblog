export type { Preloader } from "./types.ts";
export type { PreloadAssemblerTy } from "./PreloadAssembler.ts";

import { preloadAttachmentImages, preloadXLinks } from "./preloaders.ts";
import { PreloadAssembler } from "./PreloadAssembler.ts";
import { Preloader } from "./types.ts";

const preloaders: Preloader[] = [
  preloadXLinks,
  preloadAttachmentImages,
];

export const preloadAssembler = PreloadAssembler(preloaders);
