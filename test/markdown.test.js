import test from 'node:test';
import assert from 'node:assert';
import { getHtmlToMdProcessor } from '../index.js';

test('trailing whitespace', async t => {
	const input =
		'<span style="font-weight: 400;">Select the </span><strong>Project Window </strong><span style="font-weight: 400;">in your Dashboard.</span>';
	assert.equal(await getHtmlToMdProcessor().process(input).then(String), '');
});
