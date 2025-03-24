import { dedent } from "ts-dedent";
import { Intervals, sanitize, start } from "./utils"
import { createParser, numberedParameters, type MethodDefinition } from "./api/";
import { extractComments, type ExtractedComment } from "./extract";
import { getMatchingComments, removeAllParkdownComments, sortComment } from "./comments";

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
  /**
   * Splice the retrieved content at the boundary of a comment region (which must INCLUDE the specified id).
   * 
   * **NOTE:** Unlike `extract`, `remove`, and `replace`, `splice` does remove the comment from the content after processing.
   * @param id The id of the comment regions to act on.
   * @param deleteCount The number of characters to delete at either the beginning or end of the comment region.
   * Specifying a number greater than or equal to 0 indicates the action should be taken at the end of the comment region.
   * Specifying undefined or a number less than 0 indicates the action should be taken at the beginning of the comment region.
   * @param insert The content to insert.
   * @param space The space character to use between words in the content to insert (defaults to `-`).
   * @example [](<url>?region=splice(specifier,-1)) // Delete one character at the beginning of the comment region.
   * @example [](<url>?region=splice(specifier,undefined,new-content)) // Insert at the beginning of the comment region.
   * @example [](<url>?region=splice(specifier,0,new-content)) // Insert at the end of the comment region.
   * @example [](<url>?region=splice(specifier,1,new-content)) // Delete one character at the end of the comment region and insert.
   */
  "splice(id: string, deleteCount?: number, insert?: string, space?: string)",
  /**
   * Remap the content within a comment region (which must INCLUDE the specified id).
   * 
   * **NOTE:** Unlike `extract`, `remove`, and `replace`, `remap` does not remove the comment from the content after processing.
   * @param id The id of the comment regions to act on.
   * @param from The content to replace.
   * @param to The content to replace with.
   * @param space The space character to use between words in the content to replace (defaults to `-`).
   * @example [](<url>?region=remap(specifier,hello-world,hello-universe))
   * @example [](<url>?region=remap(specifier,hello_world,hello_universe,_)
   */
  "remap(id: string, from: string, to: string, space?: string)",
] /** p↓: definition */ satisfies MethodDefinition[];

const parse = createParser(definitions);

const getMatchingCommentPairs = (content: string, specifier: string, comments?: ExtractedComment[]) => {
  const matching = getMatchingComments(content, specifier, comments);
  const pairs: [ExtractedComment, ExtractedComment][] = [];
  for (let i = 0; i < matching.length - 1; i += 2)
    pairs.push([matching[i], matching[i + 1]]);
  return pairs;
}

type Range = ExtractedComment["range"];

export const extractContentWithinRegionSpecifiers = (content: string, ...specifiers: string[]) => {
  if (specifiers.length === 0) return content;

  const comments = extractComments(content);

  const slice = ([start, end]: Range) => content.slice(start, end);

  const extraction = new Intervals();
  const markers = new Intervals();

  for (const specifier of specifiers)
    for (const [open, close] of getMatchingCommentPairs(content, specifier, comments)) {
      extraction.push(open.range[1], close.range[0]);
      const [start, ...rest] = slice([open.range[1], close.range[0]]);
      const last = rest[rest.length - 1];
      markers.push(open.range[0], open.range[1] + (Boolean(start.trim()) ? 0 : 1));
      markers.push(close.range[0], close.range[1] + (Boolean(last.trim()) ? 0 : 1));
    }

  extraction.collapse();
  markers.collapse();

  return dedent(
    extraction.subtract(markers).map(slice).filter(Boolean).join("")
  ).trim();
};

export const removeContentWithinRegionSpecifiers = (content: string, ...specifiers: string[]) => {
  if (specifiers.length === 0) return content;

  const comments = extractComments(content);

  const slice = ([start, end]: ExtractedComment["range"]) => content.slice(start, end);

  const markers = new Intervals();

  for (const specifier of specifiers)
    for (const [open, close] of getMatchingCommentPairs(content, specifier, comments)) {
      const end = slice([close.range[1], close.range[1] + 1]).at(-1);
      markers.push(open.range[0], end === "\n" ? close.range[1] + 1 : close.range[1]);
    }

  markers.collapse();

  const fullContent = new Intervals([0, content.length]);
  fullContent.subtract(markers);

  return dedent(
    fullContent.collapse().map(slice).filter(Boolean).join("")
  ).trim();
};

export const replaceContentWithinRegionSpecifier = (content: string, specifier: string, replacement?: string, space?: string,) => {
  if (!specifier) return content;

  let result = '';
  let lastEnd = 0;

  for (const [open, close] of getMatchingCommentPairs(content, specifier)) {
    result += content.slice(lastEnd, open.range[1]);
    result += sanitize(replacement ?? open.value, space);
    lastEnd = close.range[0];
  }
  result += content.slice(lastEnd);

  const fullContent = new Intervals([0, result.length]);

  fullContent.subtract(new Intervals(
    ...getMatchingCommentPairs(result, specifier).flatMap(([open, close]) => [open.range, close.range])
  ));

  return dedent(
    fullContent.collapse().map(([start, end]) => result.slice(start, end)).filter(Boolean).join("")
  ).trim();
};

export const spliceContentAroundRegionSpecifier = (
  content: string, specifier: string, deleteCount?: number, insert?: string, space?: string
) => {
  if (!specifier) return content;

  const useClose = deleteCount === undefined ? false : deleteCount >= 0;
  const insertion = insert ? sanitize(insert, space) : "";
  const count = deleteCount ?? 0;

  return getMatchingCommentPairs(content, specifier)
    .map(pair => pair[useClose ? 1 : 0])
    .sort(sortComment)
    .reverse()
    .reduce((acc, { range }) => useClose
      ? acc.slice(0, range[1]) + insertion + acc.slice(Math.min(range[1] + count, acc.length))
      : acc.slice(0, Math.max(range[0] + count, 0)) + insertion + acc.slice(range[0])
      , content);
}

export const remapContentWithinRegionSpecifier = (content: string, specifier: string, from: string, to: string, space?: string) => {
  if (!specifier) return content;

  let result = '';
  let lastEnd = 0;

  const sanitized = [from, to].map(value => sanitize(value, space)) as [string, string];

  console.log(sanitized);

  for (const [open, close] of getMatchingCommentPairs(content, specifier)) {
    result += content.slice(lastEnd, open.range[1]);
    result += content.slice(open.range[1], close.range[0]).replaceAll(sanitized[0], sanitized[1]);
    lastEnd = close.range[0];
  }
  result += content.slice(lastEnd);
  return result;
}

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
    case "splice":
      content = spliceContentAroundRegionSpecifier(content, result.id, result.deleteCount, result.insert, result.space);
      break;
  }

  return isLast ? removeAllParkdownComments(content) : content;
}