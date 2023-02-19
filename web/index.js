import { unified } from 'unified';
import rehypeDomParse from 'rehype-dom-parse';
import rehypeRemark from 'rehype-remark';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';

/* Minimal polyfill for Object.hasOwn() */
if (!Object.hasOwn) {
	Object.hasOwn = Object.call.bind(Object.hasOwnProperty);
}

const processors = new WeakMap();

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
