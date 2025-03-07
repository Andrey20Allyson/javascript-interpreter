const lexer = require("./lexer");
const { Token } = lexer;

function createSyntaxNodeFactory(type, ...valueKeys) {
  function factory(...args) {
    const token = {
      type,
      factory,
      isA(factory) {
        return token.factory === factory;
      },
    };

    for (let i = 0; i < valueKeys.length; i++) {
      token[valueKeys[i]] = args[i];
    }

    return token;
  }

  return factory;
}

function Range(start = 0, end = -1) {
  return { start, end };
}

const SyntaxNode = {
  NodeList: createSyntaxNodeFactory("NodeList", "nodes"),
  Identifier: createSyntaxNodeFactory("Identifier", "name"),
  PropertyDeref: createSyntaxNodeFactory(
    "Property Deref",
    "identifier",
    "property"
  ),
  MethodCall: createSyntaxNodeFactory(
    "Method Call",
    "identifier",
    "methodIdentifier",
    "params"
  ),
  FunctionCall: createSyntaxNodeFactory(
    "Function Call",
    "identifier",
    "params"
  ),
  StrLiteral: createSyntaxNodeFactory("String Literal", "value"),
  NumbLiteral: createSyntaxNodeFactory("Number Literal", "value"),
  BinaryOperation: createSyntaxNodeFactory(
    "Binary Operation",
    "opr",
    "leftExpr",
    "rightExpr"
  ),
};

function parse(tokens, range = Range()) {
  const tree = SyntaxNode.NodeList([]);
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

    if (token.isA(Token.Identifier)) {
      const nextToken = tokens[i + 1];

      if (nextToken != null && nextToken.isA(Token.Dot)) {
        const propertyKeyToken = tokens[i + 2];
        if (!propertyKeyToken.isA(Token.Identifier)) {
          throw new Error("parsing error");
        }

        const tokenAfterPropertyKey = tokens[i + 3];

        if (
          tokenAfterPropertyKey == null ||
          !tokenAfterPropertyKey.isA(Token.OpenParentheses)
        ) {
          const expressionRange = seekExpressionRange(tokens, i + 2);
          lastNode = SyntaxNode.PropertyDeref(
            SyntaxNode.Identifier(token.name),
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

        lastNode = SyntaxNode.MethodCall(
          SyntaxNode.Identifier(token.name),
          SyntaxNode.Identifier(propertyKeyToken.name),
          params
        );

        tree.nodes.push(lastNode);
        i = seekParamsResult.end;
        continue;
      }

      if (nextToken != null && nextToken.isA(Token.OpenParentheses)) {
        let params = [];
        const seekParamsResult = seekParams(tokens, i + 1);

        for (const range of seekParamsResult.ranges) {
          const node = parse(tokens, range);

          params.push(node);
        }

        lastNode = SyntaxNode.FunctionCall(
          SyntaxNode.Identifier(token.name),
          params
        );

        tree.nodes.push(lastNode);
        i = seekParamsResult.end;
        continue;
      }

      lastNode = SyntaxNode.Identifier(token.name);
      tree.nodes.push(lastNode);
      continue;
    }

    if (token.isA(Token.Str)) {
      lastNode = SyntaxNode.StrLiteral(token.text.slice(1, -1));
      tree.nodes.push(lastNode);
      continue;
    }

    if (token.isA(Token.Numb)) {
      const num = parseNumber(token.text);
      lastNode = SyntaxNode.NumbLiteral(num);
      tree.nodes.push(lastNode);
      continue;
    }

    if (token.isA(Token.Operator)) {
      const leftExpr = tree.nodes.pop();
      const rightExprRange = seekExpressionRange(tokens, i + 1);
      const rightExpr = parse(tokens, rightExprRange);

      lastNode = SyntaxNode.BinaryOperation("+", leftExpr, rightExpr);

      tree.nodes.push(lastNode);
      i = rightExprRange.end - 1;
      continue;
    }
  }

  return tree;
}

function seekParams(tokens, offset) {
  let opened = 1;
  let i = offset + 1;
  let paramStart = i;
  const ranges = [];

  while (true) {
    const token = tokens[i++];

    if (token == null) {
      throw new Error("parsing error");
    }

    if (token.isA(Token.OpenParentheses)) {
      opened++;
      continue;
    }

    if (token.isA(Token.CloseParentheses)) {
      opened--;

      if (opened === 0) {
        ranges.push(Range(paramStart, i - 1));
        paramStart = i;
        break;
      }

      continue;
    }

    if (opened === 1 && token.isA(Token.Colon)) {
      ranges.push(Range(paramStart, i - 1));
      paramStart = i;
      continue;
    }
  }

  return { ranges, end: i };
}

function seekExpressionRange(tokens, offset) {
  const start = offset;
  let openedParen = 0;

  while (true) {
    const token = tokens[offset++];
    if (token == null) {
      return Range(start, offset);
    }

    if (token.isA(Token.Semicolon) || token.isA(Token.Colon)) {
      return Range(start, offset);
    }

    if (token.isA(Token.Operator)) {
      return Range(start, offset - 1);
    }

    if (token.isA(Token.OpenParentheses)) {
      openedParen++;
    }

    if (token.isA(Token.CloseParentheses)) {
      openedParen--;
      if (openedParen < 0) {
        return Range(start, offset - 1);
      }
    }
  }
}

function parseNumber(text) {
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

const parser = {
  SyntaxNode,
  parse,
};

module.exports = parser;
