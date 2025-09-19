import { App, staticFiles } from "fresh";

export const app = new App()
  // Add static file serving middleware
  .use(staticFiles())
  // Enable file-system based routing
  .use((ctx) => {
    console.log(Deno.env.get("NODE_ENV"));

    return ctx.next();
  })
  .fsRoutes();
