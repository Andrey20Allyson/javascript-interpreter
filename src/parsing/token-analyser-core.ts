import { Token } from "./token";

export type TokenConstructor = new (text: string) => Token;
export interface TokenGenerator {
  offset: number;
  next(): Token | null;
}

export abstract class TokenAnalyser implements TokenGenerator {
  protected abstract readonly TokenConstructor: TokenConstructor;
  constructor(readonly code: string, public offset: number = 0) {}

  abstract getMatch(): string | null;

  next(): Token | null {
    const matchString = this.getMatch();
    if (matchString == null) {
      this.offset += 1;

      return null;
    }

    this.offset += matchString.length;

    return new this.TokenConstructor(matchString);
  }
}

export abstract class SimpleTokenAnalyser extends TokenAnalyser {
  protected abstract searchString: string;

  getMatch(): string | null {
    for (let i = 0; i < this.searchString.length; i++) {
      if (this.code[this.offset + i] !== this.searchString[i]) {
        return null;
      }
    }

    return this.searchString;
  }
}

export abstract class PolyTokenAnalyser extends SimpleTokenAnalyser {
  protected abstract readonly searchStrings: string[];
  protected searchString: string = "";

  getMatch(): string | null {
    for (const searchString of this.searchStrings) {
      this.searchString = searchString;

      const match = super.getMatch();

      if (match != null) {
        return match;
      }
    }

    return null;
  }
}

export class TokenAnalyserCollection implements TokenGenerator {
  private collection: TokenGenerator[] = [];

  constructor(public offset: number = 0) {}

  setCollection(collection: TokenGenerator[]) {
    this.collection = collection;
  }

  next(): Token | null {
    for (const generator of this.collection) {
      generator.offset = this.offset;

      const token = generator.next();
      if (token == null) {
        continue;
      }

      this.offset = generator.offset;

      return token;
    }

    this.offset += 1;

    return null;
  }
}
