import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { recursivelyPopulateInclusions, removePopulatedInclusions } from "./include";
import { removeQueryParams } from "./utils";
import type chokidar from 'chokidar';

const read = (path: string) => readFileSync(path, "utf-8");

const tryResolveFile = (file: string) => {
  const path = resolve(file);
  const dir = dirname(path);
  const content = read(path);
  return { content, dir, path };
}

type Watcher = ReturnType<typeof chokidar.watch>;

export const populateMarkdownInclusions = (file: string, writeFile = true, watcher?: Watcher) => {
  const { dir, path, content } = tryResolveFile(file);

  watcher?.unwatch(path);

  watcher?.once("change", (change, stats) => {
    console.log(`Change detected in "${change}". Regenerating "${path}"...`);
    populateMarkdownInclusions(file, writeFile, watcher);
  });

  const getContent = (relative: string) => {
    const resolved = resolve(dir, removeQueryParams(relative));
    watcher?.add(resolved);
    return read(resolved);
  };

  const result = recursivelyPopulateInclusions(content, 0, getContent, path);
  if (writeFile) writeFileSync(path, result);
  watcher?.add(path);
  return result;
};

export const depopulateMarkdownInclusions = (file: string, writeFile = true, watcher?: Watcher) => {
  const { path, content } = tryResolveFile(file);
  const result = removePopulatedInclusions(content);
  if (writeFile) writeFileSync(path, result);
  return result;
};