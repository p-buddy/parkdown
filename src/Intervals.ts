export class Intervals {
  private _intervals: Array<[number, number]> = [];
  private collapsed = true;

  get intervals() {
    return this._intervals;
  }

  constructor(...ranges: Array<[number, number]>) {
    for (const [start, end] of ranges) {
      this.push(start, end);
    }
  }

  push(start: number, end?: number) {
    end ??= start + 1;
    this._intervals.push([Math.min(start, end), Math.max(start, end)]);
    this.collapsed = false;
    return this;
  }

  combine(rhs: Intervals) {
    for (const [start, end] of rhs.intervals)
      this.push(start, end);
    return this;
  }

  collapse(force: boolean = false) {
    const { _intervals: intervals, collapsed } = this;
    if ((collapsed && !force) || !intervals.length) return this;

    intervals.sort((a, b) => a[0] - b[0]);

    const result: typeof this._intervals = [];
    let [currStart, currEnd] = intervals[0];

    for (let i = 1; i < intervals.length; i++) {
      const [start, end] = intervals[i];
      if (start <= currEnd) currEnd = Math.max(currEnd, end);
      else {
        result.push([currStart, currEnd]);
        currStart = start;
        currEnd = end;
      }
    }
    result.push([currStart, currEnd]);
    this._intervals = result;
    this.collapsed = true;
    return this;
  }

  subtract(rhs: Intervals) {
    this.collapse();
    rhs.collapse();

    const { _intervals: intervals } = this;
    const { _intervals: remove } = rhs;

    if (!intervals.length || !remove.length) return this;

    let result = [...intervals];
    for (const [removeStart, removeEnd] of remove) {
      const updated: typeof this._intervals = [];

      for (const [start, end] of result) {
        if (removeEnd <= start || removeStart >= end) {
          updated.push([start, end]);
          continue;
        }

        if (removeStart > start) updated.push([start, removeStart]);
        if (removeEnd < end) updated.push([removeEnd, end]);
      }

      result = updated;
    }

    this._intervals = result;
    this.collapse(true);

    return this;
  }

  test(value: number, inclusive: "head" | "tail" | "both" | "none" = "head") {
    const { _intervals: intervals } = this;
    switch (inclusive) {
      case "head":
        return intervals.some(([start, end]) => value >= start && value < end);
      case "tail":
        return intervals.some(([start, end]) => value > start && value <= end);
      case "both":
        return intervals.some(([start, end]) => value >= start && value <= end);
      case "none":
        return intervals.some(([start, end]) => value > start && value < end);
    }
  }

  slice(content: string) {
    this.collapse();
    const result: string[] = [];
    for (const [start, end] of this._intervals) {
      result.push(content.slice(start, end));
    }
    return result.filter(Boolean).join("");
  }

  offset(offset: number) {
    for (const tuple of this._intervals) {
      tuple[0] += offset;
      tuple[1] += offset;
    }
    return this;
  }
}
