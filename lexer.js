function createTokenFactory(type, ...valueKeys) {
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

const Token = {
  Identifier: createTokenFactory("Identifier", "name"),
  Keyword: createTokenFactory("Keyword", "name"),
  Numb: createTokenFactory("Number", "text"),
  Str: createTokenFactory("String", "text"),
  OpenParentheses: createTokenFactory("Open Parentheses"),
  CloseParentheses: createTokenFactory("Close Parentheses"),
  Dot: createTokenFactory("Dot"),
  Semicolon: createTokenFactory("Semicolon"),
  Colon: createTokenFactory("Colon"),
  Operator: createTokenFactory("Operator", "opr"),
};

function tokenize(code) {
  let tokens = [];

  let i = 0;
  do {
    const char = code[i];

    if (char === "(") {
      tokens.push(Token.OpenParentheses());
      continue;
    }

    if (char === ")") {
      tokens.push(Token.CloseParentheses());
      continue;
    }

    if (char === ".") {
      tokens.push(Token.Dot());
      continue;
    }

    if (char === ";") {
      tokens.push(Token.Semicolon());
      continue;
    }

    if (char === ",") {
      tokens.push(Token.Colon());
      continue;
    }

    if (char === "+") {
      tokens.push(Token.Operator("+"));
      continue;
    }

    if (char === '"') {
      const text = seekString(code, i);

      tokens.push(Token.Str(text));
      i += text.length - 1;

      continue;
    }

    if (isNumeric(char)) {
      const text = seekNumber(code, i);

      tokens.push(Token.Numb(text));
      i += text.length - 1;

      continue;
    }

    if (isAlphabet(char)) {
      const word = seekWord(code, i);

      tokens.push(Token.Identifier(word));
      i += word.length - 1;

      continue;
    }
  } while (++i < code.length);

  return tokens;
}

function isAlphabet(char) {
  return (char >= "a" && char <= "z") || (char >= "A" && char <= "Z");
}

function isAlphanum(char) {
  return isAlphabet(char) || isNumeric(char);
}

function isNumeric(char) {
  return char >= "0" && char <= "9";
}

function seekWord(code, offset) {
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

function seekString(code, offset) {
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

function seekNumber(code, offset) {
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

const lexer = {
  tokenize,
  Token,
};

module.exports = lexer;
