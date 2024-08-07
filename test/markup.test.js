import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert';
import { getMdToHtmlProcessor } from '../index.js';

const FIXTURE_DIR = './test/fixtures';

const fixtures = [['rich-markup.md', 'rich-markup.result.html']];

test('markup', async t => {
	const processor = getMdToHtmlProcessor({ sanitize: false });
	return Promise.all(
		fixtures.map(async fixture => {
			const [input, expected] = fixture;
			const content = await readFile(join(FIXTURE_DIR, input), 'utf8');
			assert.equal(
				await processor.process(content).then(r => String(r)),
				await readFile(join(FIXTURE_DIR, expected), 'utf8'),
				input
			);
		})
	);
});
