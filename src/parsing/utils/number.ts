export function parseString(text: string): string {
  throw new Error("Method not implemented.");
}

export function parseNumber(text: string): number {
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
