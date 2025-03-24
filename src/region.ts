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
   * @param expandLeft ADVANCED: The number of characters to expand the left side of the comment.
   * @param expandRight ADVANCED: The number of characters to expand the right side of the comment.
   * @example [](<url>?region=replace(specifier))
   * @example [](<url>?region=replace(specifier,new-content))
   * @example [](<url>?region=replace(specifier,new_content,_)
   */
  "replace(id: string, with?: string, space?: string, expandLeft?: number, expandRight?: number)",
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

const getMatchingCommentPairs = (content: string, specifier: string) => {
  const matching = getMatchingComments(content, specifier);
  const pairs: [ExtractedComment, ExtractedComment][] = [];
  for (let i = 0; i < matching.length - 1; i += 2)
    pairs.push([matching[i], matching[i + 1]]);
  return pairs;
}

type CommentPair = ReturnType<typeof getMatchingCommentPairs>[number];

const applyExpansion = (expandLeft: number, expandRight: number, pair: CommentPair) => {
  const [open, close] = pair;
  if (expandLeft) open.range[0] -= expandLeft;
  if (expandRight) close.range[1] += expandRight;
  return pair;
}

export const replaceContentWithinRegionSpecifier = (
  content: string,
  specifier: string,
  replacement?: string,
  space?: string,
  expandLeft?: number,
  expandRight?: number
) => {
  if (!specifier) return content;

  content = applyCommentQueriesFirstPass(content, specifier);

  const matching = getMatchingComments(content, specifier);

  if (matching.length < 2) return content;

  let result = '';
  let lastEnd = 0;

  const expand = applyExpansion.bind(null, expandLeft, expandRight);

  for (const [open, close] of getMatchingCommentPairs(content, specifier).map(expand)) {
    result += content.slice(lastEnd, open.range[1]);
    result += sanitize(replacement ?? open.value, space);
    lastEnd = close.range[0];
  }
  result += content.slice(lastEnd);

  const fullContent = new Intervals();
  fullContent.push(0, result.length);

  fullContent.subtract(new Intervals(
    ...getMatchingCommentPairs(result, specifier)
      .map(expand)
      .flatMap(([open, close]) => [open.range, close.range])
  ));

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
      const { with: _with, id, space, expandLeft, expandRight } = result;
      content = replaceContentWithinRegionSpecifier(content, id, _with, space, expandLeft, expandRight);
      break;
  }

  return isLast ? removeAllParkdownComments(content) : content;
}