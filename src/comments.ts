import { createParser, MethodDefinition } from "./api";
import { COMMA_NOT_IN_PARENTHESIS, escapeForRegEx } from "./utils";

export const extractComments = (input: string) => {
  const commentRegex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->)/gm;

  const comments: ExtractedComment[] = [];
  let match: RegExpExecArray;

  while ((match = commentRegex.exec(input)) !== null) {
    const range = [match.index, match.index + match[0].length] satisfies Range;
    const value = commentValue(match[0]).trim();
    comments.push({ range, value });
  }

  return comments;
};

export const commentValue = (fullMatch: string) => fullMatch.startsWith('//') ? fullMatch.slice(2) :
  fullMatch.startsWith('/*') ? fullMatch.slice(2, -2) :
    fullMatch.startsWith('<!--') ? fullMatch.slice(4, -3) :
      fullMatch;

/** 0-indexed */
export type Range = [number, number];

export type ExtractedComment = {
  value: string;
  range: Range;
};

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
    .filter(({ value }) => value.split(" ").includes(specifier))
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
      let lineEnd = end;
      while (lineEnd < acc.length && acc[lineEnd] !== '\n') lineEnd++;

      const lineOnlyHasComment = acc.slice(lineStart, start).trim() === '' && acc.slice(end, lineEnd).trim() === '';

      if (prev.isNewline && next.isNewline)
        return remove(start - (last ? 1 : 0), end + 1);
      else if (prev.isNewline || lineOnlyHasComment)
        return remove(lineStart, end + (next.isSpace || next.isNewline ? 1 : 0));
      else
        return remove(start - (prev.isSpace ? 1 : 0), end);
    }, content);