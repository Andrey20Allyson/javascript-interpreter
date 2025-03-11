import fs from "node:fs/promises";
import path from "node:path";
import lexer from "@parsing/lexer";
import parser from "@parsing/parser";
import runner from "@runtime/runner";

function evaluate(code: string) {
  const tokens = lexer.tokenize(code);
  // console.log(tokens);

  const tree = parser.parse(tokens);
  // console.log(JSON.stringify(tree, undefined, 2));
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
