export function isAlphabet(char: string) {
  return (char >= "a" && char <= "z") || (char >= "A" && char <= "Z");
}

export function isAlphanum(char: string) {
  return isAlphabet(char) || isNumeric(char);
}

export function isNumeric(char: string) {
  return char >= "0" && char <= "9";
}

export function seekWord(code: string, offset: number) {
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

export function seekString(code: string, offset: number) {
  let text = "";

  let delimiter = 0;

  while (true) {
    const char = code[offset++];

    if (char === '"') {
      delimiter++;
    }

    if (delimiter === 0) {
      break;
    }

    text += char;

    if (delimiter === 2) {
      break;
    }
  }

  return text;
}

export function seekNumber(code: string, offset: number) {
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

export function seekEndlineIndex(code: string, offset: number) {
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

export function parseString(text: string): string {
  return text.slice(1, -1);
}
