import test from 'node:test';
import assert from 'node:assert';
import { getHtmlToTextProcessor } from '../index.js';

const processor = getHtmlToTextProcessor();

test('demarkup', async t => {
	assert.equal(
		await processor
			.process('<h2>The <code>&lt;picture&gt;</code> element</h2>')
			.then(r => String(r)),
		'The <picture> element'
	);
});
