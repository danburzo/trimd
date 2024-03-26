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

export function getMdToHtmlProcessor(opts) {
	return unified()
		.use(remarkParse)
		.use(remarkFrontmatter, ['yaml', 'toml'])
		.use(remarkGfm)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeRaw)
		.use(rehypeSanitize)
		.use(rehypeStringify);
}
