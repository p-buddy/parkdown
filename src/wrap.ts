import { createParser, type MethodDefinition } from "./api/";

/** p▼: definition */
const definitions = [
  /**
   * Wraps the content in a markdown-formatted code block.
   * @param lang The language of the code block (defaults to the file extension).
   * @param meta Additional metadata to include in the top line of the code block (i.e. to the right of the `lang`).
   * @example [](<url>?wrap=code)
   * @example [](<url>?wrap=code())
   * @example [](<url>?wrap=code(ts))
   * @example [](<url>?wrap=code(,some-meta))
   */
  "code(lang?: string, meta?: string)",

  /**
   * Wraps the content in a markdown-formatted blockquote 
   * (using the `>` character if the content is a single line, 
   * or the `<blockquote>` tag if the content is a multi-line block).
   * @example [](<url>?wrap=quote)
   * @example [](<url>?wrap=quote())
   * @example [](<url>?wrap=quote(,))
   */
  "quote()",

  /**
   * Wraps the content in a markdown-formatted dropdown (using the `<details>` and `<summary>` tags).
   * @param summary The summary text of the dropdown.
   * @param open Whether the dropdown should be open by default.
   * @param space The space character to use between words in the summary (defaults to `-`).
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

export const wrap = (content: string, query: string, details?: { extension: string, inline: boolean }): string => {
  const parsed = parse(query);
  const isSingleLine = details?.inline && !content.includes("\n\n");

  switch (parsed.name) {
    case "code":
      const lang = parsed.lang ?? details?.extension ?? "";
      const meta = parsed.meta ? ` ${parsed.meta}` : "";
      return `\`\`\`${lang}${meta}\n${content}\n\`\`\``;
    case "quote":
      return isSingleLine ? `> ${content}` : `<blockquote>\n\n${content}\n\n</blockquote>\n`;
    case "dropdown":
      const head = `<details${parsed.open ? " open" : ""}>`;
      const summary = `<summary>${parsed.summary.split(parsed.space ?? DEFAULT_SPACE).join(" ")}</summary>`;
      return ["", head, summary, "", content, "</details>", ""].join("\n");
  }
}