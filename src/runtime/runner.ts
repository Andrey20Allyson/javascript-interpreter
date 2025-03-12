import { SyntaxNode } from "@parsing/syntax-node";

export type Scope = Record<string, any>;

const globalScope: Scope = {
  console,
};

export abstract class RunResult {
  constructor(readonly value: any = null) {}

  asReturn(): RunResult {
    return new RunResult.Return(this.value);
  }
}

export namespace RunResult {
  export class Expr extends RunResult {}
  export class Return extends RunResult {}
}

function run(
  node: SyntaxNode,
  scopes = [globalScope],
  context: Scope | null = null
): RunResult {
  if (node instanceof SyntaxNode.NodeList) {
    let lastResult = new RunResult.Expr();

    for (const innerNode of node.nodes) {
      lastResult = run(innerNode, scopes, context);

      if (lastResult instanceof RunResult.Return) {
        return lastResult;
      }
    }

    return lastResult;
  }

  if (node instanceof SyntaxNode.ReturnStatement) {
    return run(node.expr, scopes).asReturn();
  }

  if (node instanceof SyntaxNode.FunctionCall) {
    const fn = run(node.ref, scopes, context).value;

    if (typeof fn != "function") {
      throw new Error("blyat, dis not a func");
    }

    const params = [];
    for (let i = 0; i < node.params.length; i++) {
      params[i] = run(node.params[i], scopes).value;
    }

    return new RunResult.Expr(fn.call(context, ...params));
  }

  if (node instanceof SyntaxNode.StrLiteral) {
    return new RunResult.Expr(node.value);
  }

  if (node instanceof SyntaxNode.NumbLiteral) {
    return new RunResult.Expr(node.value);
  }

  if (node instanceof SyntaxNode.BinaryOperation) {
    if (node.opr === ".") {
      let object = run(node.leftExpr, scopes, context).value;

      return run(node.rightExpr, scopes, object);
    }

    if (node.opr === "+") {
      const leftValue = run(node.leftExpr, scopes);
      const rightValue = run(node.rightExpr, scopes);

      return new RunResult.Expr(leftValue.value + rightValue.value);
    }
  }

  if (node instanceof SyntaxNode.Identifier) {
    const found = findInScopes(scopes, context, node);

    return new RunResult.Expr(found);
  }

  if (node instanceof SyntaxNode.FunctionDefinition) {
    const scope = scopes.at(-1)!;

    scope[node.identifier.name] = function () {
      const functionScope: Scope = {};

      const result = run(node.body, [...scopes, functionScope]);

      if (result instanceof RunResult.Return) {
        return result.value;
      }
    };
  }

  return new RunResult.Expr();
}

function findInScopes(
  scopes: Scope[],
  context: Scope | null,
  identifier: SyntaxNode.Identifier
) {
  if (context != null) {
    return context[identifier.name] ?? null;
  }

  for (let i = 0; i < scopes.length; i++) {
    const scope = scopes.at(-i - 1)!;
    if (scope[identifier.name] != null) {
      return scope[identifier.name];
    }
  }

  return null;
}

const runner = {
  globalScope,
  run,
};

export default runner;
