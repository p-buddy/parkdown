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

describe(getTopLevelCommentBlocks.name, () => {
  test("basic", () => {
    const content = dedent`
      # Main heading

      [](./child/README.md)
      <!-- p↓ BEGIN -->
      ## Child heading

      [](./grandchild/README.md)
      <!-- p↓ BEGIN -->
      ### Grandchild heading

      Hello!
      <!-- p↓ END -->
      <!-- p↓ END -->

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
      ${specialComment.lengthOf("#" + filesystem.getFileFromAbsolutePath("child/README.md"))}
      ${"#" + filesystem.getFileFromAbsolutePath("child/README.md")}
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

  test('with code boundary', () => {
    const filesystem = new PsuedoFilesystem({
      "README.md": dedent`
        # Main heading

        [](./child/file.ts?region=extract(boundary))

        End
      `,
      child: {
        "file.ts": dedent`
          if (true) {
            /* boundary */
            const x = 5;
            /* boundary */
          }
        `,
      }
    });

    const fromRoot = (path: string) => filesystem.getFileFromAbsolutePath(join("", path));

    const result = recursivelyPopulateInclusions(filesystem.getFileFromAbsolutePath("README.md"), 0, fromRoot);
    const includedCode = `
\`\`\`ts
const x = 5;
\`\`\`
`;
    expect(result).toBe(dedent`
      # Main heading

      [](./child/file.ts?region=extract(boundary))
      ${specialComment.begin}
      ${specialComment.lengthOf(includedCode)}

      \`\`\`ts
      const x = 5;
      \`\`\`

      ${specialComment.end}
      
      End`
    )
  })

  test('with wrapped in dropdown', () => {
    const filesystem = new PsuedoFilesystem({
      "README.md": dedent`
        # Main heading

        [](./child/README.md?wrap=dropdown('Open-me,-please!'))
      `,
      child: {
        "README.md": dedent`
          Hello!
        `,
      }
    });

    const fromRoot = (path: string) => filesystem.getFileFromAbsolutePath(join("", path));

    const result = recursivelyPopulateInclusions(filesystem.getFileFromAbsolutePath("README.md"), 0, fromRoot);
    const expectedDropdown =
      "\n" +
      dedent`
        <details>
        <summary>
        Open me, please!
        </summary>
        Hello!
        </details>
      ` +
      "\n";
    expect(result).toBe(dedent`
      # Main heading

      [](./child/README.md?wrap=dropdown('Open-me,-please!'))
      ${specialComment.begin}
      ${specialComment.lengthOf(expectedDropdown)}
      ${expectedDropdown}
      ${specialComment.end}`
    );
  })
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