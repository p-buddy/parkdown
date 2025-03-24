import { describe, expect, test } from "vitest";
import { dedent } from "ts-dedent";
import { removeAllParkdownComments, queryMatchers, getSearchParams, applyCommentQueriesFirstPass } from "./comments";

describe(Object.keys({ queryMatchers })[0], () => {
  [
    ["p↓:", undefined] as const,
    ["p↓:?param1=hi", [["param1", "hi"]]] as const,
    ["pd:", undefined] as const,
    ["pd:?param1=hi&param2=hello", [["param1", "hi"], ["param2", "hello"]]] as const,
    ["parkdown:?a=b&c=d", [["a", "b"], ["c", "d"]]] as const,
    ["someOtherString", undefined] as const,
  ].forEach(([str, expected]) => {
    test(str, () => {
      const params = getSearchParams(str)
      expect(params ? Array.from(params.entries()) : undefined).toEqual(expected)
    });
  });
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
})

describe(applyCommentQueriesFirstPass.name, () => {
  test("delete back only", () => {
    const id = "id"
    const comment = `/* pd:?back=splice(1) ${id} */`
    const code = dedent`
      Hello ${comment} Hello ${comment} Hello
    `
    expect(applyCommentQueriesFirstPass(code, id)).toBe(`Hello ${comment}Hello ${comment}Hello`)
  })

  test("delete front only", () => {
    const id = "id"
    const comment = `/* pd:?front=splice(1) ${id} */`
    const code = dedent`
      Hello ${comment} Hello ${comment} Hello
    `
    expect(applyCommentQueriesFirstPass(code, id)).toBe(`Hello${comment} Hello${comment} Hello`)
  })

  test("delete back and front", () => {
    const id = "id"
    const comment = `/* pd:?back=splice(1)&front=splice(1) ${id} */`
    const code = dedent`
      Hello ${comment} Hello ${comment} Hello
    `
    expect(applyCommentQueriesFirstPass(code, id)).toBe(`Hello${comment}Hello${comment}Hello`)
  })

  test("insert back only", () => {
    const id = "id"
    const comment = `/* pd:?back=splice(,hi) ${id} */`
    const code = dedent`
      Hello ${comment} Hello ${comment} Hello
    `
    expect(applyCommentQueriesFirstPass(code, id)).toBe(`Hello ${comment}hi Hello ${comment}hi Hello`)
  })

  test("insert front only", () => {
    const id = "id"
    const comment = `/* pd:?front=splice(,hi) ${id} */`
    const code = dedent`
      Hello ${comment} Hello ${comment} Hello
    `
    expect(applyCommentQueriesFirstPass(code, id)).toBe(`Hello hi${comment} Hello hi${comment} Hello`)
  })

  test("insert back and front", () => {
    const id = "id"
    const comment = `/* pd:?back=splice(,hi)&front=splice(,hi) ${id} */`
    const code = dedent`
      Hello ${comment} Hello ${comment} Hello
    `
    expect(applyCommentQueriesFirstPass(code, id)).toBe(`Hello hi${comment}hi Hello hi${comment}hi Hello`)
  })

  test("insert and delete back", () => {
    const id = "id"
    const comment = `/* pd:?back=splice(1,hi) ${id} */`
    const code = dedent`
      Hello ${comment} Hello ${comment} Hello
    `
    expect(applyCommentQueriesFirstPass(code, id)).toBe(`Hello ${comment}hiHello ${comment}hiHello`)
  })

  test("insert and delete front", () => {
    const id = "id"
    const comment = `/* pd:?front=splice(1,hi)&back=splice(1,hi) ${id} */`
    const code = dedent`
      Hello ${comment} Hello ${comment} Hello
    `
    expect(applyCommentQueriesFirstPass(code, id)).toBe(`Hellohi${comment}hiHellohi${comment}hiHello`)
  })

});