import { describe, test, expect } from "vitest";
import { parseInvocation, parseDefinition, createParser, splitOnUnquotedComma } from "./utils";
import { MethodDefinition } from "./types";
import { COMMA_NOT_IN_PARENTHESIS } from "../utils";

describe(parseInvocation.name, () => {
  const testCases = [
    ["code(ts,some-meta)", { name: "code", parameters: ["ts", "some-meta"] }],
    ["code", { name: "code", parameters: [] }],
    ["code()", { name: "code", parameters: [] }],
    ["code(ts)", { name: "code", parameters: ["ts"] }],
    ["code(,some-meta)", { name: "code", parameters: [undefined, "some-meta"] }],
    ["code(,some-meta,,,)", { name: "code", parameters: [undefined, "some-meta"] }],
    ["dropdown(hello-world,true)", { name: "dropdown", parameters: ["hello-world", "true"] }],
    ["code(,,anything)", { name: "code", parameters: [undefined, undefined, "anything"] }],
  ] as const;

  for (const [input, expected] of testCases) {
    test(input, () => {
      expect(parseInvocation(input)).toEqual(expected);
    });
  }
});

describe(parseDefinition.name, () => {
  const testCases = [
    ["code(lang?: string, meta?: string)", {
      name: "code",
      parameters: [
        { name: "lang", optional: true, type: "string" },
        { name: "meta", optional: true, type: "string" }
      ]
    }],
    ["quote", { name: "quote" }],
    ["dropdown(summary: string, open?: boolean)", {
      name: "dropdown",
      parameters: [
        { name: "summary", optional: false, type: "string" },
        { name: "open", optional: true, type: "boolean" }
      ]
    }],
    ["allTypes(a: string, b: boolean, c: number, d?: string, e?: boolean, f?: number)", {
      name: "allTypes",
      parameters: [
        { name: "a", optional: false, type: "string" },
        { name: "b", optional: false, type: "boolean" },
        { name: "c", optional: false, type: "number" },
        { name: "d", optional: true, type: "string" },
        { name: "e", optional: true, type: "boolean" },
        { name: "f", optional: true, type: "number" },
      ]
    }]
  ] as const;

  for (const [input, expected] of testCases) {
    test(input, () => {
      expect(parseDefinition(input)).toEqual(expected);
    });
  }
});

describe(createParser.name, () => {
  const definitions = [
    "code(lang?: string, meta?: string)" satisfies MethodDefinition,
    "quote",
    "dropdown(summary: string, open?: boolean)" satisfies MethodDefinition,
  ] as const;

  const parse = createParser(definitions);

  const invocations = [
    ["code", { name: "code" }],
    ["code()", { name: "code" }],
    ["code(ts)", { name: "code", lang: "ts" }],
    ["code(ts,some-meta)", { name: "code", lang: "ts", meta: "some-meta" }],
    ["code(,some-meta)", { name: "code", meta: "some-meta" }],
    ["code(,some-meta,)", { name: "code", meta: "some-meta" }],
    ["code(,,anything)", { error: true }],
    ["quote", { name: "quote" }],
    ["quote()", { name: "quote" }],
    ["dropdown()", { error: true }],
    ["dropdown(,true)", { error: true }],
    ["dropdown(hello-world,true)", { name: "dropdown", summary: "hello-world", open: true }],
    ["dropdown('hello world',true)", { name: "dropdown", summary: "hello world", open: true }],

  ] as const;

  for (const [input, expected] of invocations) {
    test(input, () => {
      if ('error' in expected) {
        expect(() => parse(input)).toThrow();
      } else {
        expect(parse(input)).toEqual(expected);
      }
    });
  }

});


describe("split on non-parenthesized comma", () => {
  const testCases = [
    ["hello,world", ["hello", "world"]],
    ["code(,,anything), code, quote, dropdown(hello-world,true)", ["code(,,anything)", "code", "quote", "dropdown(hello-world,true)"]],
  ] as const;

  for (const [input, expected] of testCases) {
    test(input, () => {
      expect(input.split(COMMA_NOT_IN_PARENTHESIS)).toEqual(expected);
    });
  }

});


describe(splitOnUnquotedComma.name, () => {
  test("simple", () => {
    expect(splitOnUnquotedComma("hello,world")).toEqual(["hello", "world"]);
  });

  test("single quotes", () => {
    expect(splitOnUnquotedComma("hello,'hello,world',hello")).toEqual(["hello", "hello,world", "hello"]);
  });

  test("preserve dual single quotes", () => {
    expect(splitOnUnquotedComma("hello,''hello,world'',hello")).toEqual(["hello", "''hello,world''", "hello"]);
  });

  test("preserve triple double quotes", () => {
    expect(splitOnUnquotedComma("hello,'''hello,world''',hello")).toEqual(["hello", "'''hello,world'''", "hello"]);
  });
})