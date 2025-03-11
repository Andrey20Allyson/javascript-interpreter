import fs from "node:fs/promises";
import path from "node:path";
import lexer from "@parsing/lexer";
import parser from "@parsing/parser";
import runner from "@runtime/runner";
import { TokenAnalyser } from "@parsing/token-analyser-impl";

function evaluate(code: string) {
  const tokens = lexer.tokenize(code);
  const tree = parser.parse(tokens);
  const result = runner.run(tree);

  return result;
}

async function main(args: string[]) {
  const entryPoint = path.resolve(args[2]);

  console.log(`>> running ${entryPoint}`);
  const code = await fs.readFile(entryPoint, { encoding: "utf-8" });

  console.time("runtime");
  const result = evaluate(code);

  console.log(result);
  console.log(`\n>> execution finished`);
  console.timeEnd("runtime");
}

runner.globalScope.eval = evaluate;

main(process.argv);
