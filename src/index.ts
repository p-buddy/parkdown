import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { recursivelyPopulateInclusions, removePopulatedInclusions } from "./include";
import { removeQueryParams } from "./utils";

const read = (path: string) => readFileSync(path, "utf-8");

const tryResolveFile = (file: string) => {
  const path = resolve(file);
  const dir = dirname(path);
  const markdown = read(path);
  return { markdown, dir, path };
}

export const populateMarkdownInclusions = (file: string, writeFile = true) => {
  const { dir, path, markdown } = tryResolveFile(file);
  const getContent = (relative: string) => read(resolve(dir, removeQueryParams(relative)));
  const result = recursivelyPopulateInclusions(markdown, 0, getContent);
  if (writeFile) writeFileSync(path, result);
  return result;
};

export const depopulateMarkdownInclusions = (file: string, writeFile = true) => {
  const { path, markdown } = tryResolveFile(file);
  const result = removePopulatedInclusions(markdown);
  if (writeFile) writeFileSync(path, result);
  return result;
};