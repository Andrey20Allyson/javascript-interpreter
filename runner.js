const parser = require("./parser");
const { SyntaxNode } = parser;

const globalScope = {
  console,
};

function run(node, scopes = [globalScope]) {
  if (node.isA(SyntaxNode.NodeList)) {
    let lastReturn = null;

    for (const innerNode of node.nodes) {
      lastReturn = run(innerNode, scopes);
    }

    return lastReturn;
  }

  if (node.isA(SyntaxNode.MethodCall)) {
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

  if (node.isA(SyntaxNode.FunctionCall)) {
    const fn = findInScopes(scopes, node.identifier);

    const params = [];
    for (let i = 0; i < node.params.length; i++) {
      params[i] = run(node.params[i], scopes);
    }

    return fn(...params);
  }

  if (node.isA(SyntaxNode.StrLiteral)) {
    return node.value;
  }

  if (node.isA(SyntaxNode.NumbLiteral)) {
    return node.value;
  }

  if (node.isA(SyntaxNode.BinaryOperation)) {
    if (node.opr === "+") {
      const leftValue = run(node.leftExpr, scopes);
      const rightValue = run(node.rightExpr, scopes);

      return leftValue + rightValue;
    }
  }
}

function findInScopes(scopes, identifier) {
  for (let i = 0; i < scopes.length; i++) {
    const scope = scopes.at(-i - 1);
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

module.exports = runner;
