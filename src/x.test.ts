import { describe, expect, test } from "vitest";
import { extractContentWithinBoundaries } from "./include";
import dedent from "ts-dedent";

// range: [2, 40]  range:[8. 18]

// [2, 8] [18, 40]
describe("extractBoundary", () => {
  test("basic", () => {
    const code = dedent`
      /* id-1 */
      This content should be extracted
      /* id-1 */

      This content should not be extracted
    `;
    const result = extractContentWithinBoundaries(code, "id-1");
    expect(result).toEqual("This content should be extracted");
  });

  test("nested 1", () => {
    const code = dedent`
      /* id-1 */
      This content should be extracted
      /* id-2 */ This content should also be extracted /* id-2 */
      /* id-1 */

      This content should not be extracted
    `;
    expect(extractContentWithinBoundaries(code, "id-1"))
      .toEqual("This content should be extracted\n/* id-2 */ This content should also be extracted /* id-2 */");
    expect(extractContentWithinBoundaries(code, "id-1", "id-2"))
      .toEqual("This content should be extracted\nThis content should also be extracted");
    expect(extractContentWithinBoundaries(code, "id-2"))
      .toEqual("This content should also be extracted");
  });

  test("nested 1", () => {
    const code = dedent`
      /* id-1 */
      This content should be extracted
      /* id-2 */
      This content should also be extracted
      /* id-2 */
      /* id-1 */

      This content should not be extracted
    `;
    expect(extractContentWithinBoundaries(code, "id-1"))
      .toEqual("This content should be extracted\n/* id-2 */\nThis content should also be extracted\n/* id-2 */");
    expect(extractContentWithinBoundaries(code, "id-1", "id-2"))
      .toEqual("This content should be extracted\n\nThis content should also be extracted");
    expect(extractContentWithinBoundaries(code, "id-2"))
      .toEqual("This content should also be extracted");
  });
});