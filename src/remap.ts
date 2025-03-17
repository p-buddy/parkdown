import { getAllPositionNodes, nodeSort, parse, replaceWithContent } from "./utils";
import * as regexp from '@flex-development/import-regex';

export const paramaterized = {
  local: "$local",
}

type FromTo = {
  raw?: Partial<Record<string, string>>;
  paramaterized?: Partial<Record<"$local", string>>;
}

const localFilePrefixes = ["./", "../", "$" /** for aliases (will this have unintended consequences?) */];
const isLocalSpecifier = (specifier: string) => localFilePrefixes.some(prefix => specifier.startsWith(prefix));

export const remapImports = (markdown: string, { raw, paramaterized }: FromTo) => {
  const ast = parse.md(markdown);
  const code = getAllPositionNodes(ast, "code").sort(nodeSort);

  const tryRemapSpecifier = (specifier: string) => {
    if (paramaterized?.$local && isLocalSpecifier(specifier)) return paramaterized.$local;
    if (raw?.[specifier]) return raw[specifier];
    return null;
  }

  for (const node of code.reverse()) {
    let { value, lang } = node;
    switch (lang) {
      case "ts":
      case "js":
      case "tsx":
      case "jsx":
        value = remapJsTsImports(value, tryRemapSpecifier);
        break;
      case "svelte":
        value = remapSvelteImports(value, tryRemapSpecifier);
        break;
    }

    markdown = replaceWithContent(markdown, value, node);
  }

  return markdown;
}

type TryRemapSpecifier = (specifier: string) => string | null;

export const remapJsTsImports = (code: string, remapSpecifier: TryRemapSpecifier) =>
  [...code.matchAll(regexp.STATIC_IMPORT_REGEX)]
    .sort((a, b) => a.index - b.index)
    .reverse()
    .reduce((acc, match) => {
      const { index, groups } = match;
      if (!groups) return acc;
      const specifier = remapSpecifier(groups.specifier);
      if (!specifier) return acc;
      const { type, imports } = groups;
      const remapped = ["import", type, imports, "from", `"${specifier}"`].filter(Boolean).join(" ");
      return acc.slice(0, index) + remapped + acc.slice(index + match[0].length);
    }, code);

const scripTagRegex = () =>
  // Match a script tag with any attributes, capturing the content between opening and closing tags
  // <script[^>]*>  - Matches opening script tag with any attributes
  // ([\s\S]*?)     - Captures all content (including newlines) between tags (non-greedy)
  // <\/script>     - Matches closing script tag
  // g              - Global flag to match all occurrences
  /<script[^>]*>([\s\S]*?)<\/script>/g;

export const remapSvelteImports = (code: string, remapSpecifier: TryRemapSpecifier) =>
  code.replace(scripTagRegex(), (scriptTag, scriptContent) =>
    scriptTag.replace(scriptContent, remapJsTsImports(scriptContent, remapSpecifier)));