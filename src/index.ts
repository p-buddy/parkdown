import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { recursivelyApplyInclusions } from "./include";
import { removeQueryParams } from "./utils";

const read = (path: string) => readFileSync(path, "utf-8");

export const processMarkdownIncludes = (file: string, writeFile = true) => {
  const path = resolve(file);
  const dir = dirname(path);
  const markdown = read(path);
  const getContent = (relative: string) => read(resolve(dir, removeQueryParams(relative)));
  const result = recursivelyApplyInclusions(markdown, 0, getContent);
  if (writeFile) writeFileSync(path, result);
  return result;
};
