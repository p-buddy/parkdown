import { describe, test, expect } from "vitest";
import { Intervals } from "./Intervals";

describe(Intervals.name, () => {
  test("adding single index", () => {
    const intervals = new Intervals();
    intervals.push(0, 1);
    expect(intervals.test(0)).toBe(true);
    expect(intervals.test(1)).toBe(false);
    expect(intervals.test(1, "tail")).toBe(true);
    expect(intervals.test(1, "head")).toBe(false);
    expect(intervals.test(2)).toBe(false);
  });
});
