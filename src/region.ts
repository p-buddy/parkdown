import { dedent } from "ts-dedent";
import _extractComments from "extract-comments";
import { Intervals } from "./utils"
import { createParser, numberedParameters, type MethodDefinition } from "./api/";

const definitions = [
  "extract(id: string, 0?: string, 1?: string, 2?: string)",
  "remove(id: string, 0?: string, 1?: string, 2?: string)",
  "replace(id: string, with?: string, space?: string)",
] satisfies MethodDefinition[];

const parse = createParser(definitions);

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

const extractComments = (content: string) => _extractComments(content) as ExtractedComment[];

const getMatchingComments = (content: string, specifier: string) => extractComments(content)
  .filter(({ value }) => value.includes(specifier))
  .sort((a, b) => a.range[0] - b.range[0]);

export const extractContentWithinRegionSpecifiers = (content: string, ...specifiers: string[]) => {
  if (specifiers.length === 0) return content;

  const slice = ([start, end]: ExtractedComment["range"]) => content.slice(start, end);

  const comments = extractComments(content);

  const extraction = new Intervals();
  const markers = new Intervals();

  for (const specifier of specifiers) {
    const matching = comments
      .filter(({ value }) => value.includes(specifier))
      .sort((a, b) => a.range[0] - b.range[0]);

    for (let i = 0; i < matching.length - 1; i += 2) {
      const open = matching[i];
      const close = matching[i + 1];
      extraction.push(open.range[1], close.range[0]);
      const [start, ...rest] = slice([open.range[1], close.range[0]]);
      const last = rest[rest.length - 1];
      markers.push(open.range[0], open.range[1] + (Boolean(start.trim()) ? 0 : 1));
      markers.push(close.range[0], close.range[1] + (Boolean(last.trim()) ? 0 : 1));
    }
  }

  extraction.collapse();
  markers.collapse();

  return dedent(
    extraction.subtract(markers).map(slice).filter(Boolean).join("")
  ).trim();
};

export const removeContentWithinRegionSpecifiers = (content: string, ...specifiers: string[]) => {
  if (specifiers.length === 0) return content;

  const slice = ([start, end]: ExtractedComment["range"]) => content.slice(start, end);
  const comments = extractComments(content);

  const markers = new Intervals();

  for (const specifier of specifiers) {
    const matching = comments
      .filter(({ value }) => value.includes(specifier))
      .sort((a, b) => a.range[0] - b.range[0]);

    for (let i = 0; i < matching.length - 1; i += 2) {
      const open = matching[i];
      const close = matching[i + 1];
      const end = slice([close.range[1], close.range[1] + 1]).at(-1);
      markers.push(open.range[0], end === "\n" ? close.range[1] + 1 : close.range[1]);
    }
  }

  markers.collapse();

  const fullContent = new Intervals();
  fullContent.push(0, content.length);
  fullContent.subtract(markers);

  return dedent(
    fullContent.collapse().map(slice).filter(Boolean).join("")
  ).trim();
};

/** p▼: sanitize */
const sanitizations: [from: RegExp | string, to: string][] = [
  [/'''/g, `"`],
  [/''/g, `'`],
  [/parkdown:\s+/g, ``],
  [/p▼:\s+/g, ``],
]

const sanitize = (replacement: string, space?: string) => {
  const sanitized = sanitizations.reduce((acc, [from, to]) => acc.replaceAll(from, to), replacement)
  return space ? sanitized.replaceAll(space, " ") : sanitized;
}
/** p▼: sanitize */

export const replaceContentWithinRegionSpecifier = (content: string, specifier: string, replacement?: string, space?: string) => {
  if (!specifier) return content;

  const matching = getMatchingComments(content, specifier);

  if (matching.length < 2) return content;

  let result = '';
  let lastEnd = 0;
  for (let i = 0; i < matching.length - 1; i += 2) {
    const open = matching[i];
    const close = matching[i + 1];
    result += content.slice(lastEnd, open.range[1]);
    result += sanitize(replacement ?? open.value, space);
    lastEnd = close.range[0];
  }
  result += content.slice(lastEnd);

  const fullContent = new Intervals();
  fullContent.push(0, result.length);
  fullContent.subtract(
    getMatchingComments(result, specifier)
      .reduce((acc, { range }) => (acc.push(...range), acc), new Intervals())
  );

  return dedent(
    fullContent.collapse().map(([start, end]) => result.slice(start, end)).filter(Boolean).join("")
  ).trim();;
};

export const applyRegion = (content: string, query: string) => {
  const result = parse(query);
  switch (result.name) {
    case "extract":
      return extractContentWithinRegionSpecifiers(content, result.id, ...numberedParameters(result));
    case "remove":
      return removeContentWithinRegionSpecifiers(content, result.id, ...numberedParameters(result));
    case "replace":
      return replaceContentWithinRegionSpecifier(content, result.id, result.with, result.space);
  }
}