export type Token = Token.TokenBase;
export namespace Token {
  export abstract class TokenBase {
    readonly type: string;

    constructor() {
      this.type = (this.constructor as typeof TokenBase).getType();
    }

    static getType(): string {
      return this.name;
    }
  }

  export class Identifier extends TokenBase {
    constructor(readonly name: string) {
      super();
    }
  }

  export class Keyword extends TokenBase {
    constructor(readonly keyword: string) {
      super();
    }
  }

  export class Numb extends TokenBase {
    constructor(readonly text: string) {
      super();
    }
  }

  export class Str extends TokenBase {
    constructor(readonly text: string) {
      super();
    }
  }

  export class BinaryOperator extends TokenBase {
    constructor(readonly opr: string) {
      super();
    }
  }

  export abstract class OpenOfBrackets extends TokenBase {}
  export abstract class CloseOfBrackets extends TokenBase {}

  export class OpenParentheses extends OpenOfBrackets {}
  export class CloseParentheses extends CloseOfBrackets {}

  export class OpenBraces extends OpenOfBrackets {}
  export class CloseBraces extends CloseOfBrackets {}

  export class Dot extends TokenBase {}
  export class Semicolon extends TokenBase {}
  export class Comma extends TokenBase {}
  export class Colon extends TokenBase {}
  export class LineCommentary extends TokenBase {}
  export class EndOfFile extends TokenBase {}
}
