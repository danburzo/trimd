import { unified } from 'unified';
import rehypeDomParse from 'rehype-dom-parse';
import rehypeRemark from 'rehype-remark';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import stripMarkdown from 'strip-markdown';
import { SKIP, visit } from 'unist-util-visit';

/* Minimal polyfill for Object.hasOwn() */
if (!Object.hasOwn) {
	Object.hasOwn = Object.call.bind(Object.hasOwnProperty);
}

/* See notes in the CLI tool’s index.js */
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

const processors = new WeakMap();

/* 
	TODO: why are we using WeakMap here? 
	The `opts` object seems to be new every time. 
*/
export async function markdown(html, opts) {
	let toMarkdown = processors.get(opts);
	if (!toMarkdown) {
		toMarkdown = unified()
			.use(rehypeDomParse)
			.use(rehypeRemark)
			.use(remarkGfm)
			.use(remarkStringify, opts);
		processors.set(opts, toMarkdown);
	}
	return toMarkdown.process(html).then(res => String(res));
}

export async function demarkdown(md) {
	let toPlainText = unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkParseHtml)
		.use(stripMarkdown)
		.use(remarkToText);
	return toPlainText.process(md).then(res => String(res));
}

/* 
	We haven’t used the WeakMap approach here, 
	until we sort out what the idea was there.
*/
export async function markup(md, opts) {
	let toHtml = unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeRaw)
		.use(rehypeSanitize)
		.use(rehypeStringify);
	return toHtml.process(md).then(res => String(res));
}

/*
	For the given `form` element, 
	with an optional `submitter` element,
	return an object whose keys 
	are the names of the form elements, 
	mapping to their corresponding values 
	based on the type of each element.
 */
export function formDataMap(form, submitter) {
	const excludedTags = ['FIELDSET', 'OBJECT', 'OUTPUT'];
	const excludedTypes = ['button', 'reset', 'image'];

	function shouldSubmit(el) {
		if (!el.name) return false;
		if (excludedTags.includes(el.tagName)) return false;
		if (excludedTypes.includes(el.type)) return false;
		if (el.type === 'submit' && el !== submitter) return false;
		if (el.type === 'radio' && !el.checked) return false;
		if (el.type === 'checkbox' && !el.checked) return false;
		if (el.disabled || el.matches(':disabled')) return false;
		if (el.closest('datalist')) return false;
		return true;
	}

	const result = {};

	function append(key, val) {
		result[key] = Object.hasOwn(result, key)
			? [].concat(result[key], val)
			: val;
	}

	Array.from(form.elements).forEach(el => {
		if (!shouldSubmit(el)) return;
		const { name, type } = el;
		if (type === 'number' || type === 'range') {
			append(name, +el.value);
		} else if (type === 'date' || type === 'datetime-local') {
			append(name, el.valueAsDate());
		} else if (type === 'file') {
			append(name, el.files);
		} else if (type === 'url') {
			append(name, new URL(el.value));
		} else if (type === 'select-one' || type === 'select-multiple') {
			el.selectedOptions.forEach(option => append(name, option.value));
		} else {
			append(name, el.value);
		}
	});

	return result;
}

export function debounce(fn, duration = 300) {
	let timer;
	return () => {
		clearTimeout(timer);
		timer = setTimeout(fn, duration);
	};
}
