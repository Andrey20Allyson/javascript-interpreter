import fs from "node:fs/promises";
import path from "node:path";
import lexer from "@lexical-analysis/lexer";
import parser from "@parsing/parser";
import runner, { RunResult } from "@runtime/runner";
import { Token } from "@lexical-analysis/token";
import { SyntaxNode } from "@parsing/syntax-node";
import chalk from "chalk";

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
  // logSyntaxTree(tree);

  const result = runner.run(tree, {
    eval(str: string) {
      const [value, error] = evaluate(str);

      if (error) {
        return new RunResult.Error(error);
      }

      return new RunResult.Return(value);
    },
  });

  return result;
}

async function main(args: string[]) {
  const entryPoint = path.resolve(args[2]);

  console.log(`>> running ${entryPoint}`);
  const code = await fs.readFile(entryPoint, { encoding: "utf-8" });

  console.time("runtime");
  const [value, error] = evaluate(code);

  if (error != null) {
    console.log(`${chalk.red.underline(error.name + ":")} ${error.message}`);
    console.log(`>> execution finished with ${chalk.red.underline("error")}`);
  } else {
    console.log(value);
    console.log(
      `>> execution finished with ${chalk.green.underline("success")}`
    );
  }

  console.timeEnd("runtime");
}

main(process.argv);
