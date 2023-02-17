#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import opsh from 'opsh';
import { markdown, markup } from './index.js';
import slurp from './util/slurp.js';

const commands = { markdown, markup };
const args = opsh(process.argv.slice(2), []);
const [command, ...operands] = args.operands;
const fn = commands[command];

if (!fn) {
	throw new Error(
		`Invalid command: ${command}. Expected 'markdown' or 'markup'.`
	);
}

const results = await Promise.all(
	operands
		.map(operand => {
			if (operand === '-') {
				return slurp(process.stdin);
			}
			return readFile(operand, 'utf8');
		})
		.map(promise => promise.then(content => fn(content)))
);

process.stdout.write(results.join('\n'));
