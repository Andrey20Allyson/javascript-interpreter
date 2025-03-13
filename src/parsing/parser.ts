import { SyntaxNode } from "./syntax-node";
import { Token } from "@lexical-analysis/token";
import { ArrayRangeAcessor } from "@utils/array";
import { parseNumber } from "@utils/number";
import { parseString } from "@utils/string";
import {
  assertToken,
  assertTokenOpt,
  seekGroupRange,
  seekParams,
} from "@utils/token-finder";

export class Parser {}

function parse(
  tokens: Token[] | ArrayRangeAcessor<Token>
): SyntaxNode.NodeList {
  if (tokens instanceof Array) {
    tokens = new ArrayRangeAcessor(tokens);
  }

  const tree = new SyntaxNode.NodeList([]);

  for (let i = tokens.range.start; i < tokens.range.end; i++) {
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
  tokens: ArrayRangeAcessor<Token>,
  offset: number
): ExpressionWithLastToken | null {
  const expression = parsePriparyExpression(tokens, offset);

  if (expression == null) {
    return null;
  }

  return parseOperation(tokens, expression.end + 1, expression);
}

function parsePriparyExpression(
  tokens: ArrayRangeAcessor<Token>,
  offset: number
): ExpressionWithLastToken | null {
  const token = tokens.at(offset);

  if (token === null) {
    return null;
  }

  if (token instanceof Token.Keyword && token.keyword === "function") {
    const identifierToken = assertToken(tokens, offset + 1, Token.Identifier);
    assertToken(tokens, offset + 2, Token.OpenParentheses);

    const paramsRange = seekParams(tokens, offset + 2);

    assertToken(tokens, paramsRange.end, Token.OpenBraces);

    const functionBlockRange = seekGroupRange(
      tokens,
      paramsRange.end,
      "braces"
    );

    const node = new SyntaxNode.FunctionDefinition(
      new SyntaxNode.Identifier(identifierToken.name),
      [],
      parse(tokens.rerange(functionBlockRange))
    );

    return { end: functionBlockRange.end, node };
  }

  if (token instanceof Token.Keyword && token.keyword === "return") {
    const returnExpr = parseExpression(tokens, offset + 1);

    const exprNode = returnExpr?.node ?? new SyntaxNode.NullLiteral();
    const exprEnd = returnExpr?.end ?? offset + 1;

    const node = new SyntaxNode.ReturnStatement(exprNode);

    return { node, end: exprEnd };
  }

  if (token instanceof Token.Keyword && token.keyword === "if") {
    assertToken(tokens, offset + 1, Token.OpenParentheses);

    const logicExpr = parseExpression(tokens, offset + 2);
    if (logicExpr == null) {
      throw new Error(`Expected a logic expression for '${token.type}'`);
    }

    assertToken(tokens, logicExpr.end + 1, Token.CloseParentheses);

    const ifBlockRange = seekGroupRange(tokens, logicExpr.end + 2, "braces");

    const node = new SyntaxNode.IfStatement(
      logicExpr.node,
      parse(tokens.rerange(ifBlockRange))
    );

    return { node, end: ifBlockRange.end };
  }

  if (token instanceof Token.Keyword && token.keyword === "let") {
    const identifier = assertToken(tokens, offset + 1, Token.Identifier);

    const expression = parseExpression(tokens, offset + 1);

    if (expression == null) {
      throw new Error(`Expected a expression after '${token.type}'`);
    }

    const node = new SyntaxNode.LetStatement(
      new SyntaxNode.Identifier(identifier.name),
      expression.node
    );

    return { node, end: expression.end };
  }

  if (token instanceof Token.Identifier) {
    const node = new SyntaxNode.Identifier(token.name);

    return { end: offset, node };
  }

  if (token instanceof Token.Str) {
    const str = parseString(token.text);
    const node = new SyntaxNode.StrLiteral(str);

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
  tokens: ArrayRangeAcessor<Token>,
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

    if (token.opr === "=") {
      leftExpr.node.as(SyntaxNode.Identifier);
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
      const expression = parseExpression(tokens.rerange(range), range.start);

      if (expression == null) {
        continue;
      }

      params.push(expression.node);
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
