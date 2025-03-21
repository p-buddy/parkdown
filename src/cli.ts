#!/usr/bin/env node
import { Command } from '@commander-js/extra-typings';
import { version } from '../package.json';
import { populateMarkdownInclusions, depopulateMarkdownInclusions } from '.';

const program = new Command()
  .version(version)
  .option('--nw, --no-write', 'Do NOT write result to file (defaults to false)', false as boolean)
  .option('--ni, --no-inclusions', 'Do NOT process file inclusions (defaults to false)', false as boolean)
  .option('-d, --depopulate', 'Remove populated inclusions from the file', false as boolean)
  .option('-f, --file <flag>', 'The file(s) to process', (value, arr) => (arr.push(value), arr), new Array<string>())
  .parse();

const { inclusions: noInclusions, depopulate, file, write: noWrite } = program.opts();


if (file.length === 0) file.push("README.md");

/** parkdown: process-order */
const processors = [
  [populateMarkdownInclusions, !noInclusions],
  [depopulateMarkdownInclusions, depopulate],
] as const;
/** parkdown: process-order */

for (const [processor] of processors.filter(([_, condition]) => condition))
  for (const _file of file) {
    const result = processor(_file, !noWrite);
    if (noWrite) console.log(result);
  }