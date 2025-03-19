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
} as const;

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


export class Intervals {
  private intervals: Array<[number, number]> = [];

  push(start: number, end: number) {
    this.intervals.push([Math.min(start, end), Math.max(start, end)]);
  }

  combine(rhs: Intervals) {
    this.intervals.push(...rhs.intervals);
  }

  collapse() {
    const { intervals } = this;
    if (!intervals.length) return (this.intervals = []);

    intervals.sort((a, b) => a[0] - b[0]);

    const result: typeof this.intervals = [];
    let [currStart, currEnd] = intervals[0];

    for (let i = 1; i < intervals.length; i++) {
      const [start, end] = intervals[i];
      if (start <= currEnd) currEnd = Math.max(currEnd, end);
      else {
        result.push([currStart, currEnd]);
        currStart = start;
        currEnd = end;
      }
    }
    result.push([currStart, currEnd]);

    return (this.intervals = result);
  }

  subtract(rhs: Intervals) {
    const { intervals } = this;
    const { intervals: remove } = rhs;

    if (!intervals.length || !remove.length) return intervals;

    let result = [...intervals];
    for (const [removeStart, removeEnd] of remove) {
      const updated: typeof this.intervals = [];

      for (const [start, end] of result) {
        if (removeEnd <= start || removeStart >= end) {
          updated.push([start, end]);
          continue;
        }

        if (removeStart > start) updated.push([start, removeStart]);
        if (removeEnd < end) updated.push([removeEnd, end]);
      }

      result = updated;
    }

    return (this.intervals = result);
  }
}

export const COMMA_NOT_IN_PARENTHESIS = /,\s*(?![^()]*\))/;

/** p↓: sanitize */
const sanitizations: [from: RegExp | string, to: string][] = [
  [/'''/g, `"`],
  [/''/g, `'`],
  [/parkdown:\s+/g, ``],
  [/p↓:\s+/g, ``],
]

export const sanitize = (replacement: string, space: string = "-") => {
  const sanitized = sanitizations.reduce((acc, [from, to]) => acc.replaceAll(from, to), replacement)
  return space ? sanitized.replaceAll(space, " ") : sanitized;
}
/** p↓: sanitize */