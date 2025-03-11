import { describe, expect, test } from "vitest";
import { processMarkdown } from ".";

describe("", () => {
  test("", () => {
    processMarkdown(`
# Level 1

This is a test of the parkdown library.

## Level 2

This is a test of the parkdown library.

[](./file.ts)

[test](./file.ts)

### Level 3

[](./file.ts)
hahaha
hehehe <!-- END -->

This is a test of the parkdown library.
    `);
  });
})