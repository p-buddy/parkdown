import { test } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { depopulateMarkdownInclusions } from ".";

test("debug problematic markdown", () => {
  const path = join(__dirname, "debug.md");
  if (!existsSync(path)) return;
  const result = depopulateMarkdownInclusions(path, false);
  console.log(result);
});
