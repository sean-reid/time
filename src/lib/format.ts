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

export function formatLength(metres: number): string {
	const [scale, unit] =
		METRE_UNITS.find(([s]) => metres >= s) ?? METRE_UNITS[METRE_UNITS.length - 1];
	const value = metres / scale;
	const text =
		value >= 1000
			? Math.round(value).toLocaleString('en-US').replaceAll(',', THIN_SPACE)
			: String(Number(value.toPrecision(3)));
	return `${text} ${unit}`;
}
