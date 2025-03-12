import { SyntaxNode } from "./syntax-node";
import { Token } from "./token";
import { TokenConstructor } from "./token-analyser-core";

export interface Range {
  start: number;
  end: number;
}

function Range(start = 0, end = -1): Range {
  return { start, end };
}

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
    const expr = parseExpression(tokens, i);

    if (expr == null) {
      continue;
    }

    const { node, end: newOffset } = expr;

    tree.nodes.push(node);
    i = newOffset;
  }

  return tree;
}

type ParseExpressionResult = {
  node: SyntaxNode;
  end: number;
};

function parseExpression(
  tokens: Token[],
  offset: number
): ParseExpressionResult | null {
  const token = tokens[offset];

  let expression: ParseExpressionResult | null = null;

  do {
    if (token instanceof Token.Keyword && token.keyword === "function") {
      const identifierToken = assertToken(tokens, offset + 1, Token.Identifier);
      assertToken(tokens, offset + 2, Token.OpenParentheses);

      const paramsRange = seekParams(tokens, offset + 2);

      assertToken(tokens, paramsRange.end, Token.OpenBraces);

      const bracesRange = seekBracesRange(tokens, paramsRange.end);

      const node = new SyntaxNode.FunctionDefinition(
        new SyntaxNode.Identifier(identifierToken.name),
        [],
        parse(tokens, bracesRange)
      );

      expression = { end: bracesRange.end, node };
      break;
    }

    if (token instanceof Token.Keyword && token.keyword === "return") {
      const returnExpr = parseExpression(tokens, offset + 1);

      const exprNode = returnExpr?.node ?? new SyntaxNode.NullLiteral();
      const exprEnd = returnExpr?.end ?? offset + 1;

      const node = new SyntaxNode.ReturnStatement(exprNode);

      expression = { node, end: exprEnd };
      break;
    }

    if (token instanceof Token.Identifier) {
      const nextToken: Token | undefined = tokens[offset + 1];

      const node = new SyntaxNode.Identifier(token.name);

      expression = { end: offset, node };
      break;
    }

    if (token instanceof Token.Str) {
      const node = new SyntaxNode.StrLiteral(token.text.slice(1, -1));

      expression = { end: offset, node };
      break;
    }

    if (token instanceof Token.Numb) {
      const num = parseNumber(token.text);
      const node = new SyntaxNode.NumbLiteral(num);

      expression = { end: offset, node };
      break;
    }
  } while (false);

  if (expression == null) {
    return null;
  }

  const tokenNextExpression = tokens[expression.end + 1];

  if (
    tokenNextExpression != null &&
    tokenNextExpression instanceof Token.BinaryOperator
  ) {
    const leftExpr = expression;
    const rightExpr = parseExpression(tokens, expression.end + 2);

    if (rightExpr === null) {
      throw new Error(
        `Expected a expression after '${tokenNextExpression.opr}'`
      );
    }

    const node = new SyntaxNode.BinaryOperation(
      tokenNextExpression.opr,
      leftExpr.node,
      rightExpr.node
    );

    expression = { node, end: rightExpr.end };
  }

  if (
    tokenNextExpression != null &&
    tokenNextExpression instanceof Token.OpenParentheses
  ) {
    let params = [];
    const seekParamsResult = seekParams(tokens, offset + 1);

    for (const range of seekParamsResult.ranges) {
      const node = parse(tokens, range);

      params.push(node);
    }

    const node = new SyntaxNode.FunctionCall(expression.node, params);

    offset = seekParamsResult.end - 1;
    expression = { end: offset, node };
  }

  if (
    tokenNextExpression != null &&
    tokenNextExpression instanceof Token.Colon
  ) {
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

    expression = { node, end: nextExpr.end };
  }

  return expression;
}

function seekParams(tokens: Token[], offset: number) {
  let opened = 1;
  let i = offset + 1;
  let paramStart = i;
  const ranges = [];

  while (true) {
    const token = tokens[i++];

    if (token == null) {
      throw new Error("parsing error");
    }

    if (token instanceof Token.OpenParentheses) {
      opened++;
      continue;
    }

    if (token instanceof Token.CloseParentheses) {
      opened--;

      if (opened === 0) {
        ranges.push(Range(paramStart, i - 1));
        paramStart = i;
        break;
      }

      continue;
    }

    if (opened === 1 && token instanceof Token.Colon) {
      ranges.push(Range(paramStart, i - 1));
      paramStart = i;
      continue;
    }
  }

  return { ranges, end: i };
}

function seekBracesRange(tokens: Token[], offset: number) {
  const start = offset;
  let opened = 0;

  do {
    const token = tokens[offset++];
    if (token instanceof Token.OpenBraces) {
      opened++;
    }

    if (token instanceof Token.CloseBraces) {
      opened--;
    }
  } while (opened > 0);

  return Range(start, offset - 1);
}

function parseNumber(text: string) {
  const zeroCharCode = "0".charCodeAt(0);
  let num = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const digit = char.charCodeAt(0) - zeroCharCode;
    num += digit;

    if (i < text.length - 1) {
      num *= 10;
    }
  }

  return num;
}

function assertToken<T extends Token>(
  tokens: Token[],
  index: number,
  Constructor: TokenConstructor<T>
): T {
  const token = tokens[index];

  if (token instanceof Constructor === false) {
    throw new Error(
      `Expected a ${Constructor.getType()}, but recived a ${token.type}`
    );
  }

  return token;
}

const parser = {
  SyntaxNode,
  parse,
};

export default parser;
