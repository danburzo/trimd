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
/*
	Remark plugin to fix trailing whitespace in inline nodes.
	See: https://github.com/orgs/syntax-tree/discussions/60
*/
function remarkTrailingWhitespace() {
	return function (tree, file) {
		visit(tree, ['strong', 'emphasis'], (node, index, parent) => {
			// Remove empty nodes
			if (!node.children.length) {
				parent.children.splice(index, 1);
				return SKIP;
			}

			const first = node.children[0];

			// Remove image nodes from within emphasis nodes
			if (first.type === 'image') {
				parent.children.splice(index, 1, first);
				return SKIP;
			}

			// Remove trailing whitespace at the beginning
			if (first.type === 'text') {
				const start_match = first.value.match(/^(\s+)(.*)/);
				if (start_match) {
					const [_, start_ws, start_text] = start_match;
					parent.children.splice(index, 0, {
						type: 'text',
						value: start_ws
					});
					if (start_text) {
						// has non-whitespace content
						first.value = start_text;
					} else {
						// all-whitespace content
						node.children.shift();
					}
					// Re-visit this node
					return [SKIP, index - 1];
				}
			}

			const last = node.children[node.children.length - 1];
			if (last.type === 'text') {
				const end_match = last.value.match(/(.*?)(\s+)$/);
				if (end_match) {
					const [_, end_text, end_ws] = end_match;
					parent.children.splice(index + 1, 0, {
						type: 'text',
						value: end_ws
					});
					if (end_text) {
						last.value = end_text;
					} else {
						node.children.pop();
					}
				}
			}

			return SKIP;
		});
	};
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

function rehypeNoOp() {
	return () => {};
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
	return (
		unified()
			.use(rehypeParse)
			.use(rehypeRemark)
			.use(remarkGfm)
			// Not enabled yet, as it doesn’t treat some corner cases
			// See: https://github.com/danburzo/trimd/issues/5
			// .use(remarkTrailingWhitespace)
			.use(remarkStringify, opts)
	);
}

export function getMdToMdProcessor(opts = {}) {
	return unified()
		.use(remarkParse)
		.use(remarkFrontmatter, ['yaml', 'toml'])
		.use(remarkGfm)
		.use(remarkParseHtml)
		.use(remarkStringify, opts);
}

export function getMdToHtmlProcessor(opts = {}) {
	return unified()
		.use(remarkParse)
		.use(remarkFrontmatter, ['yaml', 'toml'])
		.use(remarkGfm)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeRaw)
		.use(opts.sanitize ? rehypeSanitize : rehypeNoOp)
		.use(rehypeStringify);
}

export function getHtmlToHtmlProcessor(opts = {}) {
	return (
		unified()
			.use(rehypeParse)
			.use(rehypeRemark)
			// Not enabled yet, as it doesn’t treat some corner cases
			// See: https://github.com/danburzo/trimd/issues/5
			// .use(remarkTrailingWhitespace)
			.use(remarkRehype)
			.use(opts.sanitize ? rehypeSanitize : rehypeNoOp)
			.use(rehypeStringify)
	);
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
