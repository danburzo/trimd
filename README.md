# trimd

Convert between HTML, Markdown, and plain text from the command line.

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

```bash
trimd [command] [options] [file1, [file2, …]]
```

Trimd accepts one or more input files, or uses the standard input (`stdin`) when no files are provided. You can also concatenate `stdin` in addition to other input files using the `-` operator.

A couple of general options are available:

-   **`-h, --help`** - output help information
-   **`-v, --version`** - output program version

Below is a list of supported commands.

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

This command ignores any YAML/TOML front-matter data present in the source file.

Use the `--data-url` flag to output the HTML as a base64-encoded `data:` URL. This format can be useful for viewing the HTML content in a browser:

```bash
trimd markup --data-url my-file.md | xargs open -a Firefox
```

> Note that at the time of writing, Firefox does not immediately render `data:` URLs passed from the command line (you need to press <kbd>Return</kbd> in the URL bar). See [#1892289](https://bugzilla.mozilla.org/show_bug.cgi?id=1892289), which is in the process of being fixed.

Use the `--no-sanitize` flag to skip the HTML sanitization step. Sanitization should only be disabled when the Markdown input is known to be safe.

### `trimd remarkup`

Simplify HTML by converting it to Markdown and back. The command is more or less the equivalent of `trimd markdown | trimd markup`.

Use the `--data-url` flag to output the HTML as a base64-encoded `data:` URL.

Use the `--no-sanitize` flag to skip the HTML sanitization step. Sanitization should only be disabled when the HTML input is known to be safe.

### `trimd remarkdown`

Convert Markdown to Markdown. The command accepts the same options as `trimd markdown`.

```bash
trimd remarkdown my-file.md
```

The `trimd remarkdown` command is useful for converting Markdown that may contain raw HTML into the Markdown style specified with the `--md.<option>=<value>` options.

This command preserves any YAML/TOML front-matter data present in the source file.

### `trimd demarkdown`

Convert Markdown to plain text.

```bash
trimd demarkdown my-file.md
```

This command ignores any YAML/TOML front-matter data present in the source file.

### `trimd demarkup`

Convert HTML to plain text.

```bash
trimd demarkup my-file.html
```

Plain text is produced according to the algorithm for [`HTMLElement.innerText`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/innerText).

You can also convert HTML to plain text via Markdown by piping `markdown` and `demarkdown` commands:

```bash
trimd markdown my-file.html | trimd demarkdown
```

## Acknowledgements

Trimd is a command-line interface on top of a chain of [unified.js](https://unifiedjs.com) libraries.

## See also

-   [Clipboard Inspector](https://github.com/evercoder/clipboard-inspector), a tool to help you explore the kinds of data available when you paste something on a web page, or drop something onto it.
-   [percollate](https://github.com/danburzo/percollate), a command-line tool to turn web pages into beautiful, readable PDF, EPUB, or HTML docs.
-   [hred](https://github.com/danburzo/hred), extract data from HTML (and XML) from the command line, using a syntax inspired by CSS selector.
-   [yamatter](https://github.com/danburzo/yamatter), inspect and transform YAML frontmatter data from the command line.
