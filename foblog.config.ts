import Foblog from "foblog";

export const foblog = new Foblog();

if (Deno.args.includes("build")) {
  await foblog.build();
}
