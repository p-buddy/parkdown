import { createParser, type MethodDefinition } from "./api/";

/** p▼: definition */
const definitions = [
  /**
   * @example [](<url>?wrap=code)
   * @example [](<url>?wrap=code())
   * @example [](<url>?wrap=code(ts))
   * @example [](<url>?wrap=code(,some-meta))
   */
  "code(lang?: string, meta?: string)",

  /**
   * @example [](<url>?wrap=quote)
   * @example [](<url>?wrap=quote())
   * @example [](<url>?wrap=quote(,))
   */
  "quote()",

  /**
   * @example [](<url>?wrap=dropdown(hello-world))
   * @example [](<url>?wrap=dropdown('hello,-world',true))
   * @example [](<url>?wrap=dropdown(hello_world,,_))
   */
  "dropdown(summary: string, open?: boolean, space?: string)",
] /** p▼: definition */ satisfies (MethodDefinition)[];

/** p▼: Default-Space */
const DEFAULT_SPACE = "-";
/** p▼: Default-Space */

const parse = createParser(definitions);

export const wrap = (content: string, query: string, details?: { extension: string, inline: boolean }) => {
  const result = parse(query);
  const singleLine = details?.inline && !content.includes("\n\n");

  switch (result.name) {
    case "code":
      const lang = result.lang ?? details?.extension ?? "";
      const meta = result.meta ? ` ${result.meta}` : "";
      return `\`\`\`${lang}${meta}\n${content}\n\`\`\``;
    case "quote":
      return singleLine
        ? `> ${content}`
        : `<blockquote>\n\n${content}\n\n</blockquote>\n`;
    case "dropdown":
      const head = `<details${result.open ? " open" : ""}>`;
      const summary = `<summary>${result.summary.split(result.space ?? DEFAULT_SPACE).join(" ")}</summary>`;
      return ["", head, summary, "", content, "</details>", ""].join("\n");
  }
}