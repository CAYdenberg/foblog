import { assert } from "../../deps.ts";

import { slugFromFilename, slugify } from "../slugify.ts";

const { assertEquals } = assert;

Deno.test("slugify", () => {
  assertEquals(slugify("my_awesome post"), "my-awesome-post");
});

Deno.test("slugFromFilename", () => {
  assertEquals(slugFromFilename("My Awesome Post.md"), "my-awesome-post");
});
