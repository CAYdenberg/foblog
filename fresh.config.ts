import { defineConfig } from "$fresh/server.ts";
import tailwind from "$fresh/plugins/tailwind.ts";
import foblog from "foblog";

export default defineConfig({
  plugins: [tailwind(), foblog((x) => x)],
});
