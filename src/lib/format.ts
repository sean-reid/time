import { relativeRateMinusOne } from '$lib/physics/earth';

const SECOND_UNITS: [number, string][] = [
	[365.25 * 86400, 'y'],
	[86400, 'd'],
	[3600, 'h'],
	[60, 'min'],
	[1, 's'],
	[1e-3, 'ms'],
	[1e-6, 'μs'],
	[1e-9, 'ns']
];

/** Signed duration in seconds, scaled to the largest unit that keeps the mantissa at least 1. */
export function formatDrift(seconds: number): string {
	const sign = seconds < 0 ? '−' : '+';
	const abs = Math.abs(seconds);
	if (abs < 1e-9) return `${sign}0 ns`;
	const [scale, unit] =
		SECOND_UNITS.find(([s]) => abs >= s) ?? SECOND_UNITS[SECOND_UNITS.length - 1];
	const value = abs / scale;
	const digits = value >= 100 ? 1 : value >= 10 ? 2 : 3;
	return `${sign}${value.toFixed(digits)} ${unit}`;
}

/** Wall-clock digits HH:MM:SS.d in the local zone for a Unix millisecond timestamp. */
export function formatClock(ms: number): string {
	const d = new Date(ms);
	const hh = String(d.getHours()).padStart(2, '0');
	const mm = String(d.getMinutes()).padStart(2, '0');
	const ss = String(d.getSeconds()).padStart(2, '0');
	const tenth = Math.floor((ms % 1000) / 100);
	return `${hh}:${mm}:${ss}.${tenth}`;
}

/** Rate offset from 1, rendered as a per-day drift: "38.6 μs per day fast". */
export function formatRatePerDay(ratio: number): string {
	const perDay = (ratio - 1) * 86400;
	const word = perDay >= 0 ? 'fast' : 'slow';
	return `${formatDrift(Math.abs(perDay)).slice(1)} per day ${word}`;
}

const THIN_SPACE = '\u2009';

const METRE_UNITS: [number, string][] = [
	[9.4607e15, 'ly'],
	[1.495978707e11, 'AU'],
	[1e3, 'km'],
	[1, 'm']
];

/** Percent with at most one decimal and no trailing zero: 90%, 0.5%. */
export function formatPercent(fraction: number): string {
	const v = fraction * 100;
	return `${v >= 10 ? Math.round(v) : Number(v.toPrecision(2))}%`;
}

/** Kilometres stay kilometres until 0.1 AU; a scale bar keeps round kilometre figures. */
export function formatLength(metres: number, opts: { roundKm?: boolean } = {}): string {
	const auCut = opts.roundKm ? 1e12 : 1.495978707e10;
	const [scale, unit] =
		METRE_UNITS.find(([s, u]) => metres >= (u === 'AU' ? auCut : s)) ??
		METRE_UNITS[METRE_UNITS.length - 1];
	const value = metres / scale;
	const text =
		value >= 1000
			? Math.round(value).toLocaleString('en-US').replaceAll(',', THIN_SPACE)
			: String(Number(value.toPrecision(3)));
	return `${text} ${unit}`;
}

const SUPERSCRIPT: Record<string, string> = {
	'-': '⁻',
	'0': '⁰',
	'1': '¹',
	'2': '²',
	'3': '³',
	'4': '⁴',
	'5': '⁵',
	'6': '⁶',
	'7': '⁷',
	'8': '⁸',
	'9': '⁹'
};

function superscript(n: number): string {
	return String(n)
		.split('')
		.map((c) => SUPERSCRIPT[c] ?? c)
		.join('');
}

/** Three significant figures without exponent notation, grouped with thin spaces above 999. */
function sig3(x: number): string {
	const v = Number(x.toPrecision(3));
	if (v >= 1000) return Math.round(v).toLocaleString('en-US').replaceAll(',', THIN_SPACE);
	return String(v);
}

/** A positive multiplier: 1.41, 12.3, 3 200, or 3.2×10⁹. */
export function formatMultiplier(x: number): string {
	if (!Number.isFinite(x)) return '∞';
	if (x < 10) return x.toFixed(2);
	if (x < 100) return x.toFixed(1);
	if (x < 1e5) return Math.round(x).toLocaleString('en-US').replaceAll(',', THIN_SPACE);
	let exp = Math.floor(Math.log10(x));
	let mantissa = Number((x / 10 ** exp).toFixed(1));
	if (mantissa >= 10) {
		mantissa = 1;
		exp += 1;
	}
	return `${mantissa.toFixed(1)}×10${superscript(exp)}`;
}

/** Ship rate against Earth from the two deficits, as a sentence fragment. */
export function formatRelativeRate(shipDeficit: number, earthDeficit: number): string {
	if (shipDeficit >= 1) return 'stopped, as Earth sees it';
	const ratioMinusOne = relativeRateMinusOne(shipDeficit, earthDeficit);
	if (Math.abs(ratioMinusOne) < 1e-3) return formatRatePerDay(1 + ratioMinusOne);
	const times = (m: string) => (m.includes('×10') ? `${m} times` : `${m}×`);
	if (ratioMinusOne < 0)
		return `Earth runs ${times(formatMultiplier(1 / (1 + ratioMinusOne)))} faster`;
	return `you run ${times(formatMultiplier(1 + ratioMinusOne))} faster`;
}

const STANDARD_GRAVITY = 9.80665;

export function formatThrust(accel: number): string {
	const g = accel / STANDARD_GRAVITY;
	if (!Number.isFinite(g)) return 'beyond any engine';
	if (g === 0) return '0 g, free fall';
	if (g < 1e-3) return `${sig3(g * 1e6)} μg`;
	if (g < 1) return `${g.toPrecision(2)} g`;
	return `${formatMultiplier(g)} g`;
}

export function formatSpeed(v: number): string {
	const c = 299_792_458;
	if (v >= 0.01 * c) return `${(v / c).toFixed(v / c >= 0.1 ? 2 : 3)} c`;
	if (v >= 1e3) return `${sig3(v / 1e3)} km/s`;
	if (v === 0) return '0 m/s';
	return `${v.toPrecision(3)} m/s`;
}

function split(whole: number, per: number, bigUnit: string, smallUnit: string): string {
	const big = Math.floor(whole / per);
	const small = whole - big * per;
	return small === 0 ? `${big} ${bigUnit}` : `${big} ${bigUnit} ${small} ${smallUnit}`;
}

/** A span of seconds as people say it: 11 h 58 min, 88 d, 1.2 y, 2.3 ms. */
export function formatDuration(seconds: number): string {
	if (!Number.isFinite(seconds)) return '∞';
	const s = Math.abs(seconds);
	if (s < 1) return formatDrift(s).slice(1);
	if (s < 60) return `${sig3(s)} s`;
	const whole = Math.round(s);
	if (whole < 3600) return split(whole, 60, 'min', 's');
	const minutes = Math.round(s / 60);
	if (minutes < 1440) return split(minutes, 60, 'h', 'min');
	if (s < 365.25 * 86400) return `${sig3(s / 86400)} d`;
	return `${sig3(s / (365.25 * 86400))} y`;
}

/** How fast the simulation runs: 1× real time, or one real second per simulated span. */
export function formatWarp(warp: number): string {
	if (warp === 1) return '1× real time';
	return `${formatMultiplier(warp)}×, 1 s = ${formatDuration(warp)}`;
}
