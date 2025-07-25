import { assert, z } from "../../deps.ts";
import { parseQuery } from "../parseQuery.ts";

const { assertEquals, assertThrows } = assert;

const parser = parseQuery(z.object({
  isPublished: z.coerce.boolean(),
  daysOfWeek: z.array(z.string()).default([]),
  frequency: z.coerce.number().optional(),
}));

Deno.test("with boolean", () => {
  const result = parser("?isPublished=true&daysOfWeek=Sunday,Monday");
  assertEquals(result, {
    isPublished: true,
    daysOfWeek: ["Sunday", "Monday"],
  });
});

Deno.test("with empty array", () => {
  const result = parser("?isPublished=true");
  assertEquals(result, {
    isPublished: true,
    daysOfWeek: [],
  });
});

Deno.test("with false boolean", () => {
  const result = parser("?daysOfWeek=Sunday,Monday");
  assertEquals(result, {
    isPublished: false,
    daysOfWeek: ["Sunday", "Monday"],
  });
});

Deno.test("uncoercable value", () => {
  assertThrows(() => parser("?frequency=fourforty"));
});
