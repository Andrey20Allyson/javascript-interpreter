import { Token } from "./token";
import {
  TokenAnalyser,
  TokenAnalyserCollection,
  TokenGenerator,
} from "./token-analyser-impl";

namespace lexer {
  export function createTokenGenerator(code: string): TokenGenerator {
    const generators: TokenGenerator[] = [
      new TokenAnalyser.EndOfFileAnalyser(code),

      new TokenAnalyser.LineCommentaryAnalyser(code),

      new TokenAnalyser.OpenBracesAnalyser(code),
      new TokenAnalyser.CloseBracesAnalyser(code),

      new TokenAnalyser.OpenParenthesesAnalyser(code),
      new TokenAnalyser.CloseParenthesesAnalyser(code),

      new TokenAnalyser.DotAnalyser(code),
      new TokenAnalyser.SemicolonAnalyser(code),
      new TokenAnalyser.ColonAnalyser(code),

      new TokenAnalyser.OperatorAnalyser(code),

      new TokenAnalyser.StrAnalyser(code),
      new TokenAnalyser.NumbAnalyser(code),

      new TokenAnalyser.KeywordAnalyser(code),
      new TokenAnalyser.IdentifierAnalyser(code),
    ];

    const generator = new TokenAnalyserCollection();
    generator.setCollection(generators);

    return generator;
  }

  export function tokenize(code: string) {
    let tokens: Token[] = [];

    const generator = createTokenGenerator(code);

    while (true) {
      const token = generator.next();
      if (token == null) {
        continue;
      }

      if (token instanceof Token.EndOfFile) {
        break;
      }

      tokens.push(token);
    }

    return tokens;
  }
}

export default lexer;
