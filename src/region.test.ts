import { describe, expect, test } from "vitest";
import { dedent } from "ts-dedent";
import { extractComments, extractContentWithinRegionSpecifiers, removeAllParkdownComments, removeContentWithinRegionSpecifiers, replaceContentWithinRegionSpecifier } from "./region";
import _extractComments from "multilang-extract-comments";

const svelteComponent = dedent`
<Component prop={/* B */ async () => {
  /* B */
}}>
  <!-- C -->
  <p>Hello</p>
  <!-- C -->
</Component>
`

const svelteExample = dedent`
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

const js = (content: string) => ({ content, extension: "js" });

describe(extractComments.name, () => {
  test("basic", () => {
    const comments = extractComments({ content: svelteExample, extension: "svelte" });
    console.log(comments);
    expect(comments.length).toBe(6);
  })
});

describe(extractContentWithinRegionSpecifiers.name, () => {
  test("basic", () => {
    const code = dedent`
      /* id-1 */
      This content should be extracted
      /* id-1 */

      This content should not be extracted
    `;
    const result = extractContentWithinRegionSpecifiers({ content: code, extension: "js" }, "id-1");
    expect(result).toEqual("This content should be extracted");
  });

  test("nested 1", () => {
    const code = dedent`
      /* id-1 */
      This content should be extracted
      /* id-2 */ This content should also be extracted /* id-2 */
      /* id-1 */

      This content should not be extracted
    `;

    expect(extractContentWithinRegionSpecifiers(js(code), "id-1"))
      .toEqual("This content should be extracted\n/* id-2 */ This content should also be extracted /* id-2 */");

    expect(extractContentWithinRegionSpecifiers(js(code), "id-1", "id-2"))
      .toEqual("This content should be extracted\nThis content should also be extracted");

    expect(extractContentWithinRegionSpecifiers(js(code), "id-2"))
      .toEqual("This content should also be extracted");
  });

  test("nested 2", () => {
    const code = dedent`
      /* id-1 */
      This content should be extracted
      /* id-2 */
      This content should also be extracted
      /* id-2 */
      /* id-1 */

      This content should not be extracted
    `;
    expect(extractContentWithinRegionSpecifiers(js(code), "id-1"))
      .toEqual("This content should be extracted\n/* id-2 */\nThis content should also be extracted\n/* id-2 */");

    // NOTE: Nested full-line comments create extra newlines
    expect(extractContentWithinRegionSpecifiers(js(code), "id-1", "id-2"))
      .toEqual("This content should be extracted\nThis content should also be extracted");

    expect(extractContentWithinRegionSpecifiers(js(code), "id-2"))
      .toEqual("This content should also be extracted");
  });

  test("mixed line and in-line", () => {
    const code = dedent`
      /* id */
      const definitions = [
        "hello",
        "world",
      ] /* id */ satisfies string[];`;

    expect(extractContentWithinRegionSpecifiers(js(code), "id"))
      .toEqual(dedent`
        const definitions = [
          "hello",
          "world",
        ]`
      );
  })

  test("split", () => {
    const code = dedent`
      /* id */
      hello,
      /* id */

      /* id */
      world
      /* id */


      /* id */
      !
      /* id */
    `;

    expect(extractContentWithinRegionSpecifiers(js(code), "id"))
      .toEqual(dedent`
        hello,
        world
        !`
      );
  })
});

describe(removeContentWithinRegionSpecifiers.name, () => {
  test("basic", () => {
    const codes = [
      dedent`
        hello
        /* id-1 */
        This content should be removed
        /* id-1 */
        world
      `,
      dedent`
        hello
        /* id-1 */ This content should be removed /* id-1 */
        world
      `
    ];
    const expected = "hello\nworld";
    for (const code of codes) {
      const result = removeContentWithinRegionSpecifiers(js(code), "id-1");
      expect(result).toEqual(expected);
    }

  });
});

describe(replaceContentWithinRegionSpecifier.name, () => {
  test("basic", () => {
    const code = dedent`
      /* id */
      hello
      /* id */
    `;
    const result = replaceContentWithinRegionSpecifier(js(code), "id", "world");
    expect(result).toEqual("world");
  })

  test("inline", () => {
    const code = dedent`
      func('hello', 'world', /* ... */ 'ignored', /* ... */)
    `;
    const result = replaceContentWithinRegionSpecifier(js(code), "...");
    expect(result).toEqual("func('hello', 'world', ...)");
  })
});


describe(removeAllParkdownComments.name, () => {
  test("block", () => {
    const code = dedent`
      /* p↓: */
      Hello
      /* p↓: */
    `
    expect(removeAllParkdownComments(js(code))).toBe("Hello")
  });

  test("line", () => {
    const code = "/* p↓: */ Hello /* p↓: */"
    expect(removeAllParkdownComments(js(code))).toBe("Hello")
  })

  test("mixed 1", () => {
    const code = dedent`
      Hello /* p↓: */ Hello /** p↓: **/ Hello
      Hello
      /* p↓: */
      Hello
      /* p↓: */`;
    expect(removeAllParkdownComments(js(code))).toBe(dedent`
      Hello Hello Hello
      Hello
      Hello
    `);
  });

  test("mixed 2", () => {
    const code = dedent`
      /* p↓: */
      Hello
      /* p↓: */
      Hello /* p↓: */ Hello /** p↓: **/ Hello
      Hello`;
    expect(removeAllParkdownComments(js(code))).toBe(dedent`
      Hello
      Hello Hello Hello
      Hello
    `);
  })

  test("mixed 3", () => {
    const code = dedent`
      // p↓:
      Hello
      // p↓:
      Hello /* p↓: */ Hello /** p↓: **/ Hello
      Hello`;
    expect(removeAllParkdownComments(js(code))).toBe(dedent`
      Hello
      Hello Hello Hello
      Hello
    `);
  })
})