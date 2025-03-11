import { SyntaxNode } from "@parsing/syntax-node";

export type Scope = Record<string, any>;

const globalScope: Scope = {
  console,
};

function run(node: SyntaxNode, scopes = [globalScope]): any {
  if (node instanceof SyntaxNode.NodeList) {
    let lastReturn = null;

    for (const innerNode of node.nodes) {
      lastReturn = run(innerNode, scopes);
    }

    return lastReturn;
  }

  if (node instanceof SyntaxNode.MethodCall) {
    const object = findInScopes(scopes, node.identifier);
    if (object == null) {
      throw new Error(
        `runtime error, "${node.identifier.name}" is not defined.`
      );
    }

    const params = [];
    for (let i = 0; i < node.params.length; i++) {
      params[i] = run(node.params[i], scopes);
    }

    return object[node.methodIdentifier.name](...params);
  }

  if (node instanceof SyntaxNode.FunctionCall) {
    const fn = findInScopes(scopes, node.identifier);

    const params = [];
    for (let i = 0; i < node.params.length; i++) {
      params[i] = run(node.params[i], scopes);
    }

    return fn(...params);
  }

  if (node instanceof SyntaxNode.StrLiteral) {
    return node.value;
  }

  if (node instanceof SyntaxNode.NumbLiteral) {
    return node.value;
  }

  if (node instanceof SyntaxNode.BinaryOperation) {
    if (node.opr === "+") {
      const leftValue = run(node.leftExpr, scopes);
      const rightValue = run(node.rightExpr, scopes);

      return leftValue + rightValue;
    }
  }
}

function findInScopes(scopes: Scope[], identifier: SyntaxNode.Identifier) {
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
