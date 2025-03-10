#!/usr/bin/env node
import { Command } from '@commander-js/extra-typings';
import { version } from '../package.json';

const program = new Command()
  .version(version)
  .option('-d, --debug')
  .parse();

const options = program.opts();
