import { readFile } from 'node:fs/promises';
import tape from 'tape';
import { getMdToMdProcessor } from '../index.js';

tape('remarkdown', async t => {
	const processor = getMdToMdProcessor();
	t.equal(
		await processor
			.process(await readFile('./test/fixtures/mixed.md', 'utf8'))
			.then(content => String(content)),
		await readFile('./test/fixtures/mixed.result.md', 'utf8'),
		''
	);
	t.end();
});
