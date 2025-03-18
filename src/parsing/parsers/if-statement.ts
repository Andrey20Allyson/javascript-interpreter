import { Token } from "@lexical-analysis/token";
import {
  Expression,
  ParseContext,
  PrimaryExpressionParser,
} from "@parsing/parser-core";
import { SyntaxNode } from "@parsing/syntax-node";
import { seekGroupRange } from "@utils/token-finder";

export class IfStatementParser extends PrimaryExpressionParser {
  canParse(context: ParseContext): boolean {
    return context.currentTokenIs(
      Token.Keyword,
      (token) => token.keyword === "if"
    );
  }

  parse(context: ParseContext): Expression {
    context.getTokenWithOffset(1, Token.OpenParentheses);

    const logicExpr = this.parser.parseExpression(context.moveBy(2));
    if (logicExpr == null) {
      throw new Error(`Expected a logic expression for if statement`);
    }

    context.getToken(logicExpr.lastTokenIndex + 1, Token.CloseParentheses);

    const ifBlockRange = seekGroupRange(
      context.tokens,
      logicExpr.lastTokenIndex + 2,
      "braces"
    );

    const node = new SyntaxNode.IfStatement(
      logicExpr.node,
      this.parser.parse(context.reranged(ifBlockRange))
    );

    return new Expression(node, ifBlockRange.end);
  }
}
