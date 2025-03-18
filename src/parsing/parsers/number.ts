import { Token } from "@lexical-analysis/token";
import {
  Expression,
  ParseContext,
  PrimaryExpressionParser,
} from "@parsing/parser-core";
import { SyntaxNode } from "@parsing/syntax-node";
import { parseNumber } from "@utils/number";

export class NumberLiteralParser extends PrimaryExpressionParser {
  canParse(context: ParseContext): boolean {
    return context.currentTokenIs(Token.Numb);
  }

  parse(context: ParseContext): Expression {
    const token = context.getTokenWithOffset(0, Token.Numb);

    const num = parseNumber(token.text);
    const node = new SyntaxNode.NumbLiteral(num);

    return new Expression(node, context.offset);
  }
}
