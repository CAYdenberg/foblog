import { App, staticFiles } from "fresh";
import { foblog } from "./foblog.config.ts";
import { BlogListHandler } from "foblog";
import BlogListComponent from "./components/BlogListComponent.tsx";

export const app = new App()
  // Add static file serving middleware
  .use(staticFiles())
  .get(
    "/blog",
    foblog.handle(BlogListHandler(BlogListComponent)),
  )
  // Enable file-system based routing
  .fsRoutes();
