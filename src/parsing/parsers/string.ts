import { Token } from "@lexical-analysis/token";
import {
  Expression,
  ParseContext,
  PrimaryExpressionParser,
} from "@parsing/parser-core";
import { SyntaxNode } from "@parsing/syntax-node";
import { parseString } from "@utils/string";

export class StringLiteralParser extends PrimaryExpressionParser {
  canParse(context: ParseContext): boolean {
    return context.currentTokenIs(Token.Str);
  }

  parse(context: ParseContext): Expression {
    const token = context.getTokenWithOffset(0, Token.Str);

    const str = parseString(token.text);
    const node = new SyntaxNode.StrLiteral(str);

    return new Expression(node, context.offset);
  }
}
