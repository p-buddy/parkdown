import { describe, expect, test } from "vitest";
import { dedent } from "ts-dedent";
import { extractContentWithinRegionSpecifiers, asSingleLine, remapContentWithinRegionSpecifier, removeContentWithinRegionSpecifiers, replaceContentWithinRegionSpecifier, spliceContentAtRegionBoundarySpecifier, trimAroundRegionBoundaries } from "./region";
import { removeAllParkdownComments } from "./comments";

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

describe(spliceContentAtRegionBoundarySpecifier.name, () => {
  test("basic", () => {
    const code = dedent`
      /* id */ hello /* id */
    `;

    expect(
      spliceContentAtRegionBoundarySpecifier(code, "id", "start", undefined, "world")
    ).toEqual("world" + code);
    expect(
      spliceContentAtRegionBoundarySpecifier(code, "id", "end", 0, "world")
    ).toEqual(code + "world");

    // Check clamping
    expect(
      spliceContentAtRegionBoundarySpecifier(code, "id", "start", -1, "world")
    ).toEqual("world" + code);
    expect(
      spliceContentAtRegionBoundarySpecifier(code, "id", "end", 1, "world")
    ).toEqual(code + "world");

    expect(
      spliceContentAtRegionBoundarySpecifier("xxx" + code, "id", "start", -3, "world")
    ).toEqual("world" + code);

    expect(
      spliceContentAtRegionBoundarySpecifier(code, "id", "start", 0, "xxx")
    ).toEqual(code.replace(" hello", "xxx hello"));

    expect(
      spliceContentAtRegionBoundarySpecifier(code + "xxx", "id", "end", 3, "world")
    ).toEqual(code + "world");
  })

  test("inter-comment", () => {
    const code = `xx/* id-1 */ hello /* id-2 */ world /* id-2 */ /* id-1 */xx`;

    expect(
      spliceContentAtRegionBoundarySpecifier(code, "id-1", "end", -3)
    ).toEqual(`xx/* id-1 */ hello /* id-2 */ worl/* id-2 *//* id-1 */xx`);

    expect(
      spliceContentAtRegionBoundarySpecifier(code, "id-2", "end", 3)
    ).toEqual(`xx/* id-1 */ hello /* id-2 */ world /* id-2 *//* id-1 */`);

    expect(
      spliceContentAtRegionBoundarySpecifier(code, "id-2", "start", -8)
    ).toEqual(`x/* id-1 *//* id-2 */ world /* id-2 */ /* id-1 */xx`);

    expect(
      spliceContentAtRegionBoundarySpecifier(code, "id-2", "start", 8)
    ).toEqual(`xx/* id-1 */ hello /* id-2 *//* id-2 *//* id-1 */xx`);

    expect(
      spliceContentAtRegionBoundarySpecifier(code, "id-2", "start", 8, "...")
    ).toEqual(`xx/* id-1 */ hello /* id-2 *//* id-2 */.../* id-1 */xx`);

    expect(
      spliceContentAtRegionBoundarySpecifier(code, "id-2", "start", 0, "...")
    ).toEqual(`xx/* id-1 */ hello /* id-2 */... world /* id-2 */ /* id-1 */xx`);
  })
});

describe(remapContentWithinRegionSpecifier.name, () => {
  test("basic", () => {
    const code = dedent`
      /* id */
      hello
      /* id */
    `;

    expect(
      remapContentWithinRegionSpecifier(code, "id", "hello", "world")
    ).toEqual(code.replace("hello", "world"));

    expect(
      remapContentWithinRegionSpecifier(code, "id", "\n", " ")
    ).toEqual("/* id */ hello /* id */");

    expect(
      remapContentWithinRegionSpecifier(code, "id", "-line-", "-")
    ).toEqual("/* id */ hello /* id */");
  })

});

describe(asSingleLine.name, () => {
  test("basic", () => {
    const code = dedent`
      /* id */
      hello 
      /* id */
    `;

    expect(asSingleLine(code, "id")).toEqual("/* id */ hello /* id */");
  })
  test("complex", () => {
    const code = dedent`
      <Tag>
        <!-- pd: snippet-head begin -->
        {#snippet vest(
          /* pd: pocket begin */
          pocket: /* pd: type begin */
          {
            /* pd: div-prop */
            container: HTMLDivElement;
            /* pd: div-prop */
            /* pd: value-prop */
            value: string;
            /* pd: value-prop */
          } /* pd: type end */,
          /* pd: pocket end */
        )}
        <!-- pd: snippet-head end -->
      </Tag>
    `;

    const result = asSingleLine(code, "snippet-head");
    console.log(result);
    console.log(removeAllParkdownComments(result));
  })
});

describe(trimAroundRegionBoundaries.name, () => {
  test("basic", () => {
    const code = dedent`
      x /* id */
      hello
      /* id */ x
    `;

    expect(trimAroundRegionBoundaries(code, "id", { start: { right: true } })).toEqual("x /* id */hello\n/* id */ x");
    expect(trimAroundRegionBoundaries(code, "id", { end: { left: true } })).toEqual("x /* id */\nhello/* id */ x");
    expect(trimAroundRegionBoundaries(code, "id", { end: { right: true } })).toEqual("x /* id */\nhello\n/* id */x");
    expect(trimAroundRegionBoundaries(code, "id", { start: { left: true } })).toEqual("x/* id */\nhello\n/* id */ x");
  })
});