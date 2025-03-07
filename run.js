const fs = require("node:fs/promises");
const path = require("node:path");
const lexer = require("./lexer");
const parser = require("./parser");
const runner = require("./runner");

function eval(code) {
  const tokens = lexer.tokenize(code);
  const tree = parser.parse(tokens);
  const result = runner.run(tree);

  return result;
}

async function main(args) {
  const entryPoint = path.resolve(args[2]);
  const code = await fs.readFile(entryPoint, { encoding: "utf-8" });

  const result = eval(code);

  console.log(result);
}

runner.globalScope.eval = eval;

main(process.argv);
