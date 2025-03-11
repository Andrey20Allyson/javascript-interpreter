export type Token = Token.TokenBase;
export namespace Token {
  export abstract class TokenBase {
    readonly type: string;

    constructor() {
      this.type = this.constructor.name;
    }
  }

  export class Identifier extends TokenBase {
    constructor(readonly name: string) {
      super();
    }
  }

  export class Keyword extends TokenBase {
    constructor(readonly name: string) {
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

  export class OpenParentheses extends TokenBase {
    constructor() {
      super();
    }
  }

  export class CloseParentheses extends TokenBase {
    constructor() {
      super();
    }
  }

  export class Dot extends TokenBase {
    constructor() {
      super();
    }
  }

  export class Semicolon extends TokenBase {
    constructor() {
      super();
    }
  }

  export class Colon extends TokenBase {
    constructor() {
      super();
    }
  }

  export class Operator extends TokenBase {
    constructor(readonly opr: string) {
      super();
    }
  }

  export class LineCommentary extends TokenBase {
    constructor() {
      super();
    }
  }

  export class EndOfFile extends TokenBase {}
}
