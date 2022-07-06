import { assertStrictEquals } from "std/testing/asserts";
import { HttpUtils } from "../mod.ts";

Deno.test("HttpUtils.collectHttpQuotedString(string)", () => {
  const r1 = HttpUtils.collectHttpQuotedString("");
  assertStrictEquals(r1.collected, "");
  assertStrictEquals(r1.progression, 0);

  const r2 = HttpUtils.collectHttpQuotedString('"\\');
  assertStrictEquals(r2.collected, "\u005C");
  assertStrictEquals(r2.progression, 2);

  const r3 = HttpUtils.collectHttpQuotedString('"Hello" World');
  assertStrictEquals(r3.collected, "Hello");
  assertStrictEquals(r3.progression, 7);

  const r4 = HttpUtils.collectHttpQuotedString('"Hello \\\\ World\\""');
  assertStrictEquals(r4.collected, 'Hello \u005C World"');
  assertStrictEquals(r4.progression, 18);
});
