export class Range {
  constructor(readonly start: number = 0, readonly end: number = -1) {}
}

export interface ArrayAcessor<T> {
  at(index: number): T | undefined;
}

export class ArrayRangeAcessor<T> implements ArrayAcessor<T> {
  constructor(
    private readonly array: ReadonlyArray<T>,
    readonly range: Range = new Range()
  ) {
    if (range.end < 0) {
      this.range = new Range(range.start, array.length + range.end + 1);
    }
  }

  at(index: number): T | undefined {
    if (index < this.range.start) {
      return;
    }

    if (index >= this.range.end) {
      return;
    }

    return this.array.at(index);
  }

  rerange(range: Range) {
    return new ArrayRangeAcessor(this.array, range);
  }
}
