import { Token } from "./token";
import {
  TokenAnalyser as TokenAnalyserBase,
  PolyTokenAnalyser,
  SimpleTokenAnalyser,
  TokenConstructor,
} from "./token-analyser-core";
import {
  isAlphabet,
  seekEndlineIndex,
  seekNumber,
  seekString,
  seekWord,
} from "@utils/string";

export namespace TokenAnalyser {
  export class LineCommentaryAnalyser extends SimpleTokenAnalyser {
    protected readonly searchString: string = "//";
    protected readonly TokenConstructor: TokenConstructor =
      Token.LineCommentary;

    getMatch(): string | null {
      const commentaryTokenString = super.getMatch();
      if (commentaryTokenString == null) {
        return null;
      }

      return (
        commentaryTokenString +
        this.code.substring(
          this.offset + commentaryTokenString.length,
          seekEndlineIndex(this.code, this.offset) + 1
        )
      );
    }
  }

  export class OpenBracesAnalyser extends SimpleTokenAnalyser {
    protected TokenConstructor: TokenConstructor = Token.OpenBraces;
    protected searchString: string = "{";
  }

  export class CloseBracesAnalyser extends SimpleTokenAnalyser {
    protected TokenConstructor: TokenConstructor = Token.CloseBraces;
    protected searchString: string = "}";
  }

  export class OpenParenthesesAnalyser extends SimpleTokenAnalyser {
    protected searchString: string = "(";
    protected TokenConstructor: TokenConstructor = Token.OpenParentheses;
  }

  export class CloseParenthesesAnalyser extends SimpleTokenAnalyser {
    protected TokenConstructor: TokenConstructor = Token.CloseParentheses;
    protected searchString: string = ")";
  }

  export class SemicolonAnalyser extends SimpleTokenAnalyser {
    protected TokenConstructor: TokenConstructor = Token.Semicolon;
    protected searchString: string = ";";
  }

  export class ColonAnalyser extends SimpleTokenAnalyser {
    protected TokenConstructor: TokenConstructor = Token.Semicolon;
    protected searchString: string = ":";
  }

  export class CommaAnalyser extends SimpleTokenAnalyser {
    protected TokenConstructor: TokenConstructor = Token.Comma;
    protected searchString: string = ",";
  }

  export class OperatorAnalyser extends PolyTokenAnalyser {
    protected TokenConstructor: TokenConstructor = Token.BinaryOperator;
    protected searchStrings: string[] = ["==", "+", ".", "=", "<", ">"];
  }

  export class StrAnalyser extends TokenAnalyserBase {
    protected TokenConstructor: TokenConstructor = Token.Str;

    getMatch(): string | null {
      const text = seekString(this.code, this.offset);
      if (text.length === 0) {
        return null;
      }

      return text;
    }
  }

  export class NumbAnalyser extends TokenAnalyserBase {
    protected TokenConstructor: TokenConstructor = Token.Numb;

    getMatch(): string | null {
      const text = seekNumber(this.code, this.offset);
      if (text.length === 0) {
        return null;
      }

      return text;
    }
  }

  export class KeywordAnalyser extends PolyTokenAnalyser {
    protected TokenConstructor: TokenConstructor = Token.Keyword;
    protected searchStrings: string[] = ["function", "if", "return", "let"];

    getMatch(): string | null {
      if (this.lastToken instanceof Token.Dot) {
        return null;
      }

      return super.getMatch();
    }
  }

  export class IdentifierAnalyser extends TokenAnalyserBase {
    protected TokenConstructor: TokenConstructor = Token.Identifier;

    getMatch(): string | null {
      const firstChar = this.code[this.offset];
      if (!isAlphabet(firstChar)) {
        return null;
      }

      return seekWord(this.code, this.offset);
    }
  }

  export class EndOfFileAnalyser extends TokenAnalyserBase {
    protected TokenConstructor: TokenConstructor = Token.EndOfFile;

    getMatch(): string | null {
      if (this.offset < this.code.length) {
        return null;
      }

      return "";
    }
  }
}

export * from "./token-analyser-core";
