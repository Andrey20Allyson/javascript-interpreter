import { SyntaxNode } from "./syntax-node";
import { Token } from "./token";
import { parseNumber } from "./utils/number";
import {
  assertToken,
  Range,
  seekGroupRange,
  seekParams,
} from "./utils/token-finder";

function parse(tokens: Token[], range = Range()): SyntaxNode.NodeList {
  const tree = new SyntaxNode.NodeList([]);

  const start = range.start;

  let end = range.end;
  if (end < 0) {
    end = tokens.length + end + 1;
  } else if (end > tokens.length) {
    end = tokens.length;
  }

  for (let i = start; i < end; i++) {
    const expression = parseExpression(tokens, i);

    if (expression == null) {
      continue;
    }

    tree.nodes.push(expression.node);
    i = expression.end;
  }

  return tree;
}

type ExpressionWithLastToken = {
  node: SyntaxNode;
  end: number;
};

function parseExpression(
  tokens: Token[],
  offset: number
): ExpressionWithLastToken | null {
  const expression = parsePriparyExpression(tokens, offset);

  if (expression == null) {
    return null;
  }

  return parseOperation(tokens, offset + 1, expression);
}

function parsePriparyExpression(
  tokens: Token[],
  offset: number
): ExpressionWithLastToken | null {
  const token = tokens[offset];

  if (token === null) {
    return null;
  }

  if (token instanceof Token.Keyword && token.keyword === "function") {
    const identifierToken = assertToken(tokens, offset + 1, Token.Identifier);
    assertToken(tokens, offset + 2, Token.OpenParentheses);

    const paramsRange = seekParams(tokens, offset + 2);

    assertToken(tokens, paramsRange.end, Token.OpenBraces);

    const bracesRange = seekGroupRange(tokens, paramsRange.end, "braces");

    const node = new SyntaxNode.FunctionDefinition(
      new SyntaxNode.Identifier(identifierToken.name),
      [],
      parse(tokens, bracesRange)
    );

    return { end: bracesRange.end, node };
  }

  if (token instanceof Token.Keyword && token.keyword === "return") {
    const returnExpr = parseExpression(tokens, offset + 1);

    const exprNode = returnExpr?.node ?? new SyntaxNode.NullLiteral();
    const exprEnd = returnExpr?.end ?? offset + 1;

    const node = new SyntaxNode.ReturnStatement(exprNode);

    return { node, end: exprEnd };
  }

  if (token instanceof Token.Identifier) {
    const node = new SyntaxNode.Identifier(token.name);

    return { end: offset, node };
  }

  if (token instanceof Token.Str) {
    const node = new SyntaxNode.StrLiteral(token.text.slice(1, -1));

    return { end: offset, node };
  }

  if (token instanceof Token.Numb) {
    const num = parseNumber(token.text);
    const node = new SyntaxNode.NumbLiteral(num);

    return { end: offset, node };
  }

  return null;
}

function parseOperation(
  tokens: Token[],
  offset: number,
  expression: ExpressionWithLastToken
): ExpressionWithLastToken {
  const token = tokens.at(offset);

  if (token == null) {
    return expression;
  }

  if (token instanceof Token.BinaryOperator) {
    const leftExpr = expression;
    const rightExpr = parseExpression(tokens, expression.end + 2);

    if (rightExpr === null) {
      throw new Error(`Expected a expression after '${token.opr}'`);
    }

    const node = new SyntaxNode.BinaryOperation(
      token.opr,
      leftExpr.node,
      rightExpr.node
    );

    return { node, end: rightExpr.end };
  }

  if (token instanceof Token.OpenParentheses) {
    let params = [];
    const seekParamsResult = seekParams(tokens, offset);

    for (const range of seekParamsResult.ranges) {
      const node = parse(tokens, range);

      params.push(node);
    }

    const node = new SyntaxNode.FunctionCall(expression.node, params);

    expression = {
      node,
      end: seekParamsResult.end - 1,
    };

    return parseOperation(tokens, expression.end + 1, expression);
  }

  if (token instanceof Token.Colon) {
    const node = new SyntaxNode.NodeList([expression.node]);

    const nextExpr = parseExpression(tokens, expression.end + 2);

    if (nextExpr == null) {
      throw new Error("Expected a expression");
    }

    if (nextExpr.node instanceof SyntaxNode.NodeList) {
      node.nodes.push(...nextExpr.node.nodes);
    } else {
      node.nodes.push(nextExpr.node);
    }

    return { node, end: nextExpr.end };
  }

  return expression;
}

const parser = {
  SyntaxNode,
  parse,
};

export default parser;
