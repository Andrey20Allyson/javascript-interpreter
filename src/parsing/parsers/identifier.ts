import { Token } from "@lexical-analysis/token";
import {
  Expression,
  ParseContext,
  PrimaryExpressionParser,
} from "@parsing/parser-core";
import { SyntaxNode } from "@parsing/syntax-node";

export class IdentifierParser extends PrimaryExpressionParser {
  canParse(context: ParseContext): boolean {
    return context.currentTokenIs(Token.Identifier);
  }

  parse(context: ParseContext): Expression {
    const token = context.currentToken(Token.Identifier);

    const node = new SyntaxNode.Identifier(token.name);

    return new Expression(node, context.offset);
  }
}
