import { dedent } from "ts-dedent";
import { sanitize } from "./utils"
import { Intervals } from './Intervals';
import { createParser, numberedParameters, type MethodDefinition } from "./api/";
import { extractComments, getMatchingComments, removeAllParkdownComments, sortComment, type ExtractedComment } from "./comments";

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
   * Remap the content (similiar to `string.replaceAll`) within a specified comment region.
   * @param id The id of the comment regions to act on.
   * @param from The content to replace.
   * @param to The content to replace with.
   * @param space The space character to use between words in the content to replace (defaults to `-`).
   * @example [](<url>?region=remap(specifier,hello-world,hello-universe))
   * @example [](<url>?region=remap(specifier,hello_world,hello_universe,_)
   */
  "remap(id: string, from: string, to?: string, space?: string)",

  /**
   * Make the content of the region a single line (where all whitespace characters, including newlines, are converted to a single space).
   * @param id The id of the comment regions to act on.
   * @example [](<url>?region=single-line(specifier))
   */
  "single-line(id: string, includeBoundaries?: boolean)",

  /**
   * Trim the whitespace surrounding the comment boundaries of the region.
   * @param id The id of the comment region to act on.
   * @param inside Whether to trim the whitespace within the comment region. Defaults to `true`.
   * @param outside Whether to trim the whitespace outside the comment region. Defaults to `true`.
   * @example [](<url>?region=trim(specifier))
   * @example [](<url>?region=trim(specifier,false))
   * @example [](<url>?region=trim(specifier,,false))
   * @example [](<url>?region=trim(specifier,false,false))
   */
  "trim(id: string, inside?: boolean, outside?: boolean)",

  /**
   * Trim the whitespace surrounding the starting comment boundary of the specified region.
   * @param id The id of the comment region to act on.
   * @param left Whether to trim the whitespace to the left of the comment region. Defaults to `true`.
   * @param right Whether to trim the whitespace to the right of the comment region. Defaults to `true`.
   * @example [](<url>?region=trim-start(specifier))
   * @example [](<url>?region=trim-start(specifier,false))
   */
  "trim-start(id: string, left?: boolean, right?: boolean)",

  /**
   * Trim the whitespace surrounding the ending comment boundary of the specified region.
   * @param id The id of the comment region to act on.
   * @param left Whether to trim the whitespace to the left of the comment region. Defaults to `true`.
   * @param right Whether to trim the whitespace to the right of the comment region. Defaults to `true`.
   * @example [](<url>?region=trim-end(specifier))
   * @example [](<url>?region=trim-end(specifier,false))
   */
  "trim-end(id: string, left?: boolean, right?: boolean)",

  /**
   * Splice the retrieved content at the starting comment boundary of the specified region.
   * @param id The id of the comment region to act on.
   * @param deleteCount The number of characters to delete at either the beginning or end of the comment boundary.
   * Specifying a number greater than or equal to 0 indicates the action should be taken at the end of the comment boundary (i.e to the right of the comment).
   * Specifying undefined or a number less than 0 indicates the action should be taken at the beginning of the comment boundary (i.e to the left of the comment).
   * @param insert The content to insert.
   * @param space The space character to use between words in the content to insert (defaults to `-`).
   * 
   * **NOTE:** Content within comments will not be acted upon.
   */
  "splice-start(id: string, deleteCount?: number, insert?: string, space?: string)",

  /**
   * Splice the retrieved content at the ending comment boundary of the specified region.
   * @param id The id of the comment region to act on.
   * @param deleteCount The number of characters to delete at either the beginning or end of the comment boundary.
   * Specifying a number greater than or equal to 0 indicates the action should be taken at the end of the comment boundary (i.e to the right of the comment).
   * Specifying undefined or a number less than 0 indicates the action should be taken at the beginning of the comment boundary (i.e to the left of the comment).
   * @param insert The content to insert.
   * @param space The space character to use between words in the content to insert (defaults to `-`).
   * 
   * **NOTE:** Content within comments will not be acted upon.
   */
  "splice-end(id: string, deleteCount?: number, insert?: string, space?: string)",

  /**
   * If included at the end of a query, parkdown comments will not be removed from the content after processing. 
   * Helpful when trying to determine fine-grained edits (e.g. trimming, splicing, etc.).
   */
  "debug()"

] /** p↓: definition */ satisfies MethodDefinition[];

const parse = createParser(definitions);

const getMatchingCommentPairs = (content: string, specifier: string, comments?: ExtractedComment[]) => {
  const matching = getMatchingComments(content, specifier, comments);
  const pairs: [ExtractedComment, ExtractedComment][] = [];
  for (let i = 0; i < matching.length - 1; i += 2)
    pairs.push([matching[i], matching[i + 1]]);
  return pairs;
}

const getMatchingCommentIntervals = (content: string, specifier: string, comments?: ExtractedComment[]) =>
  new Intervals(...getMatchingComments(content, specifier, comments).map(({ range }) => range));

const finalize = (content: string) => dedent(content).trim();

export const extractContentWithinRegionSpecifiers = (content: string, ...specifiers: string[]) => {
  if (specifiers.length === 0) return content;

  const comments = extractComments(content);

  const extraction = new Intervals();
  // Should only non-prefixed comments be removed?
  const markers = new Intervals();

  for (const specifier of specifiers)
    for (const [open, close] of getMatchingCommentPairs(content, specifier, comments)) {
      extraction.push(open.range[1], close.range[0]);
      const [start, ...rest] = content.slice(open.range[1], close.range[0]);
      const last = rest[rest.length - 1];
      markers.push(open.range[0], open.range[1] + (Boolean(start.trim()) ? 0 : 1));
      markers.push(close.range[0], close.range[1] + (Boolean(last.trim()) ? 0 : 1));
    }

  return finalize(extraction.subtract(markers).slice(content));
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

  return finalize(new Intervals([0, content.length]).subtract(markers).slice(content));
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

  return finalize(
    new Intervals([0, result.length]).subtract(getMatchingCommentIntervals(result, specifier)).slice(result)
  );
};

export const spliceContentAtRegionBoundarySpecifier = (
  content: string, specifier: string, boundary: "start" | "end", deleteCount?: number, insert?: string, space?: string
) => {
  if (!specifier) return content;

  const after = deleteCount === undefined || deleteCount < 0 ? false : true;
  const insertion = insert ? sanitize(insert, space) : "";
  const count = deleteCount ?? 0;

  const comments = extractComments(content);
  const commentIntervals = new Intervals(...comments.map(({ range }) => range));

  return getMatchingCommentPairs(content, specifier, comments)
    .map(pair => pair[boundary === "start" ? 0 : 1])
    .sort(sortComment)
    .reverse()
    .reduce((acc, { range }) => {
      const spliced = new Intervals();
      const step = after ? 1 : -1;
      let remaining = Math.abs(count);
      let index = after ? range[1] : range[0];

      while (remaining > 0 && index < acc.length && index >= 0) {
        if (!commentIntervals.test(index)) {
          spliced.push(index);
          remaining--;
        }
        index += step;
      }
      index = Math.min(Math.max(0, index), acc.length);
      acc = acc.slice(0, index) + insertion + acc.slice(index);
      return new Intervals([0, acc.length])
        .subtract(spliced.offset(after ? 0 : insertion.length))
        .slice(acc);
    }, content);
}

export const remapContentWithinRegionSpecifier = (
  content: string, specifier: string, from: string, to?: string, space?: string
) => {
  if (!specifier) return content;

  let result = '';
  let lastEnd = 0;

  [from, to] = [from, to ?? ""].map(value => sanitize(value, space)) as [string, string];

  for (const [open, close] of getMatchingCommentPairs(content, specifier)) {
    result += content.slice(lastEnd, open.range[1]);
    result += content.slice(open.range[1], close.range[0]).replaceAll(from, to);
    lastEnd = close.range[0];
  }
  result += content.slice(lastEnd);
  return result;
}

export const asSingleLine = (content: string, specifier: string) => {
  if (!specifier) return content;

  let result = '';
  let lastEnd = 0;

  for (const [open, close] of getMatchingCommentPairs(content, specifier)) {
    result += content.slice(lastEnd, open.range[1]);
    result += content.slice(open.range[1], close.range[0]).replaceAll(/[\s\n]+/g, " ");
    lastEnd = close.range[0];
  }
  result += content.slice(lastEnd);
  return result;
}

type TrimConfig = { left?: boolean, right?: boolean };
export const trimAroundRegionBoundaries = (content: string, specifier: string, config: Partial<Record<"start" | "end", TrimConfig>>) => {
  if (!specifier) return content;

  const isWhitespace = (index: number) => /\s/.test(content[index]);

  const whitespace = new Intervals();

  for (const [open, close] of getMatchingCommentPairs(content, specifier)) {
    if (config.start?.left) {
      let index = open.range[0] - 1;
      while (isWhitespace(index)) whitespace.push(index--);
    }
    if (config.start?.right) {
      let index = open.range[1];
      while (isWhitespace(index)) whitespace.push(index++);
    }
    if (config.end?.left) {
      let index = close.range[0] - 1;
      while (isWhitespace(index)) whitespace.push(index--);
    }
    if (config.end?.right) {
      let index = close.range[1];
      while (isWhitespace(index)) whitespace.push(index++);
    }
  }

  return new Intervals([0, content.length]).subtract(whitespace).slice(content);
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
    case "splice-start":
    case "splice-end": {
      const { deleteCount, insert, space, id } = result;
      const boundary = result.name === "splice-start" ? "start" : "end";
      content = spliceContentAtRegionBoundarySpecifier(content, id, boundary, deleteCount, insert, space);
      break;
    }
    case "trim-start":
    case "trim-end": {
      const { left, right, id } = result;
      const boundary = result.name === "trim-start" ? "start" : "end";
      content = trimAroundRegionBoundaries(content, id, { [boundary]: { left: left ?? true, right: right ?? true } });
      break;
    }
    case "trim": {
      const { inside, outside, id } = result;
      const start = { left: outside ?? true, right: inside ?? true };
      const end = { left: inside ?? true, right: outside ?? true };
      content = trimAroundRegionBoundaries(content, id, { start: { left: outside ?? true, right: inside ?? true }, end: { left: inside ?? true, right: outside ?? true } });
      break;
    }
    case "single-line":
      content = asSingleLine(content, result.id);
      break;
    case "remap":
      content = remapContentWithinRegionSpecifier(content, result.id, result.from, result.to, result.space);
      break;
  }

  content = isLast && result.name !== "debug" ? removeAllParkdownComments(content) : content;
  return isLast ? finalize(content) : content;
}