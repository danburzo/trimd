#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import opsh from 'opsh';
import {
	slurp,
	toDataUrl,
	getHtmlToMdProcessor,
	getMdToMdProcessor,
	getMdToHtmlProcessor,
	getMdToTextProcessor,
	getHtmlToTextProcessor,
	getHtmlToHtmlProcessor
} from './index.js';

async function getPackage() {
	return JSON.parse(
		await readFile(new URL('./package.json', import.meta.url))
	);
}

const commands = [
	'markdown',
	'markup',
	'remarkdown',
	'demarkdown',
	'remarkup',
	'demarkup'
];
const args = opsh(process.argv.slice(2), [
	'h',
	'help',
	'v',
	'version',
	'data-url'
]);

const [command, ...operands] = args.operands;

if (args.options.h || args.options.help) {
	await outputHelp();
	process.exit();
}

if (args.options.v || args.options.version) {
	const pkg = await getPackage();
	console.log(pkg.version);
	process.exit();
}

if (!command) {
	await outputHelp();
	process.exit();
}

if (!commands.includes(command)) {
	console.error(
		`Invalid command '${command}'. Expected one of: ${commands.join(', ')}.`
	);
	process.exit(1);
}

function cast(val) {
	if (val === 'true') return true;
	if (val === 'false') return false;
	const num = parseFloat(val);
	if (!Number.isNaN(num)) return num;
	return val;
}

function namespacedOptions(namespace) {
	const matcher = new RegExp(String.raw`${namespace}\.(.+)`);
	return Object.keys(args.options).reduce((obj, k) => {
		const m = k.match(matcher);
		if (m) {
			obj[m[1]] = cast(args.options[k]);
		}
		return obj;
	}, {});
}

const MD_DEFAULTS = {
	fences: true,
	emphasis: '_',
	strong: '_',
	resourceLink: true,
	rule: '-'
};

const mdOptions = { ...MD_DEFAULTS, ...namespacedOptions('md') };

if (!operands.length) {
	operands.push('-');
}

const htmlOptions = {
	sanitize: !args.options['no-sanitize']
};

let processor;
let postProcessor = v => v;
switch (command) {
	case 'markdown':
		processor = getHtmlToMdProcessor(mdOptions);
		break;
	case 'remarkdown':
		processor = getMdToMdProcessor(mdOptions);
		break;
	case 'markup':
		processor = getMdToHtmlProcessor(htmlOptions);
		if (args.options['data-url']) {
			postProcessor = toDataUrl;
		}
		break;
	case 'demarkdown':
		processor = getMdToTextProcessor();
		break;
	case 'demarkup':
		processor = getHtmlToTextProcessor();
		break;
	case 'remarkup':
		processor = getHtmlToHtmlProcessor(htmlOptions);
		if (args.options['data-url']) {
			postProcessor = toDataUrl;
		}
		break;
}

const results = await Promise.all(
	operands
		.map(it => (it === '-' ? slurp(process.stdin) : readFile(it, 'utf8')))
		.map(promise =>
			promise
				.then(content => processor.process(content))
				.then(result => postProcessor(String(result)))
		)
);

console.log(results.join('\n'));

async function outputHelp() {
	const pkg = await getPackage();
	console.log(`${pkg.name} ${pkg.version}`);
	console.log(`${pkg.description}`);
	console.log(`Homepage: ${pkg.homepage}`);

	console.log(`
Usage:
  
    trimd [command] [options] [file, ...]

    Operands are one or more files provided by file path.
    Using '-' (dash) as an operand reads from the standard input ('stdin').
    When no operands are provided, input is read from 'stdin'.

    Output is provided to the standard output ('stdout').

General options:

    -h, --help
        Output help information.

    -v, --version
        Output program version.

Commands:

    markdown
        Convert HTML to Markdown.

    remarkdown
        Normalize Markdown.

    markup
        Convert Markdown to HMTL.

    demarkdown
        Convert Markdown to plain text.

    demarkup
        Convert HTML to plain text.

    remarkup
        Simplify HTML by converting it to Markdown and back.

Markdown-specific options:

    --md.<option>=<value>
        Markdown options forwarded to 'remark-stringify'.

HTML-specific options:

    --data-url
        Output the resulting HTML as a base64-encoded 'data:' URL.
        Applies to the 'markup' and 'remarkup' commands.

    --no-sanitize
       Skip the HTML sanitization step. 
       Should only be used when the input is known to be safe.

Examples:

    Convert HTML to Markdown: 
        trimd markdown my-file.html

    Convert Markdown to HTML:
        trimd markup README.md 

`);
}
