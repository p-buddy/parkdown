#!/usr/bin/env node
import { Command } from '@commander-js/extra-typings';
import { version } from '../package.json';
import { processMarkdownIncludes } from '.';

const program = new Command()
  .version(version)
  .option('-d, --debug')
  .option('-w, --write', 'Write the output to the file', true as boolean)
  .option('-i, --includes', 'Process file inclusions (expressed as empty links, e.g. `[](./local-file.md)`)', true as boolean)
  .option('-f, --file <flag>', 'The file(s) to process', (value, set) => set.add(value), new Set(["README.md"]))
  .parse();

const options = program.opts();

if (options.includes)
  for (const file of options.file)
    processMarkdownIncludes(file, options.write);