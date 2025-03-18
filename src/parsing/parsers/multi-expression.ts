import { Token } from "@lexical-analysis/token";
import {
  Expression,
  OperationParser,
  ParseContext,
} from "@parsing/parser-core";
import { SyntaxNode } from "@parsing/syntax-node";

export class MultiExpressionParser extends OperationParser {
  canParse(context: ParseContext): boolean {
    return context.currentTokenIs(Token.Comma);
  }

  parse(context: ParseContext): Expression {
    const expression = context.previousExpression!;
    const node = new SyntaxNode.NodeList([expression.node]);

    const nextExpr = this.parser.parseExpression(context.moveBy(1));

    if (nextExpr == null) {
      throw new Error("Expected a expression");
    }

    if (nextExpr.node instanceof SyntaxNode.NodeList) {
      node.nodes.push(...nextExpr.node.nodes);
    } else {
      node.nodes.push(nextExpr.node);
    }

    return new Expression(node, nextExpr.lastTokenIndex);
  }
}
