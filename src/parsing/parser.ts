import { SyntaxNode } from "./syntax-node";
import { Token } from "./token";
import { TokenConstructor } from "./token-analyser-core";

export interface Range {
  start: number;
  end: number;
}

function Range(start = 0, end = -1): Range {
  return { start, end };
}

function parse(tokens: Token[], range = Range()): SyntaxNode.NodeList {
  const tree = new SyntaxNode.NodeList([]);
  let lastNode = null;

  const start = range.start;

  let end = range.end;
  if (end < 0) {
    end = tokens.length + end + 1;
  } else if (end > tokens.length) {
    end = tokens.length;
  }

  for (let i = start; i < end; i++) {
    const token = tokens[i];

    if (token instanceof Token.Keyword && token.keyword === "function") {
      const identifierToken = assertToken(tokens, i + 1, Token.Identifier);
      assertToken(tokens, i + 2, Token.OpenParentheses);

      const paramsRange = seekParams(tokens, i + 2);

      assertToken(tokens, paramsRange.end, Token.OpenBraces);

      const bracesRange = seekBracesRange(tokens, paramsRange.end);

      lastNode = new SyntaxNode.FunctionDefinition(
        new SyntaxNode.Identifier(identifierToken.name),
        [],
        parse(tokens, bracesRange)
      );

      tree.nodes.push(lastNode);

      i = bracesRange.end;

      continue;
    }

    if (token instanceof Token.Keyword && token.keyword === "return") {
    }

    if (token)
      if (token instanceof Token.Identifier) {
        const nextToken: Token | undefined = tokens[i + 1];

        nextToken;

        if (nextToken != null && nextToken instanceof Token.Dot) {
          const propertyKeyToken = tokens[i + 2];
          if (!(propertyKeyToken instanceof Token.Identifier)) {
            throw new Error("parsing error");
          }

          const tokenAfterPropertyKey = tokens[i + 3];

          if (
            tokenAfterPropertyKey == null ||
            !(tokenAfterPropertyKey instanceof Token.OpenParentheses)
          ) {
            const expressionRange = seekExpressionRange(tokens, i + 2);
            lastNode = new SyntaxNode.PropertyDeref(
              new SyntaxNode.Identifier(token.name),
              parse(tokens, expressionRange)
            );

            tree.nodes.push(lastNode);
            i += 2;
            continue;
          }

          let params = [];
          const seekParamsResult = seekParams(tokens, i + 3);

          for (const range of seekParamsResult.ranges) {
            const node = parse(tokens, range);

            params.push(node);
          }

          lastNode = new SyntaxNode.MethodCall(
            new SyntaxNode.Identifier(token.name),
            new SyntaxNode.Identifier(propertyKeyToken.name),
            params
          );

          tree.nodes.push(lastNode);
          i = seekParamsResult.end;
          continue;
        }

        if (nextToken != null && nextToken instanceof Token.OpenParentheses) {
          let params = [];
          const seekParamsResult = seekParams(tokens, i + 1);

          for (const range of seekParamsResult.ranges) {
            const node = parse(tokens, range);

            params.push(node);
          }

          lastNode = new SyntaxNode.FunctionCall(
            new SyntaxNode.Identifier(token.name),
            params
          );

          tree.nodes.push(lastNode);
          i = seekParamsResult.end;
          continue;
        }

        lastNode = new SyntaxNode.Identifier(token.name);
        tree.nodes.push(lastNode);
        continue;
      }

    if (token instanceof Token.Str) {
      lastNode = new SyntaxNode.StrLiteral(token.text.slice(1, -1));
      tree.nodes.push(lastNode);
      continue;
    }

    if (token instanceof Token.Numb) {
      const num = parseNumber(token.text);
      lastNode = new SyntaxNode.NumbLiteral(num);
      tree.nodes.push(lastNode);
      continue;
    }

    if (token instanceof Token.Operator) {
      const leftExpr = tree.nodes.pop()!;
      const rightExprRange = seekExpressionRange(tokens, i + 1);
      const rightExpr = parse(tokens, rightExprRange);

      lastNode = new SyntaxNode.BinaryOperation("+", leftExpr, rightExpr);

      tree.nodes.push(lastNode);
      i = rightExprRange.end - 1;
      continue;
    }
  }

  return tree;
}

function seekParams(tokens: Token[], offset: number) {
  let opened = 1;
  let i = offset + 1;
  let paramStart = i;
  const ranges = [];

  while (true) {
    const token = tokens[i++];

    if (token == null) {
      throw new Error("parsing error");
    }

    if (token instanceof Token.OpenParentheses) {
      opened++;
      continue;
    }

    if (token instanceof Token.CloseParentheses) {
      opened--;

      if (opened === 0) {
        ranges.push(Range(paramStart, i - 1));
        paramStart = i;
        break;
      }

      continue;
    }

    if (opened === 1 && token instanceof Token.Colon) {
      ranges.push(Range(paramStart, i - 1));
      paramStart = i;
      continue;
    }
  }

  return { ranges, end: i };
}

function seekBracesRange(tokens: Token[], offset: number) {
  const start = offset;
  let opened = 0;

  do {
    const token = tokens[offset++];
    if (token instanceof Token.OpenBraces) {
      opened++;
    }

    if (token instanceof Token.CloseBraces) {
      opened--;
    }
  } while (opened > 0);

  return Range(start, offset - 1);
}

function seekExpressionRange(tokens: Token[], offset: number) {
  const start = offset;
  let openedParen = 0;

  while (true) {
    const token = tokens[offset++];
    if (token == null) {
      return Range(start, offset);
    }

    if (token instanceof Token.Semicolon || token instanceof Token.Colon) {
      return Range(start, offset);
    }

    if (token instanceof Token.Operator) {
      return Range(start, offset - 1);
    }

    if (token instanceof Token.OpenParentheses) {
      openedParen++;
    }

    if (token instanceof Token.CloseParentheses) {
      openedParen--;
      if (openedParen < 0) {
        return Range(start, offset - 1);
      }
    }
  }
}

function parseNumber(text: string) {
  const zeroCharCode = "0".charCodeAt(0);
  let num = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const digit = char.charCodeAt(0) - zeroCharCode;
    num += digit;

    if (i < text.length - 1) {
      num *= 10;
    }
  }

  return num;
}

function assertToken<T extends Token>(
  tokens: Token[],
  index: number,
  Constructor: TokenConstructor<T>
): T {
  const token = tokens[index];

  if (token instanceof Constructor === false) {
    throw new Error(
      `Expected a ${Constructor.getType()}, but recived a ${token.type}`
    );
  }

  return token;
}

const parser = {
  SyntaxNode,
  parse,
};

export default parser;
