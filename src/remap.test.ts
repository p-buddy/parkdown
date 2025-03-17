import { describe, test, expect } from "vitest";
import { dedent } from "ts-dedent";
import * as regexp from '@flex-development/import-regex';
describe("remapImports", () => {
  test("should remap imports", () => {
    const code = dedent`
      import { foo } from "bar";
      import { baz, type Qux } from "qux";
      import type { Foo as Bar } from "bar";

      const result = () => {
      }
    `;

    let value = code;

    [...code.matchAll(regexp.STATIC_IMPORT_REGEX)]
      .sort((a, b) => a.index - b.index)
      .reverse()
      .forEach((match) => {
        const { index, groups } = match;
        if (!groups) return;
        const { type, imports, specifier } = groups;
        const remapped = ["import", type, imports, "from", "dingo"].filter(Boolean).join(" ");
        value = value.slice(0, index) + remapped + value.slice(index + match[0].length);
      });

    /* 
        const result = code.replace(regexp.STATIC_IMPORT_REGEX, (match) => {
          const executed = regexp.STATIC_IMPORT_REGEX.exec(code);
          console.log(executed);
          const { type, imports, specifier } = executed?.groups ?? {};
          return `${type ? "import type" : "import"} ${imports} from "${specifier}"`;
        }); */

  })
})