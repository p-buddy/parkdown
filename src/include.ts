import { URLSearchParams } from "node:url";
import {
  getAllPositionNodes,
  parse,
  hasPosition,
  linkHasNoText,
  lined,
  spaced,
  Html,
  nodeSort,
  replaceWithContent,
  getContentInBetween,
} from "./utils";
import {
  type AstRoot,
  type Link,
  type PositionNode,
  type HasPosition,
  COMMA_NOT_IN_PARENTHESIS,
} from "./utils";
import { dirname, join, basename } from "node:path";
import { wrap } from "./wrap";
import { applyRegion } from "./region";
import { Register } from "./parameterized";

const specialLinkTargets = ["http", "./", "../", "?"] as const;
const isSpecialLinkTarget = ({ url }: Link) =>
  specialLinkTargets.some((target) => url.startsWith(target));

export type SpecialLink = PositionNode<"link">;
export const isSpecialLink = (node: Link): node is SpecialLink =>
  hasPosition(node) && linkHasNoText(node) && isSpecialLinkTarget(node);
export const specialLinkText = (
  { url }: Pick<SpecialLink, "url">,
  relative?: string
) => `[](${relative ? join(relative, url) : url})` as const;

type CommentType = "begin" | "end";

export const specialComment = {
  _open: "<!--" as const,
  _close: "-->" as const,
  _flag: "p↓" as const,
  get begin() {
    return spaced(
      specialComment._open,
      specialComment._flag,
      "BEGIN",
      specialComment._close
    );
  },
  get end() {
    return spaced(
      specialComment._open,
      specialComment._flag,
      "END",
      specialComment._close
    );
  },
  lengthOf(content: string) {
    const lines = `lines: ${content.split("\n").length}`;
    const chars = `chars: ${content.length}`;
    return spaced(
      specialComment._open,
      specialComment._flag,
      "length",
      lines,
      chars,
      specialComment._close
    );
  },
};

export type SpecialComment<T extends CommentType = CommentType> =
  PositionNode<"html"> & { value: (typeof specialComment)[T] };

export const isSpecialComment =
  <T extends CommentType>(type: T) =>
  (node: Html): node is SpecialComment<T> =>
    hasPosition(node) && node.value === specialComment[type];

export type ReplacementTarget = {
  url: string;
  headingDepth: number;
  inline: boolean;
} & HasPosition;

const replaceUnpopulated = (
  { position, url, siblingCount }: SpecialLink,
  headingDepth: number
): ReplacementTarget => ({
  position,
  url,
  headingDepth,
  inline: siblingCount >= 1,
});

const replacePopulated = (
  { position: { start }, url, siblingCount }: SpecialLink,
  { position: { end } }: SpecialComment<"end">,
  headingDepth: number
): ReplacementTarget => ({
  position: { start, end },
  url,
  headingDepth,
  inline: siblingCount >= 1,
});

export const getReplacementContent = (
  target: Pick<ReplacementTarget, "url" | "inline">,
  content: string,
  relative?: string
) =>
  (target.inline ? spaced : lined)(
    specialLinkText(target, relative),
    specialComment.begin,
    specialComment.lengthOf(content),
    content,
    specialComment.end
  );

export const nodeDepthFinder = (ast: AstRoot) => {
  const headingDepth = getAllPositionNodes(ast, "heading").reduce(
    (acc, { position, depth }) => acc.set(position.start.line, depth),
    new Map<number, number>()
  );
  return (node: HasPosition) => {
    for (let i = node.position.start.line; i >= 1; i--) {
      const depth = headingDepth.get(i);
      if (depth) return depth;
    }
    return 0;
  };
};

const error = {
  openingCommentDoesNotFollowLink: ({
    position: { start },
  }: SpecialComment<"begin">) =>
    new Error(
      `Opening comment (@${start.line}:${start.column}) does not follow link`
    ),
  closingCommentNotMatchedToOpening: ({
    position: { start },
  }: SpecialComment<"end">) =>
    new Error(
      `Closing comment (@${start.line}:${start.column}) does not match to opening comment`
    ),
  openingCommentNotClosed: ({ position: { start } }: SpecialComment<"begin">) =>
    new Error(
      `Opening comment (@${start.line}:${start.column}) is not followed by a closing comment`
    ),
};

export const getTopLevelCommentBlocks = (
  openingComments: SpecialComment<"begin">[],
  closingComments: SpecialComment<"end">[]
) => {
  const blocks: {
    open: SpecialComment<"begin">;
    close: SpecialComment<"end">;
  }[] = [];

  const combined = [
    ...openingComments.map((node) => ({ node, type: "open" as const })),
    ...closingComments.map((node) => ({ node, type: "close" as const })),
  ].sort((a, b) => nodeSort(a.node, b.node));

  const stack: ((typeof combined)[number] & { type: "open" })[] = [];

  for (const item of combined)
    if (item.type === "open") stack.push(item);
    else {
      const close = item.node as SpecialComment<"end">;
      if (stack.length === 0)
        throw error.closingCommentNotMatchedToOpening(close);
      const open = stack.pop()!.node;
      if (stack.length > 0) continue;
      blocks.push({ open, close });
    }

  if (stack.length > 0) throw error.openingCommentNotClosed(stack[0].node);

  return blocks;
};

type CommentBlocks = ReturnType<typeof getTopLevelCommentBlocks>;

export const matchCommentBlocksToLinks = (
  markdown: string,
  links: SpecialLink[],
  blocks: CommentBlocks
) => {
  const linkCandidates = [...links].sort(nodeSort);
  const results: (SpecialLink | [SpecialLink, CommentBlocks[number]])[] = [];

  [...blocks]
    .sort((a, b) => nodeSort.reverse(a.open, b.open))
    .forEach((block) => {
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
};

export const getReplacementTargets = (
  markdwn: string,
  ast?: AstRoot
): ReplacementTarget[] => {
  ast ??= parse.md(markdwn);
  const findDepth = nodeDepthFinder(ast);
  const specialLinks = getAllPositionNodes(ast, "link").filter(isSpecialLink);
  const htmlNodes = getAllPositionNodes(ast, "html").sort(nodeSort);
  const openingComments = htmlNodes.filter(isSpecialComment("begin"));
  const closingComments = htmlNodes.filter(isSpecialComment("end"));
  const blocks = getTopLevelCommentBlocks(openingComments, closingComments);
  const resolved = matchCommentBlocksToLinks(markdwn, specialLinks, blocks);
  return resolved.map((block) =>
    Array.isArray(block)
      ? replacePopulated(block[0], block[1].close, findDepth(block[0]))
      : replaceUnpopulated(block, findDepth(block))
  );
};

export type GetRelativePathContent = (path: string) => string;

export const extendGetRelativePathContent = (
  getRelativePathContent: GetRelativePathContent,
  { url }: Pick<ReplacementTarget, "url">
) =>
  ((path) =>
    getRelativePathContent(
      join(dirname(url), path)
    )) satisfies GetRelativePathContent;

const clampHeadingSum = (...toSum: number[]) => {
  const sum = toSum.reduce((a, b) => a + b, 0);
  return Math.min(Math.max(sum, 1), 6) as 1 | 2 | 3 | 4 | 5 | 6;
};

export const applyHeadingDepth = (
  markdown: string,
  headingDepth: number,
  ast?: AstRoot
) => {
  if (headingDepth === 0) return markdown;
  ast ??= parse.md(markdown);
  const nodes = getAllPositionNodes(ast, "heading");
  const lines = markdown.split("\n");
  for (const node of nodes) {
    const {
      depth,
      position: { start, end },
    } = node;
    const adjusted = clampHeadingSum(depth, headingDepth);
    const text = lines[start.line - 1].slice(depth, end.column);
    const replacement = `#`.repeat(adjusted) + text;
    lines[start.line - 1] = replacement;
    node.depth = adjusted;
  }
  return lines.join("\n");
};

export const removePopulatedInclusions = (markdown: string) =>
  getReplacementTargets(markdown)
    .reverse()
    .sort(nodeSort.reverse)
    .reduce(
      (md, target) => replaceWithContent(md, specialLinkText(target), target),
      markdown
    );

export const recursivelyPopulateInclusions = (
  markdown: string,
  headingDepth: number,
  getRelativePathContent: GetRelativePathContent,
  url?: string,
  basePath?: string
) => {
  try {
    markdown = removePopulatedInclusions(markdown);
    markdown = applyHeadingDepth(markdown, headingDepth);
    const ast = parse.md(markdown);

    const register = new Register();
    const targets = getReplacementTargets(markdown, ast).sort(nodeSort);

    targets
      .filter(({ url }) => url.startsWith("?"))
      .forEach(({ url }) => register.tryStore(url));

    return targets
      .reverse()
      .map((target) => {
        const { url, headingDepth } = target;
        const [base, ...splitOnQuery] = basename(url).split("?");
        const query = register.apply(splitOnQuery.join("?"));

        if (url.startsWith("?")) return;
        if (url.startsWith("./") || url.startsWith("../")) {
          const extension = base.split(".").pop() ?? "";
          const dir = dirname(url);
          const path = join(dir, base);

          const original = getRelativePathContent(path);

          /** p↓: query */
          const params = new URLSearchParams(query);
          const entries = (key: string) => {
            const values = Array.from(params.entries())
              .filter(([k]) => k === key)
              .map(([_, v]) => v);
            return values.length >= 1 ? values.join(",") : undefined;
          };
          /** p↓: query */

          /** p↓: query */
          const regions = entries("region")?.split(COMMA_NOT_IN_PARENTHESIS);
          /** p↓: query */

          //let content = "";
          let content =
            regions?.reduce(
              (content, region, index, { length }) =>
                applyRegion(content, original, region, index === length - 1),
              ""
            ) ?? original;

          /** p↓: query */
          const skip = params.has("skip");
          /** p↓: query */

          /** p↓: query */
          const headingModfiier = params.get("heading") ?? 0;
          /** p↓: query */

          /** p↓: query */
          const inlineOverride = params.has("inline");
          /** p↓: query */

          let { inline } = target;
          if (inlineOverride) inline = true;

          if (!skip)
            if (extension === "md") {
              /** p↓: Default-Behavior */
              /** p↓: ... */
              const getContent = extendGetRelativePathContent(
                getRelativePathContent,
                target
              );
              const relative = basePath ? join(basePath, dir) : dir;
              const depth = clampHeadingSum(
                headingDepth,
                Number(headingModfiier)
              );
              /** p↓: ... */
              content = recursivelyPopulateInclusions(
                content,
                /** p↓: ... */ depth,
                getContent,
                path,
                relative /** p↓: ... */
              );
            } else if (/^(js|ts)x?|svelte$/i.test(extension))
              content = wrap(
                content,
                "code",
                /** p↓: ... */ { extension, inline } /** p↓: ... */
              );
          /** p↓: Default-Behavior */

          /** p↓: query */
          const wraps = params.get("wrap")?.split(COMMA_NOT_IN_PARENTHESIS);
          /** p↓: query */
          content =
            wraps?.reduce(
              (content, query) => wrap(content, query, { extension, inline }),
              content
            ) ?? content;

          return {
            target,
            content: getReplacementContent(target, content, basePath),
          };
        } else if (url.startsWith("http"))
          throw new Error("External web links are not implemented yet");
        else throw new Error(`Unsupported link type: ${url}`);
      })
      .filter(Boolean)
      .reduce(
        (acc, { target, content }) => replaceWithContent(acc, content, target),
        markdown
      );
  } catch (e) {
    throw new Error(
      `Error populating inclusions in file ${url ?? "(unknown)"}: ${e}`
    );
  }
};
