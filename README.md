# trimd

Convert between HTML and Markdown from the command line, powered by [unified.js](https://unifiedjs.com).

An online companion tool is available at [**danburzo.ro/trimd**](https://danburzo.ro/trimd/).

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

## See also

-   [Clipboard Inspector](https://github.com/evercoder/clipboard-inspector), a tool to help you explore the kinds of data available when you paste something on a web page, or drop something onto it.
-   [percollate](https://github.com/danburzo/percollate), a command-line tool to turn web pages into beautiful, readable PDF, EPUB, or HTML docs.
-   [hred](https://github.com/danburzo/hred), extract data from HTML (and XML) from the command line, using a syntax inspired by CSS selector.
-   [yamatter](https://github.com/danburzo/yamatter), inspect and transform YAML frontmatter data from the command line.
