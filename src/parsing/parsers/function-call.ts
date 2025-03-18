import { Token } from "@lexical-analysis/token";
import {
  Expression,
  OperationParser,
  ParseContext,
} from "@parsing/parser-core";
import { SyntaxNode } from "@parsing/syntax-node";
import { seekParams } from "@utils/token-finder";

export class FunctionCallParser extends OperationParser {
  canParse(context: ParseContext): boolean {
    return context.currentTokenIs(Token.OpenParentheses);
  }

  parse(context: ParseContext): Expression {
    let params = [];
    const seekParamsResult = seekParams(context.tokens, context.offset);

    for (const range of seekParamsResult.ranges) {
      const expression = this.parser.parseExpression(
        context.reranged(range).pointedTo(range.start)
      );

      if (expression == null) {
        continue;
      }

      params.push(expression.node);
    }

    const node = new SyntaxNode.FunctionCall(
      context.previousExpression!.node,
      params
    );

    const callExpression = {
      node,
      lastTokenIndex: seekParamsResult.end - 1,
    };

    return this.parser.parseOperation(
      context
        .pointedTo(callExpression.lastTokenIndex + 1)
        .precededByExpression(callExpression)
    );
  }
}
