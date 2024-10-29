import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeRaw from 'rehype-raw';
import rehypeRemark from 'rehype-remark';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkFrontmatter from 'remark-frontmatter';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import remarkStringify from 'remark-stringify';
import remarkGfm from 'remark-gfm';
import { toText } from 'hast-util-to-text';
import stripMarkdown from 'strip-markdown';
import { SKIP, visit } from 'unist-util-visit';
import { fromHtml } from 'hast-util-from-html';
import { toMdast } from 'hast-util-to-mdast';

function noop() {
	return () => {};
}

export async function slurp(stream) {
	let arr = [],
		len = 0;
	for await (let chunk of stream) {
		arr.push(chunk);
		len += chunk.length;
	}
	return Buffer.concat(arr, len).toString();
}

export function toDataUrl(str) {
	return `data:text/html;charset=utf-8;base64,${Buffer.from(str).toString('base64')}`;
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

/*
	An unified.js Compiler that converts MDAST to a string.
	It’s inspired by `mdast-util-to-string`, but it 
	separates paragraphs with `\n\n` instead of the empty string. 
	We can make the function very simple because the structure 
	produced by `strip-markdown` is predictable, and only contains
	nodes of type `root`, `paragraph` and `text`. 

	We can’t use the `remark-stringify` Compiler because it
	technically produces a Markdown string, not a regular plain-text string,
	and as such will escape things with backslashes as dictated by
	Markdown syntax. 

	See: https://github.com/remarkjs/strip-markdown/issues/28
*/
function remarkToText() {
	this.compiler = function visit(node) {
		if (!node) return '';
		if (Array.isArray(node)) return node.map(visit).join('');
		if (node.value) return node.value;
		if (node.children) {
			return node.children
				.map(visit)
				.join(node.type === 'root' ? '\n\n' : '');
		}
	};
}

function rehypeToText() {
	this.compiler = toText;
}

export function getHtmlToMdProcessor(opts = {}) {
	return unified()
		.use(rehypeParse)
		.use(rehypeRemark)
		.use(remarkGfm)
		.use(remarkStringify, opts);
}

export function getMdToMdProcessor(opts = {}, transformFn) {
	return unified()
		.use(remarkParse)
		.use(remarkFrontmatter, ['yaml', 'toml'])
		.use(remarkGfm)
		.use(remarkParseHtml)
		.use(transformFn ? () => transformFn(visit) : noop)
		.use(remarkStringify, opts);
}

export function getMdToHtmlProcessor(opts = {}) {
	return unified()
		.use(remarkParse)
		.use(remarkFrontmatter, ['yaml', 'toml'])
		.use(remarkGfm)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeRaw)
		.use(opts.sanitize ? rehypeSanitize : noop)
		.use(rehypeStringify);
}

export function getHtmlToHtmlProcessor(opts = {}) {
	return unified()
		.use(rehypeParse)
		.use(rehypeRemark)
		.use(remarkRehype)
		.use(opts.sanitize ? rehypeSanitize : noop)
		.use(rehypeStringify);
}

export function getMdToTextProcessor() {
	return unified()
		.use(remarkParse)
		.use(remarkFrontmatter, ['yaml', 'toml'])
		.use(remarkGfm)
		.use(remarkParseHtml)
		.use(stripMarkdown)
		.use(remarkToText);
}

export function getHtmlToTextProcessor() {
	return unified().use(rehypeParse).use(rehypeToText);
}
