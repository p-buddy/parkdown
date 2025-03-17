import type { MethodDefinition } from "./types";
import { createParser } from "./utils";
export { COMMA_NOT_IN_PARENTHESIS } from "./utils";

/** parkdown: definition */
const definitions = [
  /** @example [](./file?tag=code) */
  /** @example [](./file?tag=code()) */
  /** @example [](./file?tag=code(ts)) */
  /** @example [](./file?tag=code(,some-meta)) */
  "code(lang?: string, meta?: string)",
  /** @example [](./file?tag=quote) */
  /** @example [](./file?tag=quote()) */
  /** @example [](./file?tag=quote(,)) */
  "quote()",
  /** @example [](./file?tag=dropdown(hello-world)) */
  /** @example [](./file?tag=dropdown('hello world',true)) */
  "dropdown(summary: string, open?: boolean)",
] /** parkdown: definition */ satisfies (MethodDefinition)[]

const parse = createParser(definitions);

export const wrap = (query: string, content: string, details?: { extension: string, inline: boolean }) => {
  const result = parse(query);
  switch (result.name) {
    case "code":
      const lang = result.lang ?? details?.extension ?? "";
      const meta = result.meta ? ` ${result.meta}` : "";
      return `\`\`\`${lang}${meta}\n${content}\n\`\`\``;
    case "quote":
      return details?.inline && !content.includes("\n\n")
        ? `> ${content}`
        : `<blockquote>\n\n${content}\n\n</blockquote>\n`;
    case "dropdown":
      return `<${result.open ? "details open" : "details"}><summary>${result.summary}</summary>${content}</details>`;
  }
}