import { unified } from 'unified';
import remarkParse from 'remark-parse';
import rehypeParse from 'rehype-parse';
import remarkRehype from 'remark-rehype';
import rehypeRemark from 'rehype-remark';
import remarkStringify from 'remark-stringify';
import rehypeStringify from 'rehype-stringify';

const toMarkdown = unified()
	.use(rehypeParse)
	.use(rehypeRemark)
	.use(remarkStringify);

const toHTML = unified()
	.use(remarkParse)
	.use(remarkRehype)
	.use(rehypeStringify);

export async function markdown(html) {
	return toMarkdown.process(html).then(res => res.toString());
}

export async function markup(md) {
	return toHTML.process(md).then(res => res.toString());
}
