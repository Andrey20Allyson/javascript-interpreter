import { Token } from "@lexical-analysis/token";
import { Result } from "@utils/result";
import { GroupType } from "@utils/token-finder";

interface GroupTypeAndIsOpening {
  type: GroupType;
  isOpening: boolean;
}

interface GroupStart {
  type: GroupType;
  startIndex: number;
}

export class TokenBoundaryMap {
  private constructor(private boundaries: Map<number, number>) {}

  /**
   *
   * @throws If index dont represent a group start
   */
  limitOf(index: number): number {
    const limit = this.boundaries.get(index);
    if (limit == null) {
      throw new Error(`token indexed in ${index} dont is a group openning`);
    }

    return limit;
  }

  private static getGroupTypeAndIsOpening(
    token: Token
  ): GroupTypeAndIsOpening | null {
    if (token instanceof Token.OpenBraces) {
      return { type: "braces", isOpening: true };
    }

    if (token instanceof Token.CloseBraces) {
      return { type: "braces", isOpening: false };
    }

    if (token instanceof Token.OpenParentheses) {
      return { type: "parentheses", isOpening: true };
    }

    if (token instanceof Token.CloseParentheses) {
      return { type: "parentheses", isOpening: false };
    }

    return null;
  }

  static from(tokens: Iterable<Token>): Result<TokenBoundaryMap> {
    const boundaries = new Map<number, number>();
    const stack: GroupStart[] = [];

    let index = -1;
    for (const token of tokens) {
      index++;

      const group = this.getGroupTypeAndIsOpening(token);
      if (group == null) {
        continue;
      }

      if (group.isOpening) {
        stack.push({ type: group.type, startIndex: index });
        continue;
      }

      const groupOpening = stack.pop();
      if (groupOpening == null) {
        return Result.err(`Can't close a ${group.type} before open`);
      }

      if (group.type !== groupOpening.type) {
        return Result.err(
          `Expected a closing of ${groupOpening.type}, recived a ${group.type}`
        );
      }

      boundaries.set(groupOpening.startIndex, index);
    }

    return Result.ok(new TokenBoundaryMap(boundaries));
  }
}
