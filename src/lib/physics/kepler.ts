/** JD 2451545.0 TT as a Unix millisecond timestamp (TT leads UTC by 64.184 s at that epoch). */
export const J2000_MS = 946_727_935_816;

export interface Elements {
	/** Semi-major axis, m. */
	a: number;
	e: number;
	/** Sidereal period, s. */
	period: number;
	/** Argument of periapsis, rad. */
	omega: number;
	/** Mean anomaly at J2000.0, rad. */
	m0: number;
}

export interface KeplerState {
	x: number;
	y: number;
	vx: number;
	vy: number;
	r: number;
}

export function meanAnomaly(el: Elements, secondsSinceJ2000: number): number {
	const m = el.m0 + (2 * Math.PI * secondsSinceJ2000) / el.period;
	return ((m % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
}

/** Solve Kepler's equation M = E - e sin E by Newton's method. */
export function eccentricAnomaly(m: number, e: number): number {
	let big = e < 0.8 ? m : Math.PI;
	for (let i = 0; i < 30; i++) {
		const f = big - e * Math.sin(big) - m;
		const d = 1 - e * Math.cos(big);
		const step = f / d;
		big -= step;
		if (Math.abs(step) < 1e-14) break;
	}
	return big;
}

/** Position and velocity in the plate plane at a moment, periapsis rotated by omega. */
export function keplerState(el: Elements, secondsSinceJ2000: number): KeplerState {
	const m = meanAnomaly(el, secondsSinceJ2000);
	const bigE = eccentricAnomaly(m, el.e);
	const b = el.a * Math.sqrt(1 - el.e * el.e);
	const n = (2 * Math.PI) / el.period;
	const px = el.a * (Math.cos(bigE) - el.e);
	const py = b * Math.sin(bigE);
	const dE = n / (1 - el.e * Math.cos(bigE));
	const pvx = -el.a * Math.sin(bigE) * dE;
	const pvy = b * Math.cos(bigE) * dE;
	const c = Math.cos(el.omega);
	const s = Math.sin(el.omega);
	return {
		x: c * px - s * py,
		y: s * px + c * py,
		vx: c * pvx - s * pvy,
		vy: s * pvx + c * pvy,
		r: Math.hypot(px, py)
	};
}
