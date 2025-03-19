import { createParser, type MethodDefinition } from "./api/";
import { sanitize } from "./utils";

/** p↓: definition */
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

] /** p↓: definition */ satisfies (MethodDefinition)[];

const parse = createParser(definitions);

const lined = (content: string, count = 1) =>
  "\n".repeat(count) + content + "\n".repeat(count);

const tag = (content: string, tag: "summary" | "details" | "blockquote", attributes?: string) =>
  `<${tag}${attributes ? ` ${attributes}` : ""}>${lined(content)}</${tag}>`;

export const wrap = (content: string, query: string, details?: { extension: string, inline: boolean }): string => {
  const parsed = parse(query);

  switch (parsed.name) {
    case "code":
      const inlineCode = !parsed.lang && !parsed.meta && details?.inline && !content.includes("\n");
      if (inlineCode) return `\`${content}\``;
      const lang = parsed.lang ?? details?.extension ?? "";
      const meta = parsed.meta ? ` ${parsed.meta}` : "";
      return lined(`\`\`\`${lang}${meta}${lined(content)}\`\`\``);
    case "quote":
      return details?.inline && !content.includes("\n\n")
        ? `> ${content}`
        : lined(tag(lined(content), "blockquote"));
    case "dropdown":
      const summary = tag(sanitize(parsed.summary), "summary");
      return lined(tag([summary, content].join("\n"), "details", parsed.open ? "open" : undefined));
  }
}