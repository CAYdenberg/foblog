import { App, staticFiles } from "fresh";
import { foblog } from "./foblog.config.ts";
import { FoblogState } from "foblog";

export const app = new App<FoblogState>()
  // Add static file serving middleware
  .use(staticFiles())
  .use(foblog.middleware())
  // Enable file-system based routing
  .fsRoutes();
