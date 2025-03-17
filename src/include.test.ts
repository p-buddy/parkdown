import { describe, expect, test } from "vitest";
import { dedent } from "ts-dedent";
import { extractContent, getAllPositionNodes, nodeSort, parse } from "./utils";
import { PsuedoFilesystem, lorem } from "./utils.test";
import { join } from "node:path";
import {
  getReplacementTargets,
  isSpecialLink,
  applyHeadingDepth,
  extendGetRelativePathContent,
  recursivelyPopulateInclusions,
  nodeDepthFinder,
  specialComment,
  isSpecialComment,
  getTopLevelCommentBlocks,
  extractContentWithinBoundaries,
} from "./include";


describe(isSpecialLink.name, () => {
  const check = (md: string, expectation: boolean) =>
    getAllPositionNodes(parse.md(md), "link")
      .forEach(node => expect(isSpecialLink(node)).toBe(expectation));

  const cases = {
    "non-link": ["test", false],
    "link has text": ["[test](http://example.com)", false],
    "link has no text, but unsupported target": ["[](file.md)", false],
    "web link": ["[](http://example.com)", true],
    "relative file, same directory": ["[](./file.md)", true],
    "relative file, different directory": ["[](../file.md)", true],
  } as const;

  for (const [description, [md, expectation]] of Object.entries(cases))
    test(description, () => check(md, expectation));
});

describe(nodeDepthFinder.name, () => {
  test("find depth in lorem", () => {
    for (const markdown of lorem.md) {
      const headings = markdown.split("\n")
        .map((content, index) => ({ content, line: index + 1 }))
        .filter(({ content }) => content.startsWith("#"))
        .map(heading => ({ ...heading, depth: heading.content.match(/^#+/)?.[0].length }));
      const ast = parse.md(markdown);
      const findDepth = nodeDepthFinder(ast);
      let index = headings.length - 1;
      for (const node of getAllPositionNodes(ast).sort(nodeSort.reverse)) {
        if (node.position.start.line < headings[index].line) index--;
        const depth = findDepth(node);
        expect(depth).toBe(headings[index].depth,);
      }
    }
  });
});

describe('applyHeadingDepth', () => {
  test('should increase heading levels by the specified depth', () => {
    const markdown = "# Heading 1\n\n## Heading 2\n\n### Heading 3";
    const result = applyHeadingDepth(markdown, 1);
    expect(result).toBe("## Heading 1\n\n### Heading 2\n\n#### Heading 3");
  });

  test('should decrease heading levels by the specified depth', () => {
    const markdown = "### Heading 3\n\n## Heading 2\n\n# Heading 1";
    const result = applyHeadingDepth(markdown, -1);
    expect(result).toBe("## Heading 3\n\n# Heading 2\n\n# Heading 1");
  });

  test('should cap heading levels at 6', () => {
    const markdown = "#### Heading 4\n\n##### Heading 5\n\n###### Heading 6";
    const result = applyHeadingDepth(markdown, 2);
    expect(result).toBe("###### Heading 4\n\n###### Heading 5\n\n###### Heading 6");
  });

  test('should not modify non-heading content', () => {
    const markdown = "# Heading 1\n\nSome regular text\n\n## Heading 2\n\n- List item 1\n- List item 2";
    const result = applyHeadingDepth(markdown, 1);
    expect(result).toBe("## Heading 1\n\nSome regular text\n\n### Heading 2\n\n- List item 1\n- List item 2");
  });

  test('should handle headings with different formatting', () => {
    const markdown = "# *Italic Heading*\n\n## **Bold Heading**\n\n### `Code Heading`";
    const result = applyHeadingDepth(markdown, 1);
    expect(result).toBe("## *Italic Heading*\n\n### **Bold Heading**\n\n#### `Code Heading`");
  });

  test('should handle headings with special characters', () => {
    const markdown = "# Heading with & special < characters >";
    const result = applyHeadingDepth(markdown, 2);
    expect(result).toBe("### Heading with & special < characters >");
  });

  test('should accept an existing AST as input', () => {
    const markdown = "# Heading 1\n\n## Heading 2";
    const ast = parse.md(markdown);
    const result = applyHeadingDepth(markdown, 2, ast);
    expect(result).toBe("### Heading 1\n\n#### Heading 2");
  });
});

/** 
describe(matchOpeningCommentsToLinks.name, () => {
  test("happy path", () => {
    const { text, ast } = md(`
${specialLinkText({ url: "./disconnected" })}

${specialLinkText({ url: "./inline" })} ${specialComment.begin}

${specialLinkText({ url: "./multiline" })} 
${specialComment.begin}

${specialLinkText({ url: "./mixed-disconnected" })} ${specialLinkText({ url: "./mixed-multiline" })} 
${specialComment.begin}
    `)

    const specialLinks = getAllPositionNodes(ast, "link").filter(isSpecialLink);
    const openingComments = getAllPositionNodes(ast, "html").filter(isSpecialComment("begin"));

    const matches = matchOpeningCommentsToLinks(text, specialLinks, openingComments);
    expect(matches).toEqual([
      specialLinks[0],
      [specialLinks[1], openingComments[0]],
      [specialLinks[2], openingComments[1]],
      specialLinks[3],
      [specialLinks[4], openingComments[2]],
    ])
  })

  test("non-whitespace content between link and opening comment", () => {
    const { text, ast } = md(`
${specialLinkText({ url: "./inline" })} hh ${specialComment.begin}
    `)

    const specialLinks = getAllPositionNodes(ast, "link").filter(isSpecialLink);
    const openingComments = getAllPositionNodes(ast, "html").filter(isSpecialComment("begin"));

    expect(() => matchOpeningCommentsToLinks(text, specialLinks, openingComments)).toThrow();
  })

  test("unmatched opening comment", () => {
    const { text, ast } = md(`
hh ${specialComment.begin}
    `)

    const specialLinks = getAllPositionNodes(ast, "link").filter(isSpecialLink);
    const openingComments = getAllPositionNodes(ast, "html").filter(isSpecialComment("begin"));

    expect(() => matchOpeningCommentsToLinks(text, specialLinks, openingComments)).toThrow();
  })
})
*/

/**
describe(matchCommentBlocks.name, () => {
  test("happy path", () => {
    const { text, ast } = md(`
${specialLinkText({ url: "./inline" })} ${specialComment.begin}
${specialComment.end}

${specialLinkText({ url: "./multiline" })} ${specialComment.begin}
HELLO WORLD
${specialComment.end}

${specialLinkText({ url: "./not-populated" })}

${specialLinkText({ url: "./nested" })} ${specialComment.begin}

${specialLinkText({ url: "./child" })}
${specialComment.begin}
${specialLinkText({ url: "./grandchild" })} ${specialComment.begin}
${specialComment.end}
${specialComment.end}
${specialComment.end}

${specialLinkText({ url: "./single-line" })} ${specialComment.begin} ${specialComment.end}

${specialLinkText({ url: "./not-populated" })}
    `)

    const specialLinks = getAllPositionNodes(ast, "link").filter(isSpecialLink);
    const openingComments = getAllPositionNodes(ast, "html").filter(isSpecialComment("begin"));
    const closingComments = getAllPositionNodes(ast, "html").filter(isSpecialComment("end"));

    const matches = matchOpeningCommentsToLinks(text, specialLinks, openingComments);
    const blocks = matchCommentBlocks(matches, closingComments);

    expect(blocks).toEqual([
      [specialLinks[0], openingComments[0], closingComments[0]],
      [specialLinks[1], openingComments[1], closingComments[1]],
      specialLinks[2],
      [specialLinks[3], openingComments[2], closingComments[4]],
      [specialLinks[6], openingComments[5], closingComments[5]],
      specialLinks[7],
    ])
  })
})
*/

describe(getTopLevelCommentBlocks.name, () => {
  test("problematic case", () => {
    const content = dedent`
      # Main heading

      [](./child/README.md)
      <!-- parkdown BEGIN -->
      ## Child heading

      [](./grandchild/README.md)
      <!-- parkdown BEGIN -->
      ### Grandchild heading

      Hello!
      <!-- parkdown END -->
      <!-- parkdown END -->

      End
    `;
    const ast = parse.md(content);
    const openingComments = getAllPositionNodes(ast, "html").filter(isSpecialComment("begin"));
    const closingComments = getAllPositionNodes(ast, "html").filter(isSpecialComment("end"));
    expect(openingComments.length).toBe(2);
    expect(closingComments.length).toBe(2);
    const blocks = getTopLevelCommentBlocks(openingComments, closingComments);
    expect(blocks.length).toBe(1);
    expect(blocks[0].open).toBe(openingComments[0]);
    expect(blocks[0].close).toBe(closingComments[1]);
  })
});

describe(extendGetRelativePathContent.name, () => {
  test('should call original function with resolved path', () => {
    const filesystem = new PsuedoFilesystem({
      root: { base: "", child: { a: "", b: "", nested: { a: "" } } }
    }, { setContentToPath: true });

    const fromRoot = (path: string) => filesystem.getFileFromAbsolutePath(join("root", path));

    expect(fromRoot("./base")).toBe("root/base");
    expect(fromRoot("./child/a")).toBe("root/child/a");
    expect(fromRoot("./child/b")).toBe("root/child/b");
    expect(fromRoot("./child/nested/a")).toBe("root/child/nested/a");

    const extended = extendGetRelativePathContent(fromRoot, { url: "./child/a" });
    expect(extended("../base")).toBe("root/base");
    expect(extended("./a")).toBe("root/child/a");
    expect(extended("./b")).toBe("root/child/b");
    expect(extended("./nested/a")).toBe("root/child/nested/a");
  });
});

describe(extractContentWithinBoundaries.name, () => {
  test("basic", () => {
    const code = dedent`
      /* id-1 */
      This content should be extracted
      /* id-1 */

      This content should not be extracted
    `;
    const result = extractContentWithinBoundaries(code, "id-1");
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
    expect(extractContentWithinBoundaries(code, "id-1"))
      .toEqual("This content should be extracted\n/* id-2 */ This content should also be extracted /* id-2 */");
    expect(extractContentWithinBoundaries(code, "id-1", "id-2"))
      .toEqual("This content should be extracted\nThis content should also be extracted");
    expect(extractContentWithinBoundaries(code, "id-2"))
      .toEqual("This content should also be extracted");
  });

  test("nested 1", () => {
    const code = dedent`
      /* id-1 */
      This content should be extracted
      /* id-2 */
      This content should also be extracted
      /* id-2 */
      /* id-1 */

      This content should not be extracted
    `;
    expect(extractContentWithinBoundaries(code, "id-1"))
      .toEqual("This content should be extracted\n/* id-2 */\nThis content should also be extracted\n/* id-2 */");
    // NOTE: Nested full-line comments create extra newlines
    expect(extractContentWithinBoundaries(code, "id-1", "id-2"))
      .toEqual("This content should be extracted\n\nThis content should also be extracted");
    expect(extractContentWithinBoundaries(code, "id-2"))
      .toEqual("This content should also be extracted");
  });
});

describe(recursivelyPopulateInclusions.name, () => {
  test("basic unpopulated", () => {
    const filesystem = new PsuedoFilesystem({
      "README.md": dedent`
        # Main heading

        [](./child/README.md)

        End parent
      `,
      child: {
        "README.md": dedent`
          # Child heading

          End child
        `,
      }
    });

    const fromRoot = (path: string) => filesystem.getFileFromAbsolutePath(join("", path));

    const result = recursivelyPopulateInclusions(filesystem.getFileFromAbsolutePath("README.md"), 0, fromRoot);
    expect(result).toBe(dedent`
      # Main heading

      [](./child/README.md)
      ${specialComment.begin}
      ## Child heading

      End child
      ${specialComment.end}

      End parent
    `)
    expect(result).toBe(recursivelyPopulateInclusions(result, 0, fromRoot));
  });

  test('should apply modifications to all top-level links in a markdown file', () => {

    const filesystem = new PsuedoFilesystem({
      "README.md": dedent`
        # Main heading

        [](./child/README.md)

        End
      `,
      child: {
        "README.md": dedent`
          # Child heading

          [](./grandchild/README.md)
          ${specialComment.begin}
          THIS SHOULD BE DELETED 
          ${specialComment.end}
        `,
        grandchild: {
          "README.md": dedent`
            # Grandchild heading

            Hello!
          `,
        }
      }
    });

    const fromRoot = (path: string) => filesystem.getFileFromAbsolutePath(join("", path));

    const result = recursivelyPopulateInclusions(filesystem.getFileFromAbsolutePath("README.md"), 0, fromRoot);
    expect(result).toBe(recursivelyPopulateInclusions(result, 0, fromRoot));
  });
});

describe(getReplacementTargets.name, () => {
  test('should return empty array for no special links or comments', () => {
    const emptyMarkdown = "# Just a heading\n\nNo special links or comments here.";
    const emptyAst = parse.md(emptyMarkdown);
    expect(getReplacementTargets(emptyMarkdown, emptyAst)).toEqual([]);
  });

  test('should handle single unpopulated special link (no closing comment)', () => {
    const singleLinkMarkdown = "# Heading\n\n[](http://example.com)";
    const singleLinkAst = parse.md(singleLinkMarkdown);
    const singleLinkTargets = getReplacementTargets(singleLinkMarkdown, singleLinkAst);
    expect(singleLinkTargets.length).toBe(1);
    expect(singleLinkTargets[0].url).toBe("http://example.com");
    expect(singleLinkTargets[0].headingDepth).toBe(1);
    expect(extractContent(singleLinkMarkdown, singleLinkTargets[0])).toBe("[](http://example.com)");
  });

  test('should handle special link with closing comment', () => {
    const linkWithCommentMarkdown =
      "# Main heading\n\n" +
      "## Section\n\n" +
      "[](./file.md)\n" +
      specialComment.begin + "\n" +
      "Some content\n" +
      specialComment.end;
    const linkWithCommentAst = parse.md(linkWithCommentMarkdown);
    const linkWithCommentTargets = getReplacementTargets(linkWithCommentMarkdown, linkWithCommentAst);
    expect(linkWithCommentTargets.length).toBe(1);
    expect(linkWithCommentTargets[0].url).toBe("./file.md");
    expect(linkWithCommentTargets[0].headingDepth).toBe(2);
    expect(
      extractContent(linkWithCommentMarkdown, linkWithCommentTargets[0])
    ).toBe(`[](./file.md)\n${specialComment.begin}\nSome content\n${specialComment.end}`);
  });

  test('should handle multiple links and comments', () => {
    const complexMarkdown =
      "# Main heading\n\n" +
      "## First section\n\n" +
      "[](./first.md)\n" +
      specialComment.begin + "\n" +
      "Some content\n" +
      specialComment.end + "\n\n" +
      "## Second section\n\n" +
      "[](./second.md)\n" +
      specialComment.begin + "\n" +
      "More content\n" +
      specialComment.end + "\n\n" +
      "## Third section\n\n" +
      "[](http://example.com)";
    const complexAst = parse.md(complexMarkdown);
    const complexTargets = getReplacementTargets(complexMarkdown, complexAst);
    expect(complexTargets.length).toBe(3);

    expect(complexTargets[0].url).toBe("./first.md");
    expect(complexTargets[0].headingDepth).toBe(2);
    expect(
      extractContent(complexMarkdown, complexTargets[0])
    ).toBe(`[](./first.md)\n${specialComment.begin}\nSome content\n${specialComment.end}`);

    expect(complexTargets[1].url).toBe("./second.md");
    expect(complexTargets[1].headingDepth).toBe(2);
    expect(
      extractContent(complexMarkdown, complexTargets[1])
    ).toBe(`[](./second.md)\n${specialComment.begin}\nMore content\n${specialComment.end}`);

    expect(complexTargets[2].url).toBe("http://example.com");
    expect(complexTargets[2].headingDepth).toBe(2);
    expect(
      extractContent(complexMarkdown, complexTargets[2])
    ).toBe("[](http://example.com)");
  });
});