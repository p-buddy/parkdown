import { describe, expect, test } from "vitest";
import { getAllPositionNodes, nodeSort, parse } from "./utils";
import { PsuedoFilesystem, lorem } from "./utils.test";
import { visit, } from "unist-util-visit";
import { join } from "node:path";
import {
  getReplacementTargets,
  extractRegion,
  isSpecialLink,
  applyHeadingDepth,
  replaceRegion,
  extendGetRelativePathContent,
  recursivelyApplyInclusions,
  nodeDepthFinder
} from "./include";


describe(isSpecialLink.name, () => {
  const check = (md: string, expectation: boolean) =>
    visit(parse.md(md), "link", (node) => expect(isSpecialLink(node)).toBe(expectation));

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

describe('replaceRegion', () => {
  test('should replace a single-line region', () => {
    const lines = [
      "# Heading",
      "[](http://example.com)",
      "Some other content"
    ];

    const content = "This is new content";
    const result = replaceRegion(lines.join("\n"), {
      region: {
        start: { line: 2, column: 1 },
        end: { line: 2, column: lines[1].length }
      }
    }, content);

    expect(result).toBe([
      "# Heading",
      content,
      "Some other content"
    ].join("\n"));
  });

  test('should replace a multi-line region', () => {
    const lines = [
      "# Heading",
      "First line",
      "Second line",
      "Third line",
      "Footer"
    ];

    const content = "Replacement content";
    const result = replaceRegion(lines.join("\n"), {
      region: {
        start: { line: 2, column: 1 },
        end: { line: 4, column: 10 }
      }
    }, content);

    expect(result).toBe([
      "# Heading",
      "Replacement content",
      "Footer"
    ].join("\n"));
  });

  test('should handle partial line replacements', () => {
    const markdown = "The quick brown fox jumps over the lazy dog";
    const result = replaceRegion(markdown, {
      region: {
        start: { line: 1, column: "The quick ".length + 1 /** +1 since we want to start at the 'b' of brown */ },
        end: { line: 1, column: "The quick brown".length }
      }
    }, "fast");

    expect(result).toBe("The quick fast fox jumps over the lazy dog");
  });

  test('should handle replacement at start of document', () => {
    const lines = [
      "Replace this line",
      "Keep this line",
      "And this one"
    ];

    const result = replaceRegion(lines.join("\n"), {
      region: {
        start: { line: 1, column: 1 },
        end: { line: 1, column: 17 }
      }
    }, "New first line");

    expect(result).toBe([
      "New first line",
      "Keep this line",
      "And this one"
    ].join("\n"));
  });

  test('should handle replacement at end of document', () => {
    const lines = [
      "Keep this line",
      "And this one",
      "Replace last line"
    ];

    const result = replaceRegion(lines.join("\n"), {
      region: {
        start: { line: 3, column: 1 },
        end: { line: 3, column: 17 }
      }
    }, "New last line");

    expect(result).toBe([
      "Keep this line",
      "And this one",
      "New last line"
    ].join("\n"));
  });

  test('should handle multi-line replacement with partial lines', () => {
    const lines = [
      "Start of first line <-- keep left of arrow",
      "Remove all of this line",
      "End of last line --> keep only this"
    ];

    const result = replaceRegion(lines.join("\n"), {
      region: {
        start: { line: 1, column: "Start of first line".length + 1 },
        end: { line: 3, column: "End of last line --> ".length }
      }
    }, " inserted text ");

    expect(result).toBe("Start of first line inserted text keep only this");
  });

  test('should preserve empty lines in replacement content', () => {
    const lines = [
      "First line",
      "Replace this",
      "And this",
      "Last line"
    ];

    const result = replaceRegion(lines.join("\n"), {
      region: {
        start: { line: 2, column: 1 },
        end: { line: 3, column: 9 }
      }
    }, "New content\n\nWith empty line");

    expect(result).toBe([
      "First line",
      "New content\n\nWith empty line",
      "Last line"
    ].join("\n"));
  });

  test('should handle empty replacement content', () => {
    const lines = [
      "Keep this",
      "Remove this",
      "Keep this too"
    ];

    const result = replaceRegion(lines.join("\n"), {
      region: {
        start: { line: 2, column: 1 },
        end: { line: 2, column: 12 }
      }
    }, "");

    expect(result).toBe([
      "Keep this",
      "",
      "Keep this too"
    ].join("\n"));
  });
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

describe(recursivelyApplyInclusions.name, () => {
  test('should apply modifications to all links in a markdown file', () => {

    const filesystem = new PsuedoFilesystem({
      "README.md": `# Main heading

      [](./child/README.md)
      THIS SHOULD BE DELETED <!-- parkdown END -->

      End`,
      child: {
        "README.md": `# Child heading

        [](./grandchild/README.md)
        THIS SHOULD BE DELETED 
        <!-- parkdown END -->`,
        grandchild: {
          "README.md": `# Grandchild heading
          
          Hello!`
        }
      }
    }, { dedent: true });

    const fromRoot = (path: string) => filesystem.getFileFromAbsolutePath(join("", path));

    const result = recursivelyApplyInclusions(filesystem.getFileFromAbsolutePath("README.md"), 0, fromRoot);
    console.log(result);

  });
});

describe(getReplacementTargets.name, () => {
  test('should return empty array for no special links or comments', () => {
    const emptyMarkdown = "# Just a heading\n\nNo special links or comments here.";
    const emptyAst = parse.md(emptyMarkdown);
    expect(getReplacementTargets(emptyAst)).toEqual([]);
  });

  test('should handle single unpopulated special link (no closing comment)', () => {
    const singleLinkMarkdown = "# Heading\n\n[](http://example.com)";
    const singleLinkAst = parse.md(singleLinkMarkdown);
    const singleLinkTargets = getReplacementTargets(singleLinkAst);
    expect(singleLinkTargets.length).toBe(1);
    expect(singleLinkTargets[0].url).toBe("http://example.com");
    expect(singleLinkTargets[0].headingDepth).toBe(1);
    expect(extractRegion(singleLinkMarkdown, singleLinkTargets[0])).toBe("[](http://example.com)");
  });

  test('should handle special link with closing comment', () => {
    const linkWithCommentMarkdown =
      "# Main heading\n\n" +
      "## Section\n\n" +
      "[](./file.md)\n\n" +
      "Some content\n\n" +
      "<!-- parkdown END test -->";
    const linkWithCommentAst = parse.md(linkWithCommentMarkdown);
    const linkWithCommentTargets = getReplacementTargets(linkWithCommentAst);
    expect(linkWithCommentTargets.length).toBe(1);
    expect(linkWithCommentTargets[0].url).toBe("./file.md");
    expect(linkWithCommentTargets[0].headingDepth).toBe(2);
    expect(
      extractRegion(linkWithCommentMarkdown, linkWithCommentTargets[0])
    ).toBe("[](./file.md)\n\nSome content\n\n<!-- parkdown END test -->");
  });

  test('should handle multiple links and comments', () => {
    const complexMarkdown =
      "# Main heading\n\n" +
      "## First section\n\n" +
      "[](./first.md)\n\n" +
      "Some content\n\n" +
      "<!-- parkdown END first -->\n\n" +
      "## Second section\n\n" +
      "[](./second.md)\n\n" +
      "More content\n\n" +
      "<!-- parkdown END second -->\n\n" +
      "## Third section\n\n" +
      "[](http://example.com)";
    const complexAst = parse.md(complexMarkdown);
    const complexTargets = getReplacementTargets(complexAst);
    expect(complexTargets.length).toBe(3);

    // First replacement target should be the populated link (with comment)
    expect(complexTargets[0].url).toBe("./first.md");
    expect(complexTargets[0].headingDepth).toBe(2);
    expect(
      extractRegion(complexMarkdown, complexTargets[0])
    ).toBe("[](./first.md)\n\nSome content\n\n<!-- parkdown END first -->");

    // Second replacement target should be the populated link (with comment)
    expect(complexTargets[1].url).toBe("./second.md");
    expect(complexTargets[1].headingDepth).toBe(2);
    expect(
      extractRegion(complexMarkdown, complexTargets[1])
    ).toBe("[](./second.md)\n\nMore content\n\n<!-- parkdown END second -->");

    // Third replacement target should be the unpopulated link (no comment)
    expect(complexTargets[2].url).toBe("http://example.com");
    expect(complexTargets[2].headingDepth).toBe(2);
    expect(
      extractRegion(complexMarkdown, complexTargets[2])
    ).toBe("[](http://example.com)");
  });
});