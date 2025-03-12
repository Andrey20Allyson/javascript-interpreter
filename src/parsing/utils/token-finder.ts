import { Token } from "@parsing/token";
import { TokenConstructor } from "@parsing/token-analyser-core";

export interface Range {
  start: number;
  end: number;
}

export function Range(start = 0, end = -1): Range {
  return { start, end };
}

export function seekParams(tokens: Token[], offset: number) {
  let opened = 1;
  let i = offset + 1;
  let paramStart = i;
  const ranges: Range[] = [];

  while (true) {
    const token = tokens[i++];

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

export type GroupType = "braces" | "parentheses";
export const groupTypeMap: Record<
  GroupType,
  [TokenConstructor, TokenConstructor]
> = {
  braces: [Token.OpenBraces, Token.CloseBraces],
  parentheses: [Token.OpenParentheses, Token.CloseParentheses],
};

export function seekGroupRange(
  tokens: Token[],
  offset: number,
  groupType: GroupType
): Range {
  const [OpenGroupTokenConstructor, CloseGroupTokenConstructor] =
    groupTypeMap[groupType];

  let opened = 0;

  const openIndex = offset;

  assertToken(tokens, openIndex, OpenGroupTokenConstructor);

  do {
    const token = tokens[offset++];

    if (token instanceof OpenGroupTokenConstructor) {
      opened++;
    }

    if (token instanceof CloseGroupTokenConstructor) {
      opened--;
    }
  } while (opened > 0);

  const closeIndex = offset - 1;

  assertToken(tokens, closeIndex, CloseGroupTokenConstructor);

  return Range(openIndex + 1, closeIndex);
}

export function assertToken<T extends Token>(
  tokens: Token[],
  index: number,
  Constructor: TokenConstructor<T>
): T {
  const token = tokens[index];

  if (token instanceof Constructor === false) {
    throw new Error(
      `Expected a ${Constructor.getType()}, but recived a ${token?.type}`
    );
  }

  return token;
}
