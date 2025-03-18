export class Range {
  constructor(readonly start: number = 0, readonly end: number = -1) {}
}

export interface ArrayAccessor<T> {
  at(index: number): T | undefined;
  [Symbol.iterator](): IterableIterator<T>;
}

export class ArrayRangeAccessor<T> implements ArrayAccessor<T> {
  constructor(
    private readonly array: ReadonlyArray<T>,
    readonly range: Range = new Range()
  ) {
    if (range.end > this.array.length) {
      this.range = new Range(range.start, -1);
    }

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

  *[Symbol.iterator](): IterableIterator<T> {
    for (let i = this.range.start; i < this.range.end; i++) {
      yield this.array.at(i)!;
    }
  }

  rerange(range: Range) {
    return new ArrayRangeAccessor(this.array, range);
  }
}
