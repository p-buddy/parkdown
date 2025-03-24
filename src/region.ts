import { dedent } from "ts-dedent";
import { Intervals, sanitize } from "./utils"
import { createParser, numberedParameters, type MethodDefinition } from "./api/";
import { extractComments, type ExtractedComment } from "./extract";
import { applyCommentQueriesFirstPass, getMatchingComments, removeAllParkdownComments } from "./comments";

/** p↓: definition */
const definitions = [
  /**
   * Extract regions from the retrieved content between comments that INCLUDE the specified ids.
   * @param id The id of the comment to extract.
   * @param 0 An optional additional id to extract.
   * @param 1 An optional additional id to extract.
   * @param 2 An optional additional id to extract.
   * @example [](<url>?region=extract(specifier))
   * @example [](<url>?region=extract(specifier,other-specifier,some-other-specifier))
   */
  "extract(id: string, 0?: string, 1?: string, 2?: string)",
  /**
   * Remove regions from the retrieved content between comments that INCLUDE the specified ids.
   * @param id The id of the comment to remove.
   * @param 0 An optional additional id to remove.
   * @param 1 An optional additional id to remove.
   * @param 2 An optional additional id to remove.
   * @example [](<url>?region=remove(specifier))
   * @example [](<url>?region=remove(specifier,other-specifier,some-other-specifier))
   */
  "remove(id: string, 0?: string, 1?: string, 2?: string)",
  /**
   * Replace regions from the retrieved content between comments that INCLUDE the specified ids.
   * @param id The id of the comment to replace.
   * @param with The replacement content (if ommitted, the content of the detected comment will be used).
   * @param space The space character to use between words in the replacement content (defaults to `-`).
   * @example [](<url>?region=replace(specifier))
   * @example [](<url>?region=replace(specifier,new-content))
   * @example [](<url>?region=replace(specifier,new_content,_)
   */
  "replace(id: string, with?: string, space?: string)",
] /** p↓: definition */ satisfies MethodDefinition[];

const parse = createParser(definitions);

export const extractContentWithinRegionSpecifiers = (content: string, ...specifiers: string[]) => {
  if (specifiers.length === 0) return content;

  content = applyCommentQueriesFirstPass(content, specifiers);
  const comments = extractComments(content);

  const slice = ([start, end]: ExtractedComment["range"]) => content.slice(start, end);

  const extraction = new Intervals();
  const markers = new Intervals();

  for (const specifier of specifiers) {
    const matching = getMatchingComments(content, specifier, comments);

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

  content = applyCommentQueriesFirstPass(content, specifiers);
  const comments = extractComments(content);

  const slice = ([start, end]: ExtractedComment["range"]) => content.slice(start, end);

  const markers = new Intervals();

  for (const specifier of specifiers) {
    const matching = getMatchingComments(content, specifier, comments);

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

export const replaceContentWithinRegionSpecifier = (content: string, specifier: string, replacement?: string, space?: string) => {
  if (!specifier) return content;

  content = applyCommentQueriesFirstPass(content, specifier);

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

export const applyRegion = (content: string, query?: string, isLast?: boolean) => {
  if (!query) return removeAllParkdownComments(content);

  const result = parse(query);

  switch (result.name) {
    case "extract":
      content = extractContentWithinRegionSpecifiers(content, result.id, ...numberedParameters(result));
      break;
    case "remove":
      content = removeContentWithinRegionSpecifiers(content, result.id, ...numberedParameters(result));
      break;
    case "replace":
      content = replaceContentWithinRegionSpecifier(content, result.id, result.with, result.space);
      break;
  }

  return isLast ? removeAllParkdownComments(content) : content;
}