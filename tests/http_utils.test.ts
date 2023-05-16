import { assertStrictEquals } from "./deps.ts";
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

Deno.test("HttpUtils.valuesOfHeaderFieldValue(string)", () => {
  const r1 = HttpUtils.valuesOfHeaderFieldValue("");
  assertStrictEquals(JSON.stringify(r1), "[]");

  const r1b = HttpUtils.valuesOfHeaderFieldValue(" ");
  assertStrictEquals(JSON.stringify(r1b), "[]");

  const r2 = HttpUtils.valuesOfHeaderFieldValue("1");
  assertStrictEquals(JSON.stringify(r2), '["1"]');

  const r2b = HttpUtils.valuesOfHeaderFieldValue(" \t1 ");
  assertStrictEquals(JSON.stringify(r2b), '["1"]');

  const r3 = HttpUtils.valuesOfHeaderFieldValue("1,4,3");
  assertStrictEquals(JSON.stringify(r3), '["1","4","3"]');

  const r4 = HttpUtils.valuesOfHeaderFieldValue('1,"5",3');
  assertStrictEquals(JSON.stringify(r4), '["1","\\"5\\"","3"]');

  const rx1 = HttpUtils.valuesOfHeaderFieldValue("nosniff,");
  assertStrictEquals(JSON.stringify(rx1), '["nosniff",""]');

  const rx2 = HttpUtils.valuesOfHeaderFieldValue('text/html;", x/x');
  assertStrictEquals(JSON.stringify(rx2), '["text/html;\\", x/x"]');

  const rx3 = HttpUtils.valuesOfHeaderFieldValue('x/x;test="hi",y/y');
  assertStrictEquals(JSON.stringify(rx3), '["x/x;test=\\"hi\\"","y/y"]');

  const rx4 = HttpUtils.valuesOfHeaderFieldValue("x / x,,,1");
  assertStrictEquals(JSON.stringify(rx4), '["x / x","","","1"]');

  const rx5 = HttpUtils.valuesOfHeaderFieldValue('"1,2", 3');
  assertStrictEquals(JSON.stringify(rx5), '["\\"1,2\\"","3"]');
});
