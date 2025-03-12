import fs from "node:fs/promises";
import path from "node:path";
import lexer from "@parsing/lexer";
import parser from "@parsing/parser";
import runner from "@runtime/runner";
import { seekGroupRange } from "@parsing/utils/token-finder";
import { Token } from "@parsing/token";
import { SyntaxNode } from "@parsing/syntax-node";

function logTokens(tokens: Token[]) {
  const tokensString = tokens
    .map((v, i) => `${i.toString().padStart(4, " ")} -> ${v.type}`)
    .join("\n");

  console.log(tokensString);
}

function logSyntaxTree(node: SyntaxNode) {
  console.log(JSON.stringify(node, undefined, 2));
}

function evaluate(code: string) {
  const tokens = lexer.tokenize(code);
  // logTokens(tokens);

  const tree = parser.parse(tokens);
  logSyntaxTree(tree);

  const result = runner.run(tree).value;

  return result;
}

async function main(args: string[]) {
  const entryPoint = path.resolve(args[2]);

  console.log(`>> running ${entryPoint}`);
  const code = await fs.readFile(entryPoint, { encoding: "utf-8" });

  console.time("runtime");
  const result = evaluate(code);

  console.log(result);
  console.log(`>> execution finished`);
  console.timeEnd("runtime");
}

runner.globalScope.eval = evaluate;

main(process.argv);
