import { Token } from "@lexical-analysis/token";
import {
  Expression,
  ParseContext,
  PrimaryExpressionParser,
} from "@parsing/parser-core";
import { SyntaxNode } from "@parsing/syntax-node";

export class ReturnStatementParser extends PrimaryExpressionParser {
  canParse(context: ParseContext): boolean {
    return context.currentTokenIs(
      Token.Keyword,
      (token) => token.keyword === "return"
    );
  }

  parse(context: ParseContext): Expression {
    const returnExpr = this.parser.parseExpression(context.moveBy(1));

    const exprNode = returnExpr?.node ?? new SyntaxNode.NullLiteral();
    const exprEnd = returnExpr?.lastTokenIndex ?? context.offset + 1;

    const node = new SyntaxNode.ReturnStatement(exprNode);

    return new Expression(node, exprEnd);
  }
}
