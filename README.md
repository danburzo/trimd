# trimd

Trim HTML to Markdown from the command line.

## Getting started

Install `trimd` globally using `npm`:

```bash
npm install -g trimd
```

Or run `trimd` on the fly using `npx`:

```bash
npx trimd markdown my-file.html
```

## Usage

### General options

-   **`-h, --help`** - output help information
-   **`-v, --version`** - output program version

### `trimd markdown`

Convert HTML to Markdown.

```bash
trimd markdown my-file.html
```

You can pass your own preferences for generating Markdown with options in the form **`--md.<option>=<value>`**, which will get forwarded to [`remark-stringify`](https://github.com/remarkjs/remark/tree/main/packages/remark-stringify):

```bash
trimd markdown --md.strong='*' my-file.html
```

These are the default Markdown options:

```js
const MD_DEFAULTS = {
	fences: true,
	emphasis: '_',
	strong: '_',
	resourceLink: true,
	rule: '-'
};
```

### `trimd markup`

Convert Markdown to HTML.

```bash
trimd markup my-file.md
```

These are the default HTML options:

```js
const HTML_DEFAULTS = {};
```
