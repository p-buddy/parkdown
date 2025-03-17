import { describe, expect, test } from "vitest";
import { MethodDefinition } from "./types";
import { numberedParameters, createParser } from "./index";

describe(numberedParameters.name, () => {
  test("simple", () => {
    const definitions = [
      "example(0: string, 1?: string)" satisfies MethodDefinition,
    ] as const;

    const result = createParser(definitions)("example(z,a)");
    expect(numberedParameters(result)).toEqual(["z", "a"]);
  });

  test("mixed types", () => {
    const definitions = [
      "example(0: string, 1?: string, 2: boolean)" satisfies MethodDefinition,
    ] as const;

    const result = createParser(definitions)("example(z,a,true)");
    expect(numberedParameters(result)).toEqual(["z", "a", true]);
  });

  test("mixed positions", () => {
    const definitions = [
      "example(0: string, hi: string, 1: boolean)" satisfies MethodDefinition,
    ] as const;

    const result = createParser(definitions)("example(z,hi,true)");
    expect(numberedParameters(result)).toEqual(["z", true]);
  });
});