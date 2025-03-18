import { Token } from "@lexical-analysis/token";
import {
  Expression,
  ParseContext,
  PrimaryExpressionParser,
} from "@parsing/parser-core";
import { SyntaxNode } from "@parsing/syntax-node";

export class LetStatementParser extends PrimaryExpressionParser {
  canParse(context: ParseContext): boolean {
    const token = context.currentToken();

    return token instanceof Token.Keyword && token.keyword === "let";
  }

  parse(context: ParseContext): Expression {
    const token = context.currentToken(Token.Keyword);

    const identifier = context.getTokenWithOffset(1, Token.Identifier);

    const expression = this.parser.parseExpression(context.moveBy(1));

    if (expression == null) {
      throw new Error(`Expected a expression after '${token.type}'`);
    }

    const node = new SyntaxNode.LetStatement(
      new SyntaxNode.Identifier(identifier.name),
      expression.node
    );

    return new Expression(node, expression.lastTokenIndex);
  }
}
