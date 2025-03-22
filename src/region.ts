import { dedent } from "ts-dedent";
import { Intervals, sanitize } from "./utils"
import { createParser, numberedParameters, type MethodDefinition } from "./api/";
import _extract from "extract-comments";
import _extract2 from "multilang-extract-comments";

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

type ExtractionTask = {
  extension: string,
  content: string,
}

/**  https://github.com/jonschlinkert/extract-comments format */
type ExtractedComment = {
  range: [number, number],
  value: string,
  loc: {
    start: { line: number, column: number },
    end: { line: number, column: number },
  },
};

/** https://www.npmjs.com/package/multilang-extract-comments format */
type ExtractReturn = Record<string, Record<"begin" | "end", number> & {
  content: string,
}>;

export const remapExtractedComments = (extracted: ExtractReturn, content: string): ExtractedComment[] =>
  Object.entries(extracted).map(([_, item]) => {
    console.log(item);
    const { begin, end, content: value } = item;
    const preamble = content.slice(0, begin);
    const full = content.slice(0, end);

    const preSplit = preamble.split("\n");
    const fullSplit = full.split("\n");

    const startColumn = preamble.length - preSplit.at(-1).length;
    const endColumn = full.length - fullSplit.at(-1).length;

    return {
      value,
      range: [begin, end],
      loc: {
        start: { line: preSplit.length, column: startColumn },
        end: { line: fullSplit.length, column: endColumn },
      },
    };
  });

export const extractComments = ({ extension, content }: ExtractionTask) => {
  switch (extension) {
    case "js":
    case "ts":
    case "md":
      // change to use _extract
      return _extract(content) as ExtractedComment[];
    case "svelte":
      // change to use both _extract and _extract2
      const set = new Set<string>();
      return [
        /** multi-pass */
        ..._extract(content) as ExtractedComment[],
        ...remapExtractedComments(_extract2(content, { filename: `dummy.js` }), content),
        ...remapExtractedComments(_extract2(content, { filename: `dummy.html` }), content),
      ].filter(({ range: [start, end] }) => {
        const key = `${start}-${end}`;
        return set.has(key) ? false : Boolean(set.add(key));
      });
    default:
      throw new Error(`Unsupported extension: ${extension}`);
  }
};

export const getMatchingComments = (task: ExtractionTask, specifier: string) => extractComments(task)
  .filter(({ value }) => value.includes(specifier))
  .sort((a, b) => a.range[0] - b.range[0]);

export const extractContentWithinRegionSpecifiers = (task: ExtractionTask, ...specifiers: string[]) => {
  let { content } = task;
  if (specifiers.length === 0) return content;

  const slice = ([start, end]: ExtractedComment["range"]) => content.slice(start, end);

  const comments = extractComments(task);

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

export const removeContentWithinRegionSpecifiers = (task: ExtractionTask, ...specifiers: string[]) => {
  let { content } = task;
  if (specifiers.length === 0) return content;

  const slice = ([start, end]: ExtractedComment["range"]) => content.slice(start, end);
  const comments = extractComments(task);

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

export const replaceContentWithinRegionSpecifier = (task: ExtractionTask, specifier: string, replacement?: string, space?: string) => {
  let { content } = task;
  if (!specifier) return content;

  const matching = getMatchingComments(task, specifier);

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
    getMatchingComments({ ...task, content: result }, specifier)
      .reduce((acc, { range }) => (acc.push(...range), acc), new Intervals())
  );

  return dedent(
    fullContent.collapse().map(([start, end]) => result.slice(start, end)).filter(Boolean).join("")
  ).trim();;
};

const charTest = (char: string) => ({ space: char === " ", newline: char === "\n" })

export const removeAllParkdownComments = (task: ExtractionTask) =>
  [
    ...getMatchingComments(task, "p↓:"),
    ...getMatchingComments(task, "parkdown:"),
  ]
    .sort((a, b) => a.range[0] - b.range[0])
    .reverse()
    .reduce((acc, { range: [start, end], loc: { start: { column } } }) => {
      const remove = (left: number, right: number) =>
        acc.slice(0, left) + acc.slice(right);
      const is = {
        prev: charTest(acc[start - 1]),
        next: charTest(acc[end]),
        startLine: column === 0,
        final: end === acc.length,
      };
      const full = is.startLine && (is.next.newline || is.final);
      if (full) return remove(start - (is.final ? 1 : 0), end + 1);
      else if (is.startLine) return remove(start, end + (is.next.space ? 1 : 0))
      else return remove(start - (is.prev.space ? 1 : 0), end)
    }, task.content);

export const applyRegion = (task: ExtractionTask & { query?: string }) => {
  let { content, query } = task;
  if (!query) return removeAllParkdownComments(task);

  const result = parse(task.query);

  switch (result.name) {
    case "extract":
      content = extractContentWithinRegionSpecifiers(task, result.id, ...numberedParameters(result));
      break;
    case "remove":
      content = removeContentWithinRegionSpecifiers(task, result.id, ...numberedParameters(result));
      break;
    case "replace":
      content = replaceContentWithinRegionSpecifier(task, result.id, result.with, result.space);
      break;
  }

  return removeAllParkdownComments({ ...task, content });
}