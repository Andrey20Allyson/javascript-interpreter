import { Token } from "@lexical-analysis/token";
import { TokenConstructor } from "@lexical-analysis/token-analyser-core";
import { ArrayAccessor, Range } from "./array";

export function seekParams(tokens: ArrayAccessor<Token>, offset: number) {
  let opened = 1;
  let i = offset + 1;
  let paramStart = i;
  const ranges: Range[] = [];

  while (true) {
    const token = tokens.at(i++);

    if (token == null) {
      throw new Error(`parsing error ${offset} - ${i - 1}`);
    }

    if (token instanceof Token.OpenParentheses) {
      opened++;
      continue;
    }

    if (token instanceof Token.CloseParentheses) {
      opened--;

      if (opened === 0) {
        ranges.push(new Range(paramStart, i - 1));
        paramStart = i;
        break;
      }

      continue;
    }

    if (opened === 1 && token instanceof Token.Comma) {
      ranges.push(new Range(paramStart, i - 1));
      paramStart = i;
      continue;
    }
  }

  return { ranges, end: i };
}

export type GroupType = "braces" | "parentheses";
export const groupTypeMap: Record<
  GroupType,
  [TokenConstructor, TokenConstructor]
> = {
  braces: [Token.OpenBraces, Token.CloseBraces],
  parentheses: [Token.OpenParentheses, Token.CloseParentheses],
};

export function seekGroupRange(
  tokens: ArrayAccessor<Token>,
  offset: number,
  groupType: GroupType
): Range {
  const [OpenGroupTokenConstructor, CloseGroupTokenConstructor] =
    groupTypeMap[groupType];

  let opened = 0;

  const openIndex = offset;

  assertToken(tokens, openIndex, OpenGroupTokenConstructor);

  do {
    const token = tokens.at(offset++);

    if (token instanceof OpenGroupTokenConstructor) {
      opened++;
    }

    if (token instanceof CloseGroupTokenConstructor) {
      opened--;
    }
  } while (opened > 0);

  const closeIndex = offset - 1;

  assertToken(tokens, closeIndex, CloseGroupTokenConstructor);

  return new Range(openIndex + 1, closeIndex);
}

export function assertToken<T extends Token>(
  tokens: ArrayAccessor<Token>,
  index: number,
  Constructor: TokenConstructor<T>
): T {
  const token = tokens.at(index);

  if (token instanceof Constructor === false) {
    throw new Error(
      `Expected a ${Constructor.getType()}, but recived a ${token?.type}`
    );
  }

  return token;
}

export function assertTokenOpt<T extends Token>(
  tokens: ArrayAccessor<Token>,
  index: number,
  Constructor: TokenConstructor<T>
): T | null {
  const token = tokens.at(index);

  if (token instanceof Constructor === false) {
    return null;
  }

  return token;
}
