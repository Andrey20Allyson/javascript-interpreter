import { Token } from "@lexical-analysis/token";
import {
  Expression,
  ParseContext,
  PrimaryExpressionParser,
} from "@parsing/parser-core";
import { SyntaxNode } from "@parsing/syntax-node";
import { seekGroupRange, seekParams } from "@utils/token-finder";

export class FunctionStatementParser extends PrimaryExpressionParser {
  canParse(context: ParseContext): boolean {
    return context.currentTokenIs(
      Token.Keyword,
      (token) => token.keyword === "function"
    );
  }

  parse(context: ParseContext): Expression {
    const identifierToken = context.getTokenWithOffset(1, Token.Identifier);

    context.getTokenWithOffset(2, Token.OpenParentheses);

    const paramsRange = seekParams(context.tokens, context.offset + 2);

    context.getToken(paramsRange.end, Token.OpenBraces);

    const functionBlockRange = seekGroupRange(
      context.tokens,
      paramsRange.end,
      "braces"
    );

    const node = new SyntaxNode.FunctionDefinition(
      new SyntaxNode.Identifier(identifierToken.name),
      [],
      this.parser.parse(context.reranged(functionBlockRange))
    );

    return new Expression(node, functionBlockRange.end);
  }
}
