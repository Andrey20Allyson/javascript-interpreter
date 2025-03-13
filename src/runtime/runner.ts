import { SyntaxNode } from "@parsing/syntax-node";

export type Scope = Record<string, any>;

export abstract class RunResult {
  constructor(readonly value: any = null) {}

  asReturn(): RunResult {
    return new RunResult.Return(this.value);
  }
}

export namespace RunResult {
  export class Expr extends RunResult {}
  export class Return extends RunResult {}

  export class Error extends RunResult {
    readonly error: globalThis.Error;

    constructor(error: string | globalThis.Error) {
      super(null);

      if (typeof error === "string") {
        error = new globalThis.Error(error);
      }

      this.error = error;
    }
  }
}

function run(
  node: SyntaxNode,
  globalScopeAddon: Scope = {}
): [any, Error | null] {
  let globalScope: Scope = {
    console: {
      log(...args: any[]) {
        console.log(...args);

        return new RunResult.Return();
      },
    },
  };

  globalScope = Object.assign(globalScope, globalScopeAddon);

  const result = _run(node, [globalScope], null);

  if (result instanceof RunResult.Error) {
    return [null, result.error];
  }

  return [result.value, null];
}

function _run(
  node: SyntaxNode,
  scopes: Scope[],
  context: Scope | null = null
): RunResult {
  if (node instanceof SyntaxNode.NodeList) {
    let lastResult = new RunResult.Expr();

    for (const innerNode of node.nodes) {
      lastResult = _run(innerNode, scopes, context);

      if (
        lastResult instanceof RunResult.Return ||
        lastResult instanceof RunResult.Error
      ) {
        return lastResult;
      }
    }

    return lastResult;
  }

  if (node instanceof SyntaxNode.ReturnStatement) {
    const result = _run(node.expr, scopes);
    if (result instanceof RunResult.Error) {
      return result;
    }

    return result.asReturn();
  }

  if (node instanceof SyntaxNode.LetStatement) {
    if (isDefined(scopes, null, node.identifier)) {
      return new RunResult.Error("dis already defined suka");
    }

    const scope = scopes.at(-1)!;

    scope[node.identifier.name] = null;

    return _run(node.expr, scopes);
  }

  if (node instanceof SyntaxNode.FunctionCall) {
    const fnRefResult = _run(node.ref, scopes, context);
    if (fnRefResult instanceof RunResult.Error) {
      return fnRefResult;
    }

    const fn = fnRefResult.value;

    if (typeof fn != "function") {
      console.log(node.ref, scopes, context);
      return new RunResult.Error("blyat, dis not a func");
    }

    const params = [];
    for (let i = 0; i < node.params.length; i++) {
      const paramResult = _run(node.params[i], scopes);
      if (paramResult instanceof RunResult.Error) {
        return paramResult;
      }

      params[i] = paramResult.value;
    }

    const fnResult = fn.call(context, ...params) as RunResult;
    if (fnResult instanceof RunResult.Error) {
      return fnResult;
    }

    return new RunResult.Expr(fnResult.value);
  }

  if (node instanceof SyntaxNode.StrLiteral) {
    return new RunResult.Expr(node.value);
  }

  if (node instanceof SyntaxNode.NumbLiteral) {
    return new RunResult.Expr(node.value);
  }

  if (node instanceof SyntaxNode.BinaryOperation) {
    if (node.opr === ".") {
      let leftExprResult = _run(node.leftExpr, scopes, context);
      if (leftExprResult instanceof RunResult.Error) {
        return leftExprResult;
      }

      const object = leftExprResult.value;

      return _run(node.rightExpr, scopes, object);
    }

    if (node.opr === "+") {
      const leftValue = _run(node.leftExpr, scopes);
      if (leftValue instanceof RunResult.Error) {
        return leftValue;
      }

      const rightValue = _run(node.rightExpr, scopes);
      if (rightValue instanceof RunResult.Error) {
        return leftValue;
      }

      return new RunResult.Expr(leftValue.value + rightValue.value);
    }

    if (node.opr === "=") {
      const identifier = node.leftExpr as SyntaxNode.Identifier;

      if (context == null && !isDefined(scopes, null, identifier)) {
        return new RunResult.Error(
          `Suka, dis '${identifier.name}' don defined blyat!`
        );
      }

      const scope = findIdentifierScope(scopes, context, identifier)!;

      const result = _run(node.rightExpr, scopes);
      if (result instanceof RunResult.Error) {
        return result;
      }

      scope[identifier.name] = result.value;

      return result.value;
    }
  }

  if (node instanceof SyntaxNode.Identifier) {
    if (!isDefined(scopes, context, node)) {
      return new RunResult.Error(`Suka, dis '${node.name}' don defined blyat!`);
    }

    const value = findInScopes(scopes, context, node);

    return new RunResult.Expr(value);
  }

  if (node instanceof SyntaxNode.FunctionDefinition) {
    const scope = scopes.at(-1)!;

    scope[node.identifier.name] = function () {
      const functionScope: Scope = {};

      return _run(node.body, [...scopes, functionScope]);
    };
  }

  return new RunResult.Expr();
}

function findInScopes(
  scopes: Scope[],
  context: Scope | null,
  identifier: SyntaxNode.Identifier
) {
  const scope = findIdentifierScope(scopes, context, identifier);
  if (scope == null) {
    return null;
  }

  return scope[identifier.name];
}

function findIdentifierScope(
  scopes: Scope[],
  context: Scope | null,
  identifier: SyntaxNode.Identifier
): Scope | null {
  if (context != null) {
    return context ?? null;
  }

  for (let i = 0; i < scopes.length; i++) {
    const scope = scopes.at(-i - 1)!;
    if (identifier.name in scope) {
      return scope;
    }
  }

  return null;
}

function isDefined(
  scopes: Scope[],
  context: Scope | null,
  identifier: SyntaxNode.Identifier
): boolean {
  const scope = findIdentifierScope(scopes, context, identifier);

  return scope != null;
}

const runner = {
  run,
};

export default runner;
