export interface SyntaxNodeConstructor<T extends SyntaxNode = SyntaxNode> {
  new (...args: any[]): T;
  getType(): string;
}

export abstract class SyntaxNode {
  readonly type: string;

  constructor() {
    const Constructor = this.constructor as SyntaxNodeConstructor;

    this.type = Constructor.getType();
  }

  as<T extends SyntaxNode>(Constructor: SyntaxNodeConstructor<T>): T {
    if (this instanceof Constructor) {
      return this;
    }

    throw new Error(`Expected ${Constructor.getType()}, recived ${this.type}`);
  }

  asOpt<T extends SyntaxNode>(Constructor: SyntaxNodeConstructor<T>): T | null {
    if (this instanceof Constructor) {
      return this;
    }

    return null;
  }

  static getType() {
    return this.name;
  }
}

export namespace SyntaxNode {
  export class NodeList extends SyntaxNode {
    constructor(readonly nodes: SyntaxNode[]) {
      super();
    }
  }

  export class Identifier extends SyntaxNode {
    constructor(readonly name: string) {
      super();
    }
  }

  export class FunctionCall extends SyntaxNode {
    constructor(readonly ref: SyntaxNode, readonly params: SyntaxNode[]) {
      super();
    }
  }

  export class FunctionDefinition extends SyntaxNode {
    constructor(
      readonly identifier: Identifier,
      readonly params: SyntaxNode[],
      readonly body: SyntaxNode
    ) {
      super();
    }
  }

  export class StrLiteral extends SyntaxNode {
    constructor(readonly value: string) {
      super();
    }
  }

  export class NumbLiteral extends SyntaxNode {
    constructor(readonly value: number) {
      super();
    }
  }

  export class NullLiteral extends SyntaxNode {}

  export class BinaryOperation extends SyntaxNode {
    constructor(
      readonly opr: string,
      readonly leftExpr: SyntaxNode,
      readonly rightExpr: SyntaxNode
    ) {
      super();
    }
  }

  export class ReturnStatement extends SyntaxNode {
    constructor(readonly expr: SyntaxNode) {
      super();
    }
  }

  export class IfStatement extends SyntaxNode {
    constructor(readonly logicExpr: SyntaxNode, readonly body: SyntaxNode) {
      super();
    }
  }

  export class LetStatement extends SyntaxNode {
    constructor(readonly identifier: Identifier, readonly expr: SyntaxNode) {
      super();
    }
  }

  export class ObjectLiteralProperty extends SyntaxNode {
    constructor(readonly identifier: Identifier, readonly expr: SyntaxNode) {
      super();
    }
  }

  export class ObjectLiteral extends SyntaxNode {
    constructor(readonly properties: ObjectLiteralProperty[]) {
      super();
    }
  }
}
