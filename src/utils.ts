import { unified, type Plugin } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';

export type AstRoot = typeof remarkParse extends Plugin<any, any, infer Root>
/**/ ? Root
/**/ : never;

export type MarkdownNode = AstRoot["children"][number];

export type WithPosition<T extends MarkdownNode = MarkdownNode> = T & Pick<Required<T>, "position">;

export const nodeSort = (a: WithPosition, b: WithPosition) => a.position.start.line - b.position.start.line || a.position.start.column - b.position.start.column;

nodeSort.reverse = (a: WithPosition, b: WithPosition) => nodeSort(b, a);

const hasPosition = (node: MarkdownNode): node is WithPosition => node.position !== undefined;

const processor = unified().use(remarkParse);

export const parse = {
  md: (markdown: string) => processor.parse(markdown) satisfies AstRoot
};

export const getAllPositionNodes = <T extends MarkdownNode["type"]>(ast: AstRoot, type?: T) => {
  const nodes: WithPosition<MarkdownNode & { type: T }>[] = [];
  visit(ast, (node) => {
    if (node.type === "root") return;
    else if (type && node.type !== type) return;
    else if (hasPosition(node)) nodes.push(node as WithPosition<MarkdownNode & { type: T }>);
  });
  return nodes;
}

type SpecificNode<T extends MarkdownNode["type"]> = MarkdownNode & { type: T };

type Link = SpecificNode<"link">;
type Html = SpecificNode<"html">;

const linkHasNoText = (node: Link) => node.children.length === 0;
const specialLinkTargets = ["http", "./", "../"] as const;
const isSpecialLinkTarget = ({ url }: Link) => specialLinkTargets.some(target => url.startsWith(target));

type SpecialLink = WithPosition<Link>;
export const isSpecialLink = (node: Link): node is SpecialLink =>
  hasPosition(node) && linkHasNoText(node) && isSpecialLinkTarget(node);
export const specialLinkText = ({ url }: Pick<SpecialLink, "url">) => `[](${url})`;

const spaced = (...args: string[]) => args.join(" ");
const lined = (...args: string[]) => args.join("\n");

const closingCommentIdentifier = "parkdown END";
const htmlComment = { open: "<!--", close: "-->" };
export const formClosingComment = (msg: string) =>
  spaced(htmlComment.open, closingCommentIdentifier, msg, htmlComment.close);

type ClosingComment = WithPosition<Html>;
export const isClosingComment = (node: Html): node is ClosingComment =>
  hasPosition(node) && node.value.startsWith(spaced(htmlComment.open, closingCommentIdentifier)) && node.value.endsWith(htmlComment.close);

const start = (node: Pick<SpecialLink | ClosingComment, "position">) => node.position.start;

type Position = WithPosition['position'];

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

export const extractRegion = (md: string, { region: { start, end } }: ReplacementTarget) => {
  const lines = md.split("\n");
  const startLine = start.line - 1;
  const endLine = end.line - 1;
  const extracted = lines.slice(startLine, endLine + 1);
  const startColumn = start.column - 1;
  const endColumn = end.column - 1;
  extracted[0] = extracted[0].slice(startColumn);
  extracted[extracted.length - 1] = extracted[extracted.length - 1].slice(0, endColumn);
  return lined(...extracted);
};

export const replaceRegion = (md: string, target: Pick<ReplacementTarget, "region" | "url">, content: string, commentMsg = "replaced") => {
  const { region: { start, end } } = target;
  const lines = md.split("\n");
  const startLine = start.line - 1;
  const endLine = end.line - 1;
  const startColumn = start.column - 1;
  const endColumn = end.column - 1;

  const newContent = lined(specialLinkText(target), content, formClosingComment(commentMsg));

  if (startLine === endLine)
    lines[startLine] = lines[startLine].slice(0, startColumn) + newContent + lines[startLine].slice(endColumn);
  else {
    lines[startLine] = lines[startLine].slice(0, startColumn) + newContent;
    lines.splice(startLine + 1, endLine - startLine);
  }
  return lined(...lines);
}

export class NodeMap {
  private headingDepth = new Map<number, number>();
  private specialLinks: SpecialLink[] = [];
  private closingComments: ClosingComment[] = [];

  constructor(ast: AstRoot) {
    visit(ast, "heading", (node) => {
      if (hasPosition(node))
        this.headingDepth.set(node.position!.start.line, node.depth);
    });

    visit(ast, "link", (node) => {
      if (isSpecialLink(node))
        this.specialLinks.push(node);
    });

    visit(ast, "html", (node) => {
      if (isClosingComment(node))
        this.closingComments.push(node);
    });
  }

  tryGetDepthForNode(node: MarkdownNode) {
    if (!hasPosition(node)) return undefined;
    for (let i = node.position.start.line; i >= 1; i--) {
      const depth = this.headingDepth.get(i);
      if (depth) return depth;
    }
  }

  getReplacementTargets(): ReplacementTarget[] {
    const { specialLinks, closingComments } = this;
    const replacements: ReplacementTarget[] = [];

    let commentPointer = 0;

    let comment = closingComments[commentPointer];
    let link = specialLinks[0];
    const nextComment = () => comment = closingComments[++commentPointer];

    const detectDanglingComments = () => {
      while (comment && start(comment).line < start(link).line) {
        console.error(`Dangling closing comment at ${start(comment).line}:${start(comment).column}`);
        nextComment();
      }
    }

    for (let linkPointer = 0; linkPointer < specialLinks.length; linkPointer++) {
      link = specialLinks[linkPointer];
      const depth = this.tryGetDepthForNode(link) ?? 0;
      const nextLink = specialLinks[linkPointer + 1];
      detectDanglingComments();
      if (nextLink && comment) {
        const commentIsAfterNext = start(nextLink).line <= start(comment).line;
        replacements.push(commentIsAfterNext
          ? replaceUnpopulatedLink(link, depth)
          : replacePopulatedLink(link, comment, depth)
        )
      }
      else if (comment) replacements.push(replacePopulatedLink(link, comment, depth))
      else replacements.push(replaceUnpopulatedLink(link, depth))
      comment = closingComments[++commentPointer];
    }

    detectDanglingComments();

    return replacements;
  }
}

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

export const recursivelyApplyModifications = (markdown: string, headingDepth: number, getRelativePathContent: (path: string) => string) => {
  const ast = parse.md(markdown);
  let withAdjustedHeadings = applyHeadingDepth(markdown, headingDepth, ast);
  const targets = new NodeMap(ast).getReplacementTargets();

  for (let i = targets.length - 1; i >= 0; i--) {
    const { url, region, headingDepth } = targets[i];
    if (url.startsWith("./") || url.startsWith("../")) {
      const content = getRelativePathContent(url);
      const [extension, query] = url.split(".").pop()?.split("?") ?? [];
      switch (extension) {
        case "md":
          const content = getRelativePathContent(url);
          const adjusted = recursivelyApplyModifications(content, headingDepth, getRelativePathContent);
          withAdjustedHeadings = withAdjustedHeadings.slice(0, region.start.line - 1) + adjusted + withAdjustedHeadings.slice(region.end.line - 1);
          break;
      }
    }
    else if (url.startsWith("http")) {
      // TODO: Implement
    }
    else {
      // TODO: Implement
    }
  }
  return withAdjustedHeadings;
}