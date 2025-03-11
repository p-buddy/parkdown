import { unified, type Plugin } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';
import type { Node } from 'unist';
import { NodeMap } from './utils';


type AstRoot = typeof remarkParse extends Plugin<any, any, infer Root> ? Root : never;





export const processMarkdown = async (markdown: string) => {
  const processor = unified().use(remarkParse);
  const ast = processor.parse(markdown);

  const depthMap = new NodeMap(ast);

  visit(ast, "link", (node, index, parent) => {
    const { children, url, position } = node;
    if (children.length > 0) return;
    const file = url.split('/').pop();
    let closingComment = undefined
    if (parent?.children && index)
      for (let i = index; i < parent.children.length; i++) {
        const child = parent.children[i];
        switch (child.type) {
          case 'html':
            console.log(child);
            break;
        }
      }
  });
};
