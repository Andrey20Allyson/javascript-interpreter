export type SyntaxNode = SyntaxNode.SyntaxNodeBase;
export namespace SyntaxNode {
  export abstract class SyntaxNodeBase {
    readonly type: string;

    constructor() {
      this.type = this.constructor.name;
    }
  }

  export class NodeList extends SyntaxNodeBase {
    constructor(readonly nodes: SyntaxNodeBase[]) {
      super();
    }
  }

  export class Identifier extends SyntaxNodeBase {
    constructor(readonly name: string) {
      super();
    }
  }

  export class PropertyDeref extends SyntaxNodeBase {
    constructor(
      readonly identifier: Identifier,
      readonly property: SyntaxNodeBase
    ) {
      super();
    }
  }

  export class MethodCall extends SyntaxNodeBase {
    constructor(
      readonly identifier: Identifier,
      readonly methodIdentifier: Identifier,
      readonly params: SyntaxNodeBase[]
    ) {
      super();
    }
  }

  export class FunctionCall extends SyntaxNodeBase {
    constructor(
      readonly identifier: Identifier,
      readonly params: SyntaxNodeBase[]
    ) {
      super();
    }
  }

  export class StrLiteral extends SyntaxNodeBase {
    constructor(readonly value: string) {
      super();
    }
  }

  export class NumbLiteral extends SyntaxNodeBase {
    constructor(readonly value: number) {
      super();
    }
  }

  export class BinaryOperation extends SyntaxNodeBase {
    constructor(
      readonly opr: string,
      readonly leftExpr: SyntaxNodeBase,
      readonly rightExpr: SyntaxNodeBase
    ) {
      super();
    }
  }
}
