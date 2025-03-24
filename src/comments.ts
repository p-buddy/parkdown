import { createParser, MethodDefinition } from "./api";
import { extractComments, type ExtractedComment } from "./extract";
import { COMMA_NOT_IN_PARENTHESIS, escapeForRegEx } from "./utils";

const prefixes = [
  "p↓:",
  "pd:",
  "parkdown:"
]

const definitions = [
  "splice(delete?: number, insert?: string)"
] satisfies MethodDefinition[];

const parse = createParser(definitions);

export const sortComment = (a: ExtractedComment, b: ExtractedComment) => a.range[0] - b.range[0];

export const getMatchingComments = (content: string, specifier: string, comments?: ExtractedComment[]) =>
  (comments ?? extractComments(content))
    .filter(({ value }) => value.includes(specifier))
    .sort(sortComment);

const charTest = (char?: string) => ({
  isSpace: char === " ",
  isNewline: char === "\n" || char === undefined
});

export const removeAllParkdownComments = (content: string) =>
  prefixes
    .flatMap(prefix => getMatchingComments(content, prefix))
    .sort((a, b) => a.range[0] - b.range[0])
    .reverse()
    .reduce((acc, { range: [start, end], value }) => {
      const remove = (left: number, right: number) =>
        acc.slice(0, left) + acc.slice(right);

      const prev = charTest(acc[start - 1]);
      const next = charTest(acc[end]);
      const last = end === acc.length;

      let lineStart = start;
      while (lineStart > 0 && acc[lineStart - 1] !== '\n') lineStart--;
      const lineOnlyHasComment = acc.slice(lineStart, start).trim() === '';

      if (prev.isNewline && next.isNewline) {
        return remove(start - (last ? 1 : 0), end + 1);
      } else if (prev.isNewline || lineOnlyHasComment) {
        return remove(lineStart, end + (next.isSpace || next.isNewline ? 1 : 0));
      } else {
        return remove(start - (prev.isSpace ? 1 : 0), end);
      }
    }, content);

export const queryMatchers = prefixes.map(prefix => new RegExp(`^${escapeForRegEx(prefix)}(\\?[^\\s]+)`));

export const getSearchParams = (text: string) => queryMatchers
  .map(regex => regex.exec(text)?.[1])
  .filter(Boolean)
  .map(match => new URLSearchParams(match))[0]

/**
 * NOTE: Currently not used/needed.
 * @param content 
 * @param specifier_s 
 * @returns 
 */
export const applyCommentQueriesFirstPass = (content: string, specifier_s: (string[]) | string) =>
  (
    Array.isArray(specifier_s)
      ? specifier_s.flatMap(specifier => getMatchingComments(content, specifier))
      : getMatchingComments(content, specifier_s)
  )
    .filter(({ value }) => queryMatchers.some(regex => regex.test(value)))
    .sort((a, b) => a.range[0] - b.range[0])
    .reverse()
    .reduce((acc, { range: [start, end], value }) => {
      const params = getSearchParams(value);
      type Param = "back" | "front";
      const queryMap = (["back", "front"] satisfies Param[])
        .map(key => [key, params.get(key)] as const)
        .filter(([_, value]) => Boolean(value))
        .reduce(
          (acc, [key, value]) => acc.set(key, value.split(COMMA_NOT_IN_PARENTHESIS)),
          new Map<"back" | "front", string[]>()
        );

      acc = queryMap.get("back")
        ?.reduce((acc, query) => {
          const result = parse(query);
          if (result.name === "splice")
            return acc.slice(0, end) + (result.insert ?? "") + acc.slice(end + (result.delete ?? 0));
        }, acc)
        ?? acc;

      acc = queryMap.get("front")
        ?.reduce((acc, query) => {
          const result = parse(query);
          if (result.name === "splice")
            return acc.slice(0, start - (result.delete ?? 0)) + (result.insert ?? "") + acc.slice(start);
        }, acc)
        ?? acc;

      return acc;
    }, content);