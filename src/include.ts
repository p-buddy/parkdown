import { getAllPositionNodes, parse, hasPosition, linkHasNoText, lined, spaced, Html, nodeSort, replaceWithContent, getContentInBetween } from "./utils";
import type { AstRoot, MarkdownNode, Link, PositionNode, HasPosition } from "./utils"
import { dirname, join } from "node:path";

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

export const getReplacementContent = (target: Pick<ReplacementTarget, "url">, content: string, inline = true) =>
  inline
    ? `${specialLinkText(target)} ${specialComment.begin} ${content} ${specialComment.end}` as const
    : lined(specialLinkText(target), specialComment.begin, content, specialComment.end);

export const nodeDepthFinder = (ast: AstRoot) => {
  const headingDepth = getAllPositionNodes(ast, "heading")
    .reduce((acc, { position, depth }) => acc.set(position.start.line, depth), new Map<number, number>())
  return (node: MarkdownNode) => {
    if (!hasPosition(node)) return undefined;
    for (let i = node.position.start.line; i >= 1; i--) {
      const depth = headingDepth.get(i);
      if (depth) return depth;
    }
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

export const getReplacementTargets = (markdwn: string, ast: AstRoot): ReplacementTarget[] => {
  const findDepth = nodeDepthFinder(ast);
  const specialLinks = getAllPositionNodes(ast, "link").filter(isSpecialLink);
  const htmlNodes = getAllPositionNodes(ast, "html").sort(nodeSort);
  const openingComments = htmlNodes.filter(isSpecialComment("begin"));
  const closingComments = htmlNodes.filter(isSpecialComment("end"));
  const blocks = getTopLevelCommentBlocks(openingComments, closingComments);
  return matchCommentBlocksToLinks(markdwn, specialLinks, blocks)
    .map(block => Array.isArray(block)
      ? replacePopulated(block[0], block[1].close, findDepth(block[0])!)
      : replaceUnpopulated(block, findDepth(block)!))
}

type GetRelativePathContent = (path: string) => string;

export const extendGetRelativePathContent = (
  getRelativePathContent: GetRelativePathContent, { url }: Pick<ReplacementTarget, "url">
) => ((path) => getRelativePathContent(join(dirname(url), path))) satisfies GetRelativePathContent;

const clampHeadingSum = (...toSum: number[]) => {
  const sum = toSum.reduce((a, b) => a + b, 0);
  return Math.min(Math.max(sum, 1), 6) as 1 | 2 | 3 | 4 | 5 | 6;
}

export const applyHeadingDepth = (markdown: string, headingDepth: number, ast?: AstRoot) => {
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

export const recursivelyApplyInclusions = (
  markdown: string,
  headingDepth: number,
  getRelativePathContent: GetRelativePathContent,
) => {
  const ast = parse.md(markdown);
  let withAdjustments = applyHeadingDepth(markdown, headingDepth, ast);
  const targets = getReplacementTargets(markdown, ast);

  for (let i = targets.length - 1; i >= 0; i--) {
    const current = targets[i]
    const { url, headingDepth } = current;
    if (url.startsWith("./") || url.startsWith("../")) {
      const content = getRelativePathContent(url);
      const [extension, query] = url.split(".").pop()?.split("?") ?? [];
      switch (extension) {
        case "md":
          const extended = extendGetRelativePathContent(getRelativePathContent, current);
          const adjusted = recursivelyApplyInclusions(content, headingDepth, extended);
          const wrapped = getReplacementContent(current, adjusted);
          withAdjustments = replaceWithContent(withAdjustments, wrapped, current);
          break;
        default:
          withAdjustments = replaceWithContent(withAdjustments, content, current);
          break;
      }
    }
    else if (url.startsWith("http"))
      throw new Error("HTTP links are not implemented yet");
    else
      throw new Error(`Unsupported link type: ${url}`);
  }
  return withAdjustments;
}