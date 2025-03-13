import { unified, type Plugin } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';
import hash from 'stable-hash';

export type AstRoot = typeof remarkParse extends Plugin<any, any, infer Root>
/**/ ? Root
/**/ : never;

export type MarkdownNode = AstRoot["children"][number];
export type NodeType = MarkdownNode["type"];
export type SpecificNode<T extends NodeType> = MarkdownNode & { type: T };

type RequiredDeep<T> = {
  [P in keyof T]-?: T[P] extends object | undefined ? RequiredDeep<T[P]> : T[P];
};

export type HasPosition = RequiredDeep<Pick<MarkdownNode, "position">>;
export type Position = HasPosition['position'];
export type Point = Position['start' | 'end'];

export const nodeSort = (a: HasPosition, b: HasPosition) => a.position.start.offset - b.position.start.offset;

nodeSort.reverse = (a: HasPosition, b: HasPosition) => nodeSort(b, a);

export const hasPosition = <T extends MarkdownNode>(node: T): node is T & HasPosition =>
  node.position !== undefined && node.position.start.offset !== undefined && node.position.end.offset !== undefined;

const processor = unified().use(remarkParse);

export const parse = {
  md: (markdown: string) => processor.parse(markdown) satisfies AstRoot
};

export const getAllPositionNodes = <T extends NodeType>(ast: AstRoot, type?: T) => {
  type Node = SpecificNode<T> & HasPosition & { parentID: string; siblingIndex: number; siblingCount: number };
  const nodes: Node[] = [];
  visit(ast, (node, siblingIndex, parent) => {
    if (node.type === "root") return;
    else if (type && node.type !== type) return;
    else if (hasPosition(node)) {
      const parentID = hash(parent);
      const siblingCount = (parent?.children.length ?? 0) - 1;
      nodes.push({ ...node, parentID, siblingIndex, siblingCount } as Node);
    }
  });
  return nodes;
}

export type PositionNode<T extends NodeType> = ReturnType<typeof getAllPositionNodes<T>>[number];

export type Link = PositionNode<"link">;
export type Html = PositionNode<"html">;

export const linkHasNoText = (node: Link) => node.children.length === 0;

export const extractContent = (markdown: string, ...nodes: HasPosition[]) => {
  if (nodes.length === 0) throw new Error("No nodes to extract content from");
  nodes.sort(nodeSort);
  const head = nodes.at(0)!;
  const tail = nodes.at(-1)!;
  return markdown.slice(head.position.start.offset, tail.position.end.offset);
}

export const replaceWithContent = (markdown: string, content: string, ...nodes: HasPosition[]) => {
  if (nodes.length === 0) throw new Error("No nodes to replace content from");
  nodes.sort(nodeSort);
  const head = nodes.at(0)!;
  const tail = nodes.at(-1)!;
  return markdown.slice(0, head.position.start.offset) + content + markdown.slice(tail.position.end.offset);
}

export const getContentInBetween = (markdown: string, a: HasPosition, b: HasPosition) => {
  const head = Math.min(a.position.end.offset, b.position.end.offset);
  const tail = Math.max(a.position.start.offset, b.position.start.offset);
  return markdown.slice(head, tail);
}

type Join<T extends string[], D extends string> =
  T extends []
    /**/ ? ''
    /**/ : T extends [infer F extends string]
      /**/ ? F
      /**/ : T extends [infer F extends string, ...infer R extends string[]]
        /**/ ? `${F}${D}${Join<R, D>}`
        /**/ : string;

export const spaced = <T extends string[]>(...args: T) => args.join(" ") as Join<T, " ">;
export const lined = <T extends string[]>(...args: T) => args.join("\n") as Join<T, "\n">;

export const start = ({ position: { start } }: HasPosition) => start;

const offsetIndex = ({ start, end }: Position, offset: number) =>
  ({ start: { line: start.line + offset, column: start.column + offset }, end: { line: end.line + offset, column: end.column + offset } });

export const zeroIndexed = (position: Position) => offsetIndex(position, -1);
export const oneIndexed = (position: Position) => offsetIndex(position, 1);

export const seperateQueryParams = (path: string): [lhs: string, query: string] => {
  const parts = path.split("?");
  return parts.length > 1 ? [parts.slice(0, -1).join("?"), parts.at(-1)!] : [path, ""];
}

export const getQueryParams = (path: string) => seperateQueryParams(path)[1];

export const removeQueryParams = (path: string) => seperateQueryParams(path)[0];