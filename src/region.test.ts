import { describe, expect, test } from "vitest";
import { dedent } from "ts-dedent";
import { extractContentWithinRegionSpecifiers, removeContentWithinRegionSpecifiers, replaceContentWithinRegionSpecifier } from "./region";

describe(extractContentWithinRegionSpecifiers.name, () => {
  test("basic", () => {
    const code = dedent`
      /* id-1 */
      This content should be extracted
      /* id-1 */

      This content should not be extracted
    `;
    const result = extractContentWithinRegionSpecifiers(code, "id-1");
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

    expect(extractContentWithinRegionSpecifiers(code, "id-1"))
      .toEqual("This content should be extracted\n/* id-2 */ This content should also be extracted /* id-2 */");

    expect(extractContentWithinRegionSpecifiers(code, "id-1", "id-2"))
      .toEqual("This content should be extracted\nThis content should also be extracted");

    expect(extractContentWithinRegionSpecifiers(code, "id-2"))
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
    expect(extractContentWithinRegionSpecifiers(code, "id-1"))
      .toEqual("This content should be extracted\n/* id-2 */\nThis content should also be extracted\n/* id-2 */");

    // NOTE: Nested full-line comments create extra newlines
    expect(extractContentWithinRegionSpecifiers(code, "id-1", "id-2"))
      .toEqual("This content should be extracted\nThis content should also be extracted");

    expect(extractContentWithinRegionSpecifiers(code, "id-2"))
      .toEqual("This content should also be extracted");
  });

  test("mixed line and in-line", () => {
    const code = dedent`
      /* id */
      const definitions = [
        "hello",
        "world",
      ] /* id */ satisfies string[];`;

    expect(extractContentWithinRegionSpecifiers(code, "id"))
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

    expect(extractContentWithinRegionSpecifiers(code, "id"))
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
      const result = removeContentWithinRegionSpecifiers(code, "id-1");
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
    const result = replaceContentWithinRegionSpecifier(code, "id", "world");
    expect(result).toEqual("world");
  })

  test("inline", () => {
    const code = dedent`
      func('hello', 'world', /* ... */ 'ignored', /* ... */)
    `;
    const result = replaceContentWithinRegionSpecifier(code, "...");
    expect(result).toEqual("func('hello', 'world', ...)");
  })
});