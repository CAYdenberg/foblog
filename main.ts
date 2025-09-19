import { App, staticFiles } from "fresh";
import { h } from "preact";
import foblog from "./foblog.config.ts";
import { BlogListHandler } from "foblog";

export const app = new App()
  // Add static file serving middleware
  .use(staticFiles())
  .get(
    "/blog",
    foblog.handle(BlogListHandler({
      render: (props) => <h1>{props.title}</h1>,
    })),
  )
  // Enable file-system based routing
  .fsRoutes();
