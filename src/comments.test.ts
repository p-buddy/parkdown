import { describe, expect, test } from "vitest";
import { dedent } from "ts-dedent";
import { removeAllParkdownComments, extractComments } from "./comments";

describe(extractComments.name, () => {
  test("basic", () => {
    const code = dedent`
    <script>
      let count = 0;
      /* A */
      remove!
      /* A */
    </script>
    <Component prop={/* p:?=1 B */ async () => {
      /* B */
    }}>
      <!-- C -->
      <p>Hello</p>
      <!-- C -->
    </Component>
    `;

    const comments = extractComments(code);
    console.log(comments);
    expect(comments.length).toBe(6);

  })
})

describe(removeAllParkdownComments.name, () => {
  test("block", () => {
    const code = dedent`
      /* p↓: block start */
      Hello
      /* p↓: block end */
    `
    expect(removeAllParkdownComments(code)).toBe("Hello")
  });

  test("line", () => {
    const code = "/* p↓: line start */ Hello /* p↓: line end */"
    expect(removeAllParkdownComments(code)).toBe("Hello")
  })

  test("mixed 1", () => {
    const code = dedent`
      Hello /* p↓: */ Hello /** p↓: **/ Hello
      Hello
      /* p↓: */
      Hello
      /* p↓: */`;
    expect(removeAllParkdownComments(code)).toBe(dedent`
      Hello Hello Hello
      Hello
      Hello
    `);
  });

  test("mixed 2", () => {
    const code = dedent`
      /* p↓: */
      Hello
      /* p↓: */
      Hello /* p↓: */ Hello /** p↓: **/ Hello
      Hello`;
    expect(removeAllParkdownComments(code)).toBe(dedent`
      Hello
      Hello Hello Hello
      Hello
    `);
  })

  test("mixed 3", () => {
    const code = dedent`
      // p↓:
      Hello
      // p↓:
      Hello /* p↓: */ Hello /** p↓: **/ Hello
      Hello`;
    expect(removeAllParkdownComments(code)).toBe(dedent`
      Hello
      Hello Hello Hello
      Hello
    `);
  })

  test("indented", () => {
    const code = dedent`
      // p↓:
            // p↓:
      Hello
      // p↓:
            // p↓:
      Hello /* p↓: */ Hello /** p↓: **/ Hello
      Hello`;
    expect(removeAllParkdownComments(code)).toBe(dedent`
      Hello
      Hello Hello Hello
      Hello
    `);
  })
})