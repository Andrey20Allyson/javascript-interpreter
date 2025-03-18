import { Token } from "@lexical-analysis/token";
import { type Parser } from "./parser";
import { type SyntaxNode } from "./syntax-node";
import { ArrayRangeAccessor, Range } from "@utils/array";
import { TokenBoundaryMap } from "./token-boundary-map";
import { TokenConstructor } from "@lexical-analysis/token-analyser-core";
import { Result } from "@utils/result";

export class Expression {
  constructor(readonly node: SyntaxNode, readonly lastTokenIndex: number) {}
}

export class ParseContext {
  constructor(
    readonly tokens: ArrayRangeAccessor<Token>,
    readonly boundaries: TokenBoundaryMap,
    readonly offset: number,
    readonly previousExpression: Expression | null
  ) {}

  currentToken(): Token | null;
  currentToken<T extends Token>(constructor: TokenConstructor<T>): T;
  currentToken(constructor?: TokenConstructor): Token | null {
    return this.getTokenWithOffset(0, constructor);
  }

  getToken(index: number): Token | null;
  getToken<T extends Token>(
    index: number,
    constructor?: TokenConstructor<T>
  ): T;
  getToken(index: number, constructor?: TokenConstructor): Token | null {
    const token = this.tokens.at(index);

    if (constructor != null) {
      if (token instanceof constructor === false) {
        const tokenOpt = token as Token | undefined;

        throw new Error(
          `Expected a ${constructor.getType()}, but recived a ${tokenOpt?.type}`
        );
      }

      return token;
    }

    return token ?? null;
  }

  getTokenWithOffset(offset: number): Token | null;
  getTokenWithOffset<T extends Token>(
    offset: number,
    constructor?: TokenConstructor<T>
  ): T;
  getTokenWithOffset(offset: number, constructor?: TokenConstructor) {
    return this.getToken(this.offset + offset, constructor);
  }

  currentTokenIs<T extends Token>(
    constructor: TokenConstructor<T>,
    assertion?: (token: T) => boolean
  ): boolean {
    const token = this.currentToken();

    if (assertion == null) {
      return token instanceof constructor;
    }

    return token instanceof constructor && assertion(token);
  }

  reranged(range: Range): ParseContext {
    const tokens = this.tokens.rerange(range);

    return new ParseContext(
      tokens,
      this.boundaries,
      this.offset,
      this.previousExpression
    );
  }

  pointedTo(offset: number): ParseContext {
    return new ParseContext(
      this.tokens,
      this.boundaries,
      offset,
      this.previousExpression
    );
  }

  moveBy(delta: number): ParseContext {
    return this.pointedTo(this.offset + delta);
  }

  precededByExpression(expression: Expression | null): ParseContext {
    return new ParseContext(
      this.tokens,
      this.boundaries,
      this.offset,
      expression
    );
  }

  static from(tokens: Iterable<Token>): Result<ParseContext> {
    const tokenAccessor = new ArrayRangeAccessor(Array.from(tokens));

    const [boundariesError, boundaries] = TokenBoundaryMap.from(tokens);
    if (boundariesError) {
      return Result.err(boundariesError);
    }

    const context = new ParseContext(tokenAccessor, boundaries, 0, null);

    return Result.ok(context);
  }
}

export abstract class BaseExpressionParser {
  parser!: Parser;

  abstract canParse(context: ParseContext): boolean;
  abstract parse(context: ParseContext): Expression;
}

export abstract class PrimaryExpressionParser extends BaseExpressionParser {}
export abstract class OperationParser extends BaseExpressionParser {}

export type ExpressionParser = PrimaryExpressionParser | OperationParser;
