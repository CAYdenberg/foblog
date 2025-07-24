export * from "./lib/index.ts";

export type { FoblogPluginConfig } from "./plugin/index.ts";
export { contentBuilder } from "./plugin/index.ts";

import foblog from "./plugin/plugin.ts";
export default foblog;
