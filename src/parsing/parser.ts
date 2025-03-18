import { Token } from "@lexical-analysis/token";
import { ArrayRangeAccessor } from "@utils/array";
import { parseNumber } from "@utils/number";
import { parseString } from "@utils/string";
import { assertToken, seekGroupRange, seekParams } from "@utils/token-finder";
import {
  Expression,
  ExpressionParser,
  OperationParser,
  ParseContext,
  PrimaryExpressionParser,
} from "./parser-core";
import { SyntaxNode } from "./syntax-node";

export class Parser {
  private _operationsParsers: OperationParser[] = [];
  private _primaryExpressionsParsers: PrimaryExpressionParser[] = [];

  constructor() {}

  parse(context: ParseContext): SyntaxNode {
    const tokens = context.tokens;
    const tree = new SyntaxNode.NodeList([]);

    for (let i = tokens.range.start; i < tokens.range.end; i++) {
      const expression = this.parseExpression(context.pointedTo(i));

      if (expression == null) {
        continue;
      }

      tree.nodes.push(expression.node);
      i = expression.lastTokenIndex;
    }

    return tree;
  }

  parseExpression(context: ParseContext) {
    const expression = this.parsePrimaryExpression(context);

    if (expression == null) {
      return null;
    }

    return this.parseOperation(
      context
        .pointedTo(expression.lastTokenIndex + 1)
        .precededByExpression(expression)
    );
  }

  parsePrimaryExpression(context: ParseContext): Expression | null {
    let parser = this._primaryExpressionsParsers.find((parser) =>
      parser.canParse(context)
    );

    if (parser == null) {
      return null;
    }

    return parser.parse(context);
  }

  parseOperation(context: ParseContext): Expression {
    let parser = this._operationsParsers.find((parser) =>
      parser.canParse(context)
    );

    if (parser == null) {
      return context.previousExpression!;
    }

    return parser.parse(context);
  }

  plug(...parsers: ExpressionParser[]) {
    for (const parser of parsers) {
      this._plugSingle(parser);
    }
  }

  private _plugSingle(parser: ExpressionParser) {
    parser.parser = this;

    if (parser instanceof PrimaryExpressionParser) {
      this._primaryExpressionsParsers.push(parser);
    }

    if (parser instanceof OperationParser) {
      this._operationsParsers.push(parser);
    }
  }
}

function parse(
  tokens: Token[] | ArrayRangeAccessor<Token>
): SyntaxNode.NodeList {
  if (tokens instanceof Array) {
    tokens = new ArrayRangeAccessor(tokens);
  }

  const tree = new SyntaxNode.NodeList([]);

  for (let i = tokens.range.start; i < tokens.range.end; i++) {
    const expression = parseExpression(tokens, i);

    if (expression == null) {
      continue;
    }

    tree.nodes.push(expression.node);
    i = expression.lastTokenIndex;
  }

  return tree;
}

function parseExpression(
  tokens: ArrayRangeAccessor<Token>,
  offset: number
): Expression | null {
  const expression = parsePriparyExpression(tokens, offset);

  if (expression == null) {
    return null;
  }

  return parseOperation(tokens, expression.lastTokenIndex + 1, expression);
}

function parsePriparyExpression(
  tokens: ArrayRangeAccessor<Token>,
  offset: number
): Expression | null {
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

    return { lastTokenIndex: functionBlockRange.end, node };
  }

  if (token instanceof Token.Keyword && token.keyword === "return") {
    const returnExpr = parseExpression(tokens, offset + 1);

    const exprNode = returnExpr?.node ?? new SyntaxNode.NullLiteral();
    const exprEnd = returnExpr?.lastTokenIndex ?? offset + 1;

    const node = new SyntaxNode.ReturnStatement(exprNode);

    return { node, lastTokenIndex: exprEnd };
  }

  if (token instanceof Token.Keyword && token.keyword === "if") {
    assertToken(tokens, offset + 1, Token.OpenParentheses);

    const logicExpr = parseExpression(tokens, offset + 2);
    if (logicExpr == null) {
      throw new Error(`Expected a logic expression for '${token.type}'`);
    }

    assertToken(tokens, logicExpr.lastTokenIndex + 1, Token.CloseParentheses);

    const ifBlockRange = seekGroupRange(
      tokens,
      logicExpr.lastTokenIndex + 2,
      "braces"
    );

    const node = new SyntaxNode.IfStatement(
      logicExpr.node,
      parse(tokens.rerange(ifBlockRange))
    );

    return { node, lastTokenIndex: ifBlockRange.end };
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

    return { node, lastTokenIndex: expression.lastTokenIndex };
  }

  if (token instanceof Token.Identifier) {
    const node = new SyntaxNode.Identifier(token.name);

    return { lastTokenIndex: offset, node };
  }

  if (token instanceof Token.Str) {
    const str = parseString(token.text);
    const node = new SyntaxNode.StrLiteral(str);

    return { lastTokenIndex: offset, node };
  }

  if (token instanceof Token.Numb) {
    const num = parseNumber(token.text);
    const node = new SyntaxNode.NumbLiteral(num);

    return { lastTokenIndex: offset, node };
  }

  return null;
}

function parseOperation(
  tokens: ArrayRangeAccessor<Token>,
  offset: number,
  expression: Expression
): Expression {
  const token = tokens.at(offset);

  if (token == null) {
    return expression;
  }

  if (token instanceof Token.BinaryOperator) {
    const leftExpr = expression;
    const rightExpr = parseExpression(tokens, expression.lastTokenIndex + 2);

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

    return { node, lastTokenIndex: rightExpr.lastTokenIndex };
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
      lastTokenIndex: seekParamsResult.end - 1,
    };

    return parseOperation(tokens, expression.lastTokenIndex + 1, expression);
  }

  if (token instanceof Token.Comma) {
    const node = new SyntaxNode.NodeList([expression.node]);

    const nextExpr = parseExpression(tokens, expression.lastTokenIndex + 2);

    if (nextExpr == null) {
      throw new Error("Expected a expression");
    }

    if (nextExpr.node instanceof SyntaxNode.NodeList) {
      node.nodes.push(...nextExpr.node.nodes);
    } else {
      node.nodes.push(nextExpr.node);
    }

    return { node, lastTokenIndex: nextExpr.lastTokenIndex };
  }

  return expression;
}
