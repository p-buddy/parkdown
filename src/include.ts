import { URL, URLSearchParams } from "node:url";
import { getAllPositionNodes, parse, hasPosition, linkHasNoText, lined, spaced, Html, nodeSort, replaceWithContent, getContentInBetween } from "./utils";
import { type AstRoot, type Link, type PositionNode, type HasPosition, Intervals } from "./utils"
import { dirname, join, basename } from "node:path";
import extract from "extract-comments";
import { wrap as wrapInElement, COMMA_NOT_IN_PARENTHESIS } from "./wrap";
import { dedent } from "ts-dedent";

const specialLinkTargets = ["http", "./", "../"] as const;
const isSpecialLinkTarget = ({ url }: Link) => specialLinkTargets.some(target => url.startsWith(target));

export type SpecialLink = PositionNode<"link">;
export const isSpecialLink = (node: Link): node is SpecialLink =>
  hasPosition(node) && linkHasNoText(node) && isSpecialLinkTarget(node);
export const specialLinkText = ({ url }: Pick<SpecialLink, "url">) => `[](${url})` as const;

type CommentType = "begin" | "end";

export const specialComment = {
  _open: "<!--" as const,
  _close: "-->" as const,
  _flag: "parkdown" as const,
  get begin() { return spaced(specialComment._open, specialComment._flag, "BEGIN", specialComment._close) },
  get end() { return spaced(specialComment._open, specialComment._flag, "END", specialComment._close) },
};

export type SpecialComment<T extends CommentType = CommentType> = PositionNode<"html"> & { value: typeof specialComment[T] };

export const isSpecialComment = <T extends CommentType>(type: T) =>
  (node: Html): node is SpecialComment<T> => hasPosition(node) && node.value === specialComment[type];

export type ReplacementTarget = {
  url: string;
  headingDepth: number;
  inline: boolean;
} & HasPosition;

const replaceUnpopulated = (
  { position, url, siblingCount }: SpecialLink, headingDepth: number
): ReplacementTarget => ({ position, url, headingDepth, inline: siblingCount >= 1 })

const replacePopulated = (
  { position: { start }, url, siblingCount }: SpecialLink, { position: { end } }: SpecialComment<"end">, headingDepth: number
): ReplacementTarget => ({ position: { start, end }, url, headingDepth, inline: siblingCount >= 1 });

export const getReplacementContent = (target: Pick<ReplacementTarget, "url" | "inline">, content: string) =>
  target.inline
    ? `${specialLinkText(target)} ${specialComment.begin} ${content} ${specialComment.end}` as const
    : lined(specialLinkText(target), specialComment.begin, content, specialComment.end);

export const nodeDepthFinder = (ast: AstRoot) => {
  const headingDepth = getAllPositionNodes(ast, "heading")
    .reduce((acc, { position, depth }) => acc.set(position.start.line, depth), new Map<number, number>())
  return (node: HasPosition) => {
    for (let i = node.position.start.line; i >= 1; i--) {
      const depth = headingDepth.get(i);
      if (depth) return depth;
    }
    return 0;
  }
}

const error = {
  openingCommentDoesNotFollowLink: ({ position: { start } }: SpecialComment<"begin">) =>
    new Error(`Opening comment (@${start.line}:${start.column}) does not follow link`),
  closingCommentNotMatchedToOpening: ({ position: { start } }: SpecialComment<"end">) =>
    new Error(`Closing comment (@${start.line}:${start.column}) does not match to opening comment`),
  openingCommentNotClosed: ({ position: { start } }: SpecialComment<"begin">) =>
    new Error(`Opening comment (@${start.line}:${start.column}) is not followed by a closing comment`),
}

export const getTopLevelCommentBlocks = (
  openingComments: SpecialComment<"begin">[], closingComments: SpecialComment<"end">[]
) => {
  const blocks: { open: SpecialComment<"begin">, close: SpecialComment<"end"> }[] = [];

  const combined = [
    ...openingComments.map(node => ({ node, type: "open" as const })),
    ...closingComments.map(node => ({ node, type: "close" as const }))
  ].sort((a, b) => nodeSort(a.node, b.node));

  const stack: (typeof combined[number] & { type: "open" })[] = [];

  for (const item of combined)
    if (item.type === "open") stack.push(item)
    else {
      const close = item.node as SpecialComment<"end">;
      if (stack.length === 0)
        throw error.closingCommentNotMatchedToOpening(close);
      const open = stack.pop()!.node;
      if (stack.length > 0) continue;
      blocks.push({ open, close });
    }

  if (stack.length > 0)
    throw error.openingCommentNotClosed(stack[0].node);

  return blocks;
}

type CommentBlocks = ReturnType<typeof getTopLevelCommentBlocks>;

export const matchCommentBlocksToLinks = (
  markdown: string, links: SpecialLink[], blocks: CommentBlocks
) => {
  const linkCandidates = [...links].sort(nodeSort);
  const results: (SpecialLink | [SpecialLink, CommentBlocks[number]])[] = [];

  [...blocks]
    .sort((a, b) => nodeSort.reverse(a.open, b.open))
    .forEach(block => {
      while (linkCandidates.length > 0) {
        const link = linkCandidates.pop()!;
        if (link.position.start.offset < block.open.position.start.offset) {
          if (getContentInBetween(markdown, link, block.open).trim() !== "")
            throw error.openingCommentDoesNotFollowLink(block.open);
          return results.push([link, block]);
        }
        results.push(link);
      }
      throw error.openingCommentDoesNotFollowLink(block.open);
    });

  results.push(...linkCandidates.reverse());
  return results.reverse();
}

export const getReplacementTargets = (markdwn: string, ast?: AstRoot): ReplacementTarget[] => {
  ast ??= parse.md(markdwn);
  const findDepth = nodeDepthFinder(ast);
  const specialLinks = getAllPositionNodes(ast, "link").filter(isSpecialLink);
  const htmlNodes = getAllPositionNodes(ast, "html").sort(nodeSort);
  const openingComments = htmlNodes.filter(isSpecialComment("begin"));
  const closingComments = htmlNodes.filter(isSpecialComment("end"));
  const blocks = getTopLevelCommentBlocks(openingComments, closingComments);
  const resolved = matchCommentBlocksToLinks(markdwn, specialLinks, blocks)
  return resolved.map(block => Array.isArray(block)
    ? replacePopulated(block[0], block[1].close, findDepth(block[0]))
    : replaceUnpopulated(block, findDepth(block)))
}

export type GetRelativePathContent = (path: string) => string;

export const extendGetRelativePathContent = (
  getRelativePathContent: GetRelativePathContent, { url }: Pick<ReplacementTarget, "url">
) => ((path) => getRelativePathContent(join(dirname(url), path))) satisfies GetRelativePathContent;

const clampHeadingSum = (...toSum: number[]) => {
  const sum = toSum.reduce((a, b) => a + b, 0);
  return Math.min(Math.max(sum, 1), 6) as 1 | 2 | 3 | 4 | 5 | 6;
}

export const applyHeadingDepth = (markdown: string, headingDepth: number, ast?: AstRoot) => {
  if (headingDepth === 0) return markdown;
  ast ??= parse.md(markdown);
  const nodes = getAllPositionNodes(ast, "heading");
  const lines = markdown.split("\n");
  for (const node of nodes) {
    const { depth, position: { start, end } } = node;
    const adjusted = clampHeadingSum(depth, headingDepth);
    const text = lines[start.line - 1].slice(depth, end.column);
    const replacement = `#`.repeat(adjusted) + text;
    lines[start.line - 1] = replacement;
    node.depth = adjusted;
  }
  return lines.join("\n");
}

export const extractContentWithinBoundaries = (markdown: string, ...queries: string[]) => {
  if (queries.length === 0) return markdown;
  type ExtractedComment = {
    type: 'BlockComment' | 'LineComment',
    value: string,
    range: [number, number],
    loc: {
      start: { line: number, column: number },
      end: { line: number, column: number },
    },
    raw: string,
  };

  const lines = markdown.split("\n");
  const content = (range: [number, number]) => markdown.slice(range[0], range[1]);
  const isFullLine = ({ loc, range }: ExtractedComment) => content(range) === lines[loc.end.line - 1];

  const comments = ((extract as any)(markdown) as ExtractedComment[]);

  const extraction = new Intervals();
  const markers = new Intervals();

  for (const query of queries) {
    const matching = comments
      .filter(({ value }) => value.includes(query))
      .sort((a, b) => a.range[0] - b.range[0]);

    for (let i = 0; i < matching.length - 1; i += 2) {
      const open = matching[i];
      const close = matching[i + 1];
      extraction.push(
        isFullLine(open) ? open.range[1] + 1 : open.range[1],
        isFullLine(close) ? close.range[0] - 1 : close.range[0]);
      markers.push(open.range[0], open.range[1]);
      markers.push(close.range[0], close.range[1]);
    }
  }

  extraction.collapse();
  markers.collapse();

  return dedent(
    extraction.subtract(markers)
      .map(([start, end]) => markdown.substring(start, end))
      .filter(Boolean)
      .join("")
  ).trim();
};

export const removePopulatedInclusions = (markdown: string) =>
  getReplacementTargets(markdown)
    .reverse()
    .sort(nodeSort.reverse)
    .reduce((md, target) => replaceWithContent(md, specialLinkText(target), target), markdown);

export const recursivelyPopulateInclusions = (
  markdown: string,
  headingDepth: number,
  getRelativePathContent: GetRelativePathContent,
) => {
  markdown = removePopulatedInclusions(markdown);
  markdown = applyHeadingDepth(markdown, headingDepth);
  const ast = parse.md(markdown);

  return getReplacementTargets(markdown, ast)
    .sort(nodeSort)
    .reverse()
    .map(target => {
      const { url, headingDepth, inline } = target;
      const [base, ...splitOnMark] = basename(url).split("?");
      const extension = base.split(".").pop() ?? "";
      const query = splitOnMark.join("?");
      const path = join(dirname(url), base);

      if (url.startsWith("./") || url.startsWith("../")) {
        let content = getRelativePathContent(path);

        const params = new URLSearchParams(query);
        const skip = params.has("skip");
        const tags = params.get("tag")?.split(COMMA_NOT_IN_PARENTHESIS) ?? [];
        const boundary = params.get("boundary")?.split(",");

        if (boundary)
          content = extractContentWithinBoundaries(content, ...boundary);

        const wrapDetails = { extension, inline };
        const wrap = (tag: string, text: string) => wrapInElement(tag, text, wrapDetails);
        const getContent = extendGetRelativePathContent(getRelativePathContent, target);

        if (!skip)
          /** parkdown: Default-Behavior */
          if (extension === "md")
            content = recursivelyPopulateInclusions(content, headingDepth, getContent);
          else if (/^(js|ts)x?|svelte$/i.test(extension))
            content = wrap("code", content);
        /** parkdown: Default-Behavior */

        content = tags.reduce((content, tag) => wrap(tag, content), content);

        return { target, content: getReplacementContent(target, content) };
      }
      else if (url.startsWith("http"))
        throw new Error("External web links are not implemented yet");
      else
        throw new Error(`Unsupported link type: ${url}`);
    })
    .reduce((acc, { target, content }) => replaceWithContent(acc, content, target), markdown);
}