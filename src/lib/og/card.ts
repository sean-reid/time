import type { Body } from '$lib/catalogue';
import { formatLength, formatRelativeRate } from '$lib/format';
import { earthReferenceDeficit, Trajectory, type FlightSample, type Plan } from '$lib/physics';
import { fieldFor, solarDeficit, spaceFor } from '$lib/sim/defaults';

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

const PAPER = '#f5f2eb';
const INK = '#16150f';
const INK_SOFT = '#5f5b52';
const ACCENT = '#b23a1d';
const FONT = 'Schibsted Grotesk';

const MARGIN = 72;
const DRAWING_RADIUS = 210;
const DRAWING_CX = CARD_WIDTH - MARGIN - DRAWING_RADIUS;
const DRAWING_CY = CARD_HEIGHT / 2;
const TEXT_WIDTH = DRAWING_CX - DRAWING_RADIUS - 60 - MARGIN;
const HAIRLINE = 1.5;
/** A card never integrates more than this many start orbits, whatever the link asks for. */
const CARD_MAX_PERIODS = 20;
const MAX_PATH_POINTS = 600;

/** Glyphs the latin subset of the site font lacks, swapped for the same mark in a codepoint it has. */
const GLYPHS: Record<string, string> = { '\u03bc': '\u00b5', '\u2009': ' ' };

const SUPERSCRIPTS: Record<string, string> = {
	'⁻': '-',
	'⁰': '0',
	'¹': '1',
	'²': '2',
	'³': '3',
	'⁴': '4',
	'⁵': '5',
	'⁶': '6',
	'⁷': '7',
	'⁸': '8',
	'⁹': '9'
};

function escape(text: string): string {
	return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

/** Escaped text with superscript runs raised by tspan, since the subset has no superscript digits. */
function typeset(text: string): string {
	const mapped = text.replace(/[\u03bc\u2009]/g, (c) => GLYPHS[c]);
	return escape(mapped).replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (run) => {
		const digits = [...run].map((c) => SUPERSCRIPTS[c]).join('');
		return `<tspan baseline-shift="0.5em" font-size="60%">${digits}</tspan>`;
	});
}

function nameSize(name: string): number {
	return Math.min(88, Math.floor(TEXT_WIDTH / (0.58 * name.length)));
}

function round(n: number): string {
	return n.toFixed(1).replace(/\.0$/, '');
}

function project(s: { r: number; phi: number }, scale: number): [number, number] {
	return [DRAWING_CX + s.r * Math.cos(s.phi) * scale, DRAWING_CY - s.r * Math.sin(s.phi) * scale];
}

function pathFor(samples: FlightSample[], scale: number): string {
	if (samples.length < 2) return '';
	const step = Math.max(1, Math.ceil(samples.length / MAX_PATH_POINTS));
	const points = samples.filter((_, i) => i % step === 0 || i === samples.length - 1);
	const d = points
		.map((s, i) => `${i === 0 ? 'M' : 'L'}${project(s, scale).map(round).join(' ')}`)
		.join('');
	return `<path d="${d}" fill="none" stroke="${ACCENT}" stroke-width="${HAIRLINE}" stroke-linejoin="round"/>`;
}

/** The share card for a scene: paper, the body as an ink disc, the flight in accent, and the result where it stands. */
export function cardSvg(body: Body, plan: Plan, wallMs = Date.now()): string {
	const field = fieldFor(body);
	const started = plan.start.r > field.surface;
	const traj = started ? new Trajectory(spaceFor(body, wallMs), plan) : null;
	if (traj) {
		const period = field.orbitPeriod(plan.start.r, plan.start.direction);
		const lastAt = Math.max(0, ...plan.manoeuvres.map((m) => m.at));
		const span = Math.min(Math.max(2 * period, lastAt + period), CARD_MAX_PERIODS * period);
		for (let i = 0; i < 2 && !traj.ending && traj.last.t < span; i++) traj.ensure(span);
	}
	const samples: FlightSample[] = traj ? traj.samples : [];
	const end = traj ? traj.last : null;
	const stopped = !traj || traj.ending?.kind === 'horizon' || !end || !Number.isFinite(end.deficit);
	const solar = solarDeficit(body);
	const deficit = stopped ? 1 : end!.deficit + solar - end!.deficit * solar;
	const rate = formatRelativeRate(deficit, earthReferenceDeficit());
	const floor = field.horizon === null ? 'surface' : 'horizon';
	const altitude = end ? end.r - field.surface : 0;
	const where =
		!end || altitude < 1 || traj?.ending
			? `at the ${floor}`
			: `${formatLength(altitude)} above the ${floor}`;

	const extent = Math.max(field.surface, plan.start.r, ...samples.map((s) => s.r));
	const scale = DRAWING_RADIUS / extent;
	const [endX, endY] = end ? project(end, scale) : [DRAWING_CX, DRAWING_CY];

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">
<rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="${PAPER}"/>
<g font-family="${FONT}">
<text x="${MARGIN}" y="${MARGIN + 22}" font-size="28" font-weight="600" fill="${INK}">time</text>
<text x="${MARGIN}" y="430" font-size="${nameSize(body.name)}" font-weight="600" fill="${INK}">${typeset(body.name)}</text>
<text x="${MARGIN}" y="500" font-size="38" fill="${INK}">${typeset(rate)}</text>
<text x="${MARGIN}" y="552" font-size="30" fill="${INK_SOFT}">${typeset(where)}</text>
</g>
${pathFor(samples, scale)}
<circle cx="${DRAWING_CX}" cy="${DRAWING_CY}" r="${round(Math.max(2, field.surface * scale))}" fill="${INK}"/>
<circle cx="${round(endX)}" cy="${round(endY)}" r="6" fill="${ACCENT}"/>
</svg>
`;
}
