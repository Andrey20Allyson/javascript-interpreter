import { Token } from "@lexical-analysis/token";
import {
  Expression,
  OperationParser,
  ParseContext,
} from "@parsing/parser-core";
import { SyntaxNode } from "@parsing/syntax-node";

export class BinaryOperatorParser extends OperationParser {
  canParse(context: ParseContext): boolean {
    return context.currentTokenIs(Token.BinaryOperator);
  }

  parse(context: ParseContext): Expression {
    const token = context.currentToken(Token.BinaryOperator);
    const prevExpression = context.previousExpression!;

    const leftExpr = prevExpression;
    const rightExpr = this.parser.parseExpression(
      context.pointedTo(prevExpression.lastTokenIndex + 2)
    );

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

    return new Expression(node, rightExpr.lastTokenIndex);
  }
}
