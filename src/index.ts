import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { recursivelyApplyInclusions } from "./include";

export const processMarkdownIncludes = (file: string, writeFile = true) => {
  const path = resolve(file);
  const dir = dirname(path);
  const markdown = readFileSync(path, "utf-8");
  const result = recursivelyApplyInclusions(markdown, 0, (relativePath) => {

    const absolutePath = resolve(dir, relativePath.split("?")[0]);
    return readFileSync(absolutePath, "utf-8");
  });
  if (writeFile) writeFileSync(path, result);
  return result;
};
