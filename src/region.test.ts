import { describe, expect, test } from "vitest";
import { dedent } from "ts-dedent";
import { extractContentWithinRegionSpecifiers, asSingleLine, remapContentWithinRegionSpecifier, removeContentWithinRegionSpecifiers, replaceContentWithinRegionSpecifier, spliceContentAtRegionBoundarySpecifier, trimAroundRegionBoundaries } from "./region";
import { removeAllParkdownComments } from "./comments";

describe(extractContentWithinRegionSpecifiers.name, () => {
  const extractAndDropComments = (content: string, ...specifiers: string[]) =>
    removeAllParkdownComments(extractContentWithinRegionSpecifiers(content, ...specifiers));

  test("basic", () => {
    const code = dedent`
      /* (pd) id-1 */
      This content should be extracted
      /* (pd) id-1 */

      This content should not be extracted
    `;
    expect(extractAndDropComments(code, "id-1")).toEqual("This content should be extracted");
  });

  test("nested 1", () => {
    const code = dedent`
      /* (pd) id-1 */
      This content should be extracted
      /* (pd) id-2 */ This content should also be extracted /* (pd) id-2 */
      /* (pd) id-1 */

      This content should not be extracted
    `;

    expect(extractAndDropComments(code.replaceAll("(pd) id-2", "id-2"), "id-1"))
      .toEqual("This content should be extracted\n/* id-2 */ This content should also be extracted /* id-2 */");

    expect(extractAndDropComments(code, "id-1", "id-2"))
      .toEqual("This content should be extracted\nThis content should also be extracted");

    expect(extractAndDropComments(code, "id-2"))
      .toEqual("This content should also be extracted");
  });

  test("nested 2", () => {
    const code = dedent`
      /* (pd) id-1 */
      This content should be extracted
      /* (pd) id-2 */
      This content should also be extracted
      /* (pd) id-2 */
      /* (pd) id-1 */

      This content should not be extracted
    `;

    expect(extractAndDropComments(code, "id-1", "id-2"))
      .toEqual("This content should be extracted\nThis content should also be extracted");

    expect(extractAndDropComments(code, "id-2"))
      .toEqual("This content should also be extracted");
  });

  test("mixed line and in-line", () => {
    const code = dedent`
      /* (pd) id */
      const definitions = [
        "hello",
        "world",
      ] /* (pd) id */ satisfies string[];`;

    expect(extractAndDropComments(code, "id"))
      .toEqual(dedent`
        const definitions = [
          "hello",
          "world",
        ]`
      );
  })

  test("split", () => {
    const code = dedent`
      /* (pd) id */
      hello,
      /* (pd) id */

      /* (pd) id */
      world
      /* (pd) id */


      /* (pd) id */
      !
      /* (pd) id */
    `;

    expect(extractAndDropComments(code, "id"))
      .toEqual(dedent`
        hello,
        world
        !`
      );
  })

  test("with identation", () => {
    const code = dedent`
      /* (pd) id */
      hello,
      /* (pd) id */

        /* (pd) id */
        world
        /* (pd) id */


      /* (pd) id */
      !
      /* (pd) id */
    `;

    expect(extractAndDropComments(code, "id"))
      .toEqual(dedent`
        hello,
          world
        !`
      );
  })
});

describe(removeContentWithinRegionSpecifiers.name, () => {
  const removeAndDropComments = (content: string, ...specifiers: string[]) =>
    removeAllParkdownComments(removeContentWithinRegionSpecifiers(content, ...specifiers));

  test("basic", () => {
    const codes = [
      dedent`
        hello
        /* (pd) id-1 */
        This content should be removed
        /* (pd) id-1 */
        world
      `,
      dedent`
        hello
        /* (pd) id-1 */ This content should be removed /* (pd) id-1 */
        world
      `
    ];
    const expected = "hello\nworld";
    for (const code of codes) {
      const result = removeAndDropComments(code, "id-1");
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
  });

  test("no specifier", () => {
    const code = dedent`
      /* id */
      hello
      /* id */
    `;

    expect(
      remapContentWithinRegionSpecifier(code, undefined, "hello", "world")
    ).toEqual(code.replace("hello", "world"));
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