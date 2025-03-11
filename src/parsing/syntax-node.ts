export abstract class SyntaxNode {
  readonly type: string;

  constructor() {
    this.type = this.constructor.name;
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

  export class PropertyDeref extends SyntaxNode {
    constructor(
      readonly identifier: Identifier,
      readonly property: SyntaxNode
    ) {
      super();
    }
  }

  export class MethodCall extends SyntaxNode {
    constructor(
      readonly identifier: Identifier,
      readonly methodIdentifier: Identifier,
      readonly params: SyntaxNode[]
    ) {
      super();
    }
  }

  export class FunctionCall extends SyntaxNode {
    constructor(
      readonly identifier: Identifier,
      readonly params: SyntaxNode[]
    ) {
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

  export class BinaryOperation extends SyntaxNode {
    constructor(
      readonly opr: string,
      readonly leftExpr: SyntaxNode,
      readonly rightExpr: SyntaxNode
    ) {
      super();
    }
  }
}
