import { appendFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = '.lighthouseci';

if (!existsSync(DIR)) {
	console.log('no Lighthouse results');
	process.exit(0);
}

const runs = readdirSync(DIR)
	.filter((f) => f.startsWith('lhr-') && f.endsWith('.json'))
	.map((f) => JSON.parse(readFileSync(join(DIR, f), 'utf8')));

if (runs.length === 0) {
	console.log('no Lighthouse results');
	process.exit(0);
}

const median = (values) => {
	const s = [...values].sort((a, b) => a - b);
	const mid = s.length >> 1;
	return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

const rows = [
	['performance score', median(runs.map((r) => r.categories.performance.score * 100)).toFixed(0)],
	[
		'largest contentful paint',
		`${median(runs.map((r) => r.audits['largest-contentful-paint'].numericValue)).toFixed(0)} ms`
	],
	[
		'cumulative layout shift',
		median(runs.map((r) => r.audits['cumulative-layout-shift'].numericValue)).toFixed(3)
	],
	[
		'total byte weight',
		`${median(runs.map((r) => r.audits['total-byte-weight'].numericValue)).toLocaleString('en-US')} B`
	]
];

const url = runs[0].requestedUrl ?? runs[0].finalDisplayedUrl;
console.log(`Lighthouse median of ${runs.length} run(s) against ${url}`);
for (const [k, v] of rows) console.log(`${k.padEnd(26)}${v}`);

if (process.env.GITHUB_STEP_SUMMARY) {
	const table = [
		'| metric | median |',
		'| --- | ---: |',
		...rows.map(([k, v]) => `| ${k} | ${v} |`)
	].join('\n');
	appendFileSync(
		process.env.GITHUB_STEP_SUMMARY,
		`## Lighthouse (${runs.length} runs, ${url})\n\n${table}\n\n`
	);
}
