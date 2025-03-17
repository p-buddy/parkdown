export type { MethodDefinition } from "./types";
import type { Parser } from "./types";
export { createParser } from "./utils";

export const numberedParameters = (result: ReturnType<Parser<any>>) =>
  Object.entries(result)
    .filter(([key]) => key !== "name" && !isNaN(Number(key)))
    .map(([_, value]) => value);
