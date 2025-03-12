import { unified, type Plugin } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';

export type AstRoot = typeof remarkParse extends Plugin<any, any, infer Root>
/**/ ? Root
/**/ : never;

export type MarkdownNode = AstRoot["children"][number];

export type WithPosition<T extends MarkdownNode = MarkdownNode> = T & Pick<Required<T>, "position">;

export type Position = WithPosition['position'];
type WithOnlyPosition = Pick<WithPosition, "position">;

export const nodeSort = (a: WithPosition, b: WithPosition) => a.position.start.line - b.position.start.line || a.position.start.column - b.position.start.column;

nodeSort.reverse = (a: WithPosition, b: WithPosition) => nodeSort(b, a);

export const hasPosition = (node: MarkdownNode): node is WithPosition => node.position !== undefined;

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

export type SpecificNode<T extends MarkdownNode["type"]> = MarkdownNode & { type: T };

export type Link = SpecificNode<"link">;
export type Html = SpecificNode<"html">;

export const linkHasNoText = (node: Link) => node.children.length === 0;

export const spaced = (...args: string[]) => args.join(" ");
export const lined = (...args: string[]) => args.join("\n");

export const start = ({ position: { start } }: WithOnlyPosition) => start;

const offsetIndex = ({ start, end }: Position, offset: number) =>
  ({ start: { line: start.line + offset, column: start.column + offset }, end: { line: end.line + offset, column: end.column + offset } });

export const zeroIndexed = (position: Position) => offsetIndex(position, -1);
export const oneIndexed = (position: Position) => offsetIndex(position, 1);