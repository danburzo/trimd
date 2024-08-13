import test from 'node:test';
import assert from 'node:assert';
import { getHtmlToMdProcessor } from '../index.js';

test('trailing whitespace', async t => {
	const testcases = [
		{
			input: '<span style="font-weight: 400;">Select the </span><strong>Project Window </strong><span style="font-weight: 400;">in your Dashboard.</span>',
			expected: 'Select the **Project Window **in your Dashboard.\n'
		},
		{
			input: '<em>italic<strong> bold</strong></em>',
			expected: '*italic** bold***\n'
		}
	];
	await Promise.all(
		testcases.map(async testcase => {
			assert.equal(
				await getHtmlToMdProcessor()
					.process(testcase.input)
					.then(String),
				testcase.expected
			);
		})
	);
});
