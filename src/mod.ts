export * from "./lib/index.ts";

export type { FoblogContext, FoblogPluginConfig } from "./plugin/index.ts";
export type ContentRoot = MdastNodeTy.Root;

import { MdastNodeTy } from "./parsers/index.ts";
import foblog from "./plugin/plugin.ts";
export default foblog;
