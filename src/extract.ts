/** 0-indexed */
type Range = [number, number];

export type ExtractedComment = {
  value: string,
  range: Range,
};


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
}

const commentValue = (fullMatch: string) =>
  fullMatch.startsWith('//') ? fullMatch.slice(2) :
    fullMatch.startsWith('/*') ? fullMatch.slice(2, -2) :
      fullMatch.startsWith('<!--') ? fullMatch.slice(4, -3) :
        fullMatch;
