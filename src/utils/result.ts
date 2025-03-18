export interface Unwrapable<T> {
  unwrap(): T;
}

export type Result<V, E = Error> = [error: E | null, value: V] & Unwrapable<V>;
export namespace Result {
  export function ok<T>(value: T): Result<T> {
    return create(value, null);
  }

  export function err<E extends Error = Error>(
    error: E | string
  ): Result<any, E> {
    if (typeof error === "string") {
      return create(null, new Error(error));
    }

    return create(null, error);
  }

  function create<T, E extends Error>(
    value: T,
    error: Error | null
  ): Result<T, E> {
    const res = [error, value] as Result<T, E>;

    res.unwrap = unwrap;

    return res;
  }

  function unwrap(this: Result<any>): any {
    const [error, value] = this;

    if (error != null) {
      throw error;
    }

    return value;
  }
}
