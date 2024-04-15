import test from 'node:test';
import assert from 'node:assert';
import { getMdToTextProcessor } from '../index.js';

const processor = getMdToTextProcessor();

test('without front-matter', async t => {
	assert.equal(
		await processor
			.process('## The `<picture>` element')
			.then(r => String(r)),
		'The <picture> element'
	);
});

test('with front-matter', async t => {
	assert.equal(
		await processor
			.process('---\ntitle: Picture\n---\n## The `<picture>` element')
			.then(r => String(r)),
		'The <picture> element'
	);
});
