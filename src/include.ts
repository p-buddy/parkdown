import { getAllPositionNodes, start, parse, hasPosition, linkHasNoText, zeroIndexed, lined, spaced, Html } from "./utils";
import type { AstRoot, MarkdownNode, WithPosition, Link, Position } from "./utils"
import { dirname, join } from "node:path";

const specialLinkTargets = ["http", "./", "../"] as const;
const isSpecialLinkTarget = ({ url }: Link) => specialLinkTargets.some(target => url.startsWith(target));

export type SpecialLink = WithPosition<Link>;
export const isSpecialLink = (node: Link): node is SpecialLink =>
  hasPosition(node) && linkHasNoText(node) && isSpecialLinkTarget(node);
export const specialLinkText = ({ url }: Pick<SpecialLink, "url">) => `[](${url})`;

const closingCommentIdentifier = "parkdown END";
const htmlComment = { open: "<!--", close: "-->" };
export const formClosingComment = (msg: string) =>
  spaced(htmlComment.open, closingCommentIdentifier, msg, htmlComment.close);

export type ClosingComment = WithPosition<Html>;
export const isClosingComment = (node: Html): node is ClosingComment =>
  hasPosition(node) && node.value.startsWith(spaced(htmlComment.open, closingCommentIdentifier)) && node.value.endsWith(htmlComment.close);

export type ReplacementTarget = {
  region: Position;
  url: string;
  headingDepth: number;
}

const replaceUnpopulatedLink = (
  { position, url }: SpecialLink, headingDepth: number
): ReplacementTarget => ({ region: position, url, headingDepth })

const replacePopulatedLink = (
  { position: { start }, url }: SpecialLink, { position: { end } }: ClosingComment, headingDepth: number
): ReplacementTarget => ({ region: { start, end }, url, headingDepth });

export const extractRegion = (md: string, { region }: ReplacementTarget) => {
  const lines = md.split("\n");
  const { start, end } = zeroIndexed(region);
  const extracted = lines.slice(start.line, end.line + 1);
  extracted[0] = extracted[0].slice(start.column);
  extracted[extracted.length - 1] = extracted[extracted.length - 1].slice(0, end.column);
  return lined(...extracted);
};

export const replaceRegion = (md: string, target: Pick<ReplacementTarget, "region">, content: string) => {
  const lines = md.split("\n");
  const { start, end } = zeroIndexed(target.region);
  const untouched = { pre: lines.slice(0, start.line), post: lines.slice(end.line + 1) };
  const pre = lined(...untouched.pre, lines[start.line].slice(0, start.column))
  const post = lined(lines[end.line].slice(end.column + 1), ...untouched.post);
  return pre + content + post;
}

export const getReplacementContent = (target: Pick<ReplacementTarget, "url">, content: string, commentMsg = "replaced") =>
  lined(specialLinkText(target), content, formClosingComment(commentMsg));

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

export const getReplacementTargets = (ast: AstRoot): ReplacementTarget[] => {
  const findDepth = nodeDepthFinder(ast);
  const specialLinks = getAllPositionNodes(ast, "link").filter(isSpecialLink);
  const closingComments = getAllPositionNodes(ast, "html").filter(isClosingComment);
  const replacements: ReplacementTarget[] = [];

  let commentPointer = 0;

  let comment = closingComments[commentPointer];
  const nextComment = () => comment = closingComments[++commentPointer];

  let link: SpecialLink;

  const detectDanglingComments = () => {
    while (comment && start(comment).line < start(link).line) {
      console.error(`Dangling closing comment at ${start(comment).line}:${start(comment).column}`);
      nextComment();
    }
  }

  for (let linkPointer = 0; linkPointer < specialLinks.length; linkPointer++) {
    link = specialLinks[linkPointer];
    detectDanglingComments();
    const depth = findDepth(link) ?? 0;
    const nextLink = specialLinks[linkPointer + 1];
    if (nextLink && comment)
      replacements.push(
        start(nextLink).line <= start(comment).line
          ? replaceUnpopulatedLink(link, depth)
          : replacePopulatedLink(link, comment, depth)
      )
    else if (comment) replacements.push(replacePopulatedLink(link, comment, depth))
    else replacements.push(replaceUnpopulatedLink(link, depth))
    nextComment();
  }

  detectDanglingComments();

  return replacements;
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
  replacementComment = ""
) => {
  const ast = parse.md(markdown);
  let withAdjustments = applyHeadingDepth(markdown, headingDepth, ast);
  const targets = getReplacementTargets(ast);

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
          const wrapped = getReplacementContent(current, adjusted, replacementComment);
          withAdjustments = replaceRegion(withAdjustments, current, wrapped);
          break;
        default:
          withAdjustments = replaceRegion(withAdjustments, current, content);
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