import { describe, expect, test } from "vitest";
import { extractComments } from "./extract";
import dedent from "ts-dedent";

describe(extractComments.name, () => {
  test("basic", () => {
    const code = dedent`
    <script>
      let count = 0;
      /* A */
      remove!
      /* A */
    </script>
    <Component prop={/* B */ async () => {
      /* B */
    }}>
      <!-- C -->
      <p>Hello</p>
      <!-- C -->
    </Component>
    `;

    const comments = extractComments(code);
    console.log(comments);
    expect(comments.length).toBe(6);

  })
})