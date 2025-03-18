import { Token } from "@lexical-analysis/token";
import {
  Expression,
  ParseContext,
  PrimaryExpressionParser,
} from "@parsing/parser-core";
import { SyntaxNode } from "@parsing/syntax-node";

export class ObjectLiteralParser extends PrimaryExpressionParser {
  canParse(context: ParseContext): boolean {
    return context.currentTokenIs(Token.OpenBraces);
  }

  parse(context: ParseContext): Expression {
    const limit = context.boundaries.limitOf(context.offset);

    const node = new SyntaxNode.ObjectLiteral([]);

    return new Expression(node, limit);
  }

  propertiesOffsets(context: ParseContext, limit: number): number[] {
    if (context.offset + 1 >= limit) {
      return [];
    }

    let level = 0;
    const offsets: number[] = [context.offset];

    for (let i = context.offset; i < limit; i++) {
      const token = context.getToken(i);

      if (token == null) {
        break;
      }

      if (token instanceof Token.OpenOfBrackets) {
        level++;
      }

      if (token instanceof Token.CloseOfBrackets) {
        level--;
      }
    }

    return offsets;
  }
}
