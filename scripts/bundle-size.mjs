import { appendFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const OUT = '.svelte-kit/output';
const CLIENT = join(OUT, 'client');
const ROUTE = '/';
const JS_BUDGET = 102_400;

const manifest = JSON.parse(readFileSync(join(CLIENT, '.vite/manifest.json'), 'utf8'));
const byName = (name) => Object.keys(manifest).find((k) => manifest[k].name === name);

const route = routeNodes(readFileSync(join(OUT, 'server/manifest-full.js'), 'utf8'), ROUTE);
const nodes = [...route.layouts, route.leaf];

const files = new Set();
const css = new Set();
const visit = (key) => {
	const chunk = manifest[key];
	if (files.has(chunk.file)) return;
	files.add(chunk.file);
	for (const c of chunk.css ?? []) css.add(c);
	for (const dep of chunk.imports ?? []) visit(dep);
};
for (const name of ['entry/start', 'entry/app', ...nodes.map((n) => `nodes/${n}`)]) {
	visit(byName(name));
}

const nodeRows = nodes.map((n) => {
	const src = readFileSync(join(OUT, `server/nodes/${n}.js`), 'utf8');
	const entry = src.match(/import\('\.\.\/entries\/(.+?)'\)/)[1];
	return [String(n), sourceOf(entry), manifest[byName(`nodes/${n}`)].file];
});
console.log(`route ${ROUTE}: layouts [${route.layouts}] leaf ${route.leaf}\n`);
console.log(table(['node', 'source', 'client file'], nodeRows));

const measure = (file) => {
	const buf = readFileSync(join(CLIENT, file));
	return { file, raw: buf.length, gz: gzipSync(buf, { level: 9 }).length };
};
const js = [...files].sort().map(measure);
const styles = [...css].sort().map(measure);
const sum = (rows, k) => rows.reduce((a, r) => a + r[k], 0);
const rows = [...js, ...styles].map((r) => [r.file, fmt(r.raw), fmt(r.gz)]);
rows.push(['total JavaScript', fmt(sum(js, 'raw')), fmt(sum(js, 'gz'))]);
rows.push(['total CSS', fmt(sum(styles, 'raw')), fmt(sum(styles, 'gz'))]);
console.log(table(['file', 'raw', 'gzip'], rows));

if (process.env.GITHUB_STEP_SUMMARY) {
	appendFileSync(
		process.env.GITHUB_STEP_SUMMARY,
		`## First load of ${ROUTE} (bytes)\n\n${markdown(['file', 'raw', 'gzip'], rows)}\n\n`
	);
}

const total = sum(js, 'gz');
if (total > JS_BUDGET) {
	console.error(`gzipped JavaScript ${fmt(total)} B exceeds the ${fmt(JS_BUDGET)} B budget`);
	process.exit(1);
}
console.log(`gzipped JavaScript ${fmt(total)} B is within the ${fmt(JS_BUDGET)} B budget`);

function routeNodes(source, id) {
	const re =
		/id:\s*"([^"]*)",[\s\S]*?page:\s*\{\s*layouts:\s*\[([\d,\s]*)\],\s*errors:\s*\[[^\]]*\],\s*leaf:\s*(\d+)/g;
	for (const m of source.matchAll(re)) {
		if (m[1] !== id) continue;
		const layouts = m[2]
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)
			.map(Number);
		return { layouts, leaf: Number(m[3]) };
	}
	throw new Error(`route ${id} not found in manifest-full.js`);
}

function sourceOf(entry) {
	if (!entry.startsWith('pages/')) return entry;
	return (
		'src/routes/' +
		entry
			.slice('pages/'.length)
			.replace(/(^|\/)_/, '$1+')
			.replace(/\.js$/, '')
	);
}

function fmt(n) {
	return n.toLocaleString('en-US');
}

function table(head, rows) {
	const widths = head.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
	const line = (r) =>
		r.map((c, i) => (/^[\d,]+$/.test(c) ? c.padStart(widths[i]) : c.padEnd(widths[i]))).join('  ');
	return [line(head), ...rows.map(line)].join('\n') + '\n';
}

function markdown(head, rows) {
	const line = (r) => `| ${r.map((c) => (c.includes('/') ? `\`${c}\`` : c)).join(' | ')} |`;
	return [line(head), line(head.map((_, i) => (i ? '---:' : '---'))), ...rows.map(line)].join('\n');
}
