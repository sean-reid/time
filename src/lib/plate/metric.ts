/**
 * Proper radial distance from the horizon to coordinate radius r in a Schwarzschild field.
 * Lines of equal proper spacing crowd toward the horizon; far away they match coordinate spacing.
 */
export function properRadius(r: number, rs: number): number {
	if (rs <= 0) return r;
	if (r <= rs) return 0;
	const a = Math.sqrt(r);
	const b = Math.sqrt(r - rs);
	return a * b + rs * Math.log((a + b) / Math.sqrt(rs));
}

/** Coordinate radius at which the static clock rate equals `rate`. */
export function isochroneRadius(rs: number, rate: number): number {
	return rs / (1 - rate * rate);
}
