import { test } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { populateMarkdownInclusions } from ".";

test("debug problematic markdown", () => {
  const path = join(__dirname, "debug.md");
  if (!existsSync(path)) return;
  const result = populateMarkdownInclusions(path, false);
  console.log(result);
});
