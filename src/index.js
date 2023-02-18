import { unified } from 'unified';
import remarkParse from 'remark-parse';
import rehypeParse from 'rehype-parse';
import remarkRehype from 'remark-rehype';
import rehypeRemark from 'rehype-remark';
import remarkStringify from 'remark-stringify';
import rehypeStringify from 'rehype-stringify';
import rehypeSanitize from 'rehype-sanitize';

const processors = new WeakMap();

export async function markdown(html, opts) {
	let toMarkdown = processors.get(opts);
	if (!toMarkdown) {
		toMarkdown = unified()
			.use(rehypeParse)
			.use(rehypeSanitize)
			.use(rehypeRemark)
			.use(remarkStringify, opts);
		processors.set(opts, toMarkdown);
	}
	return toMarkdown.process(html).then(res => res.toString());
}

export async function markup(md, opts) {
	let toHTML = processors.get(opts);
	if (!toHTML) {
		toHTML = unified()
			.use(remarkParse)
			.use(remarkRehype)
			.use(rehypeSanitize)
			.use(rehypeStringify);
		processors.set(opts, toHTML);
	}
	return toHTML.process(md).then(res => res.toString());
}
