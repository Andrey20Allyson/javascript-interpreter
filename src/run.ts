import fs from "node:fs/promises";
import path from "node:path";
import lexer from "@lexical-analysis/lexer";
import { Parser } from "@parsing/parser";
import runner, { RunResult } from "@runtime/runner";
import { Token } from "@lexical-analysis/token";
import { SyntaxNode } from "@parsing/syntax-node";
import chalk from "chalk";
import {
  ExpressionParser,
  OperationParser,
  ParseContext,
} from "@parsing/parser-core";
import { LetStatementParser } from "@parsing/parsers/let-statement";
import { IdentifierParser } from "@parsing/parsers/identifier";
import { BinaryOperatorParser } from "@parsing/parsers/binary-operatiors";
import { NumberLiteralParser } from "@parsing/parsers/number";
import { StringLiteralParser } from "@parsing/parsers/string";
import { FunctionStatementParser } from "@parsing/parsers/function-statement";
import { ObjectLiteralParser } from "@parsing/parsers/object-literal";
import { IfStatementParser } from "@parsing/parsers/if-statement";
import { ReturnStatementParser } from "@parsing/parsers/return-statement";
import { FunctionCallParser } from "@parsing/parsers/function-call";
import { MultiExpressionParser } from "@parsing/parsers/multi-expression";

function logTokens(tokens: Token[]) {
  const tokensString = tokens
    .map((v, i) => `${i.toString().padStart(4, " ")} -> ${v.type}`)
    .join("\n");

  console.log(tokensString);
}

function logSyntaxTree(node: SyntaxNode) {
  console.log(JSON.stringify(node, undefined, 2));
}

const defaultParserPlugins: ExpressionParser[] = [
  new LetStatementParser(),
  new FunctionStatementParser(),
  new IfStatementParser(),
  new IdentifierParser(),
  new ReturnStatementParser(),
  new NumberLiteralParser(),
  new StringLiteralParser(),
  new FunctionCallParser(),
  new MultiExpressionParser(),
  new BinaryOperatorParser(),
];

function evaluate(code: string) {
  const tokens = lexer.tokenize(code);
  // logTokens(tokens);

  // parsing
  const parser = new Parser();
  parser.plug(...defaultParserPlugins);

  const parseContext = ParseContext.from(tokens).unwrap();

  const tree = parser.parse(parseContext);
  logSyntaxTree(tree);

  // execution
  // const result = runner.run(tree, {
  //   eval(str: string) {
  //     const [value, error] = evaluate(str);

  //     if (error) {
  //       return new RunResult.Error(error);
  //     }

  //     return new RunResult.Return(value);
  //   },
  // });

  // return result;
}

async function main(args: string[]) {
  const entryPoint = path.resolve(args[2]);

  console.log(`>> running ${entryPoint}`);
  const code = await fs.readFile(entryPoint, { encoding: "utf-8" });

  console.time("runtime");

  evaluate(code);
  // const [value, error] = evaluate(code);

  // if (error != null) {
  //   console.log(`${chalk.red.underline(error.name + ":")} ${error.message}`);
  //   console.log(`>> execution finished with ${chalk.red.underline("error")}`);
  // } else {
  //   console.log(value);
  //   console.log(
  //     `>> execution finished with ${chalk.green.underline("success")}`
  //   );
  // }

  console.timeEnd("runtime");
}

main(process.argv);
