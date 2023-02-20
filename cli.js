#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import opsh from 'opsh';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeRaw from 'rehype-raw';
import rehypeRemark from 'rehype-remark';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import remarkStringify from 'remark-stringify';
import remarkGfm from 'remark-gfm';
import { SKIP, visit } from 'unist-util-visit';
import { fromHtml } from 'hast-util-from-html';
import { toMdast } from 'hast-util-to-mdast';

async function getPackage() {
	return JSON.parse(
		await readFile(new URL('./package.json', import.meta.url))
	);
}

async function slurp(stream) {
	let arr = [],
		len = 0;
	for await (let chunk of stream) {
		arr.push(chunk);
		len += chunk.length;
	}
	return Buffer.concat(arr, len).toString();
}

/*
	Remark plugin to convert mdast 'html' nodes
	into mdast Markdown nodes.
*/
function remarkParseHtml() {
	return function (tree, file) {
		visit(tree, 'html', (node, index, parent) => {
			const mdast = toMdast(fromHtml(node, { fragment: true }), {
				document: false
			});
			parent.children.splice(index, 1, ...mdast.children);
			return [SKIP, index];
		});
	};
}

function getHtmlToMdProcessor(opts = {}) {
	return unified()
		.use(rehypeParse)
		.use(rehypeRemark)
		.use(remarkGfm)
		.use(remarkStringify, opts);
}

function getMdToMdProcessor(opts = {}) {
	return unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkParseHtml)
		.use(remarkStringify, opts);
}

function getMdToHtmlProcessor(opts) {
	return unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeRaw)
		.use(rehypeSanitize)
		.use(rehypeStringify);
}

const commands = ['markdown', 'markup', 'remarkdown'];
const args = opsh(process.argv.slice(2), ['h', 'help', 'v', 'version']);

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

const HTML_DEFAULTS = {};

const mdOptions = { ...MD_DEFAULTS, ...namespacedOptions('md') };
const htmlOptions = { ...HTML_DEFAULTS };

if (!operands.length) {
	operands.push('-');
}

let processor;
switch (command) {
	case 'markdown':
		processor = getHtmlToMdProcessor(mdOptions);
		break;
	case 'remarkdown':
		processor = getMdToMdProcessor(mdOptions);
		break;
	case 'markup':
		processor = getMdToHtmlProcessor(htmlOptions);
		break;
}

const results = await Promise.all(
	operands
		.map(it => (it === '-' ? slurp(process.stdin) : readFile(it, 'utf8')))
		.map(promise =>
			promise
				.then(content => processor.process(content))
				.then(result => String(result))
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
  
    trimd [markup | markdown | remarkdown] [options] [file, ...]

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

    trimd markdown
        Convert HTML to Markdown.

    trimd remarkdown
        Normalize Markdown.

    trimd markup
        Convert Markdown to HMTL.

Markdown-specific options:

    --md.<option>=<value>
        Markdown options forwarded to 'remark-stringify'.

Examples:

    Convert HTML to Markdown: 
        trimd markdown my-file.html

    Convert Markdown to HTML:
        trimd markup README.md 

`);
}
