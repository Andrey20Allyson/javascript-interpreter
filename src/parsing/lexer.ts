import { Token } from "./token";

function tokenize(code: string) {
  let tokens: Token[] = [];

  let i = 0;
  do {
    const char = code[i];

    if (char === "/") {
      const nextChar = code[i + 1];
      if (nextChar === "/") {
        tokens.push(new Token.LineCommentary());

        i = seekEndlineIndex(code, i);

        continue;
      }
    }

    if (char === "(") {
      tokens.push(new Token.OpenParentheses());
      continue;
    }

    if (char === ")") {
      tokens.push(new Token.CloseParentheses());
      continue;
    }

    if (char === ".") {
      tokens.push(new Token.Dot());
      continue;
    }

    if (char === ";") {
      tokens.push(new Token.Semicolon());
      continue;
    }

    if (char === ",") {
      tokens.push(new Token.Colon());
      continue;
    }

    if (char === "+") {
      tokens.push(new Token.Operator("+"));
      continue;
    }

    if (char === '"') {
      const text = seekString(code, i);

      tokens.push(new Token.Str(text));
      i += text.length - 1;

      continue;
    }

    if (isNumeric(char)) {
      const text = seekNumber(code, i);

      tokens.push(new Token.Numb(text));
      i += text.length - 1;

      continue;
    }

    if (isAlphabet(char)) {
      const word = seekWord(code, i);

      tokens.push(new Token.Identifier(word));
      i += word.length - 1;

      continue;
    }
  } while (++i < code.length);

  return tokens;
}

function isAlphabet(char: string) {
  return (char >= "a" && char <= "z") || (char >= "A" && char <= "Z");
}

function isAlphanum(char: string) {
  return isAlphabet(char) || isNumeric(char);
}

function isNumeric(char: string) {
  return char >= "0" && char <= "9";
}

function seekWord(code: string, offset: number) {
  let text = "";

  while (true) {
    const char = code[offset++];

    if (!isAlphanum(char)) {
      break;
    }

    text += char;
  }

  return text;
}

function seekString(code: string, offset: number) {
  let text = "";

  let delimiter = 0;

  while (true) {
    const char = code[offset++];

    if (char === '"') {
      delimiter++;
    }

    text += char;

    if (delimiter === 2) {
      break;
    }
  }

  return text;
}

function seekNumber(code: string, offset: number) {
  let text = "";

  while (true) {
    const char = code[offset++];

    if (!isNumeric(char)) {
      break;
    }

    text += char;
  }

  return text;
}

function seekEndlineIndex(code: string, offset: number) {
  while (true) {
    const char = code[offset++];

    if (char == null) {
      return offset - 1;
    }

    if (char === "\n") {
      return offset - 1;
    }
  }
}

const lexer = {
  tokenize,
  Token,
};

export default lexer;
