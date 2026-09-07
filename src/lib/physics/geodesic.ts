import { C, G } from './constants';

/**
 * Equatorial Kerr geodesics in Boyer-Lindquist coordinates with G = c = M = 1, so r is in
 * gravitational radii and t in gravitational radii of light travel. Callers scale to SI.
 */
export interface Metric {
	gtt: number;
	gtp: number;
	gpp: number;
	grr: number;
	dgtt: number;
	dgtp: number;
	dgpp: number;
	dgrr: number;
}

export function metricAt(r: number, a: number): Metric {
	const delta = r * r - 2 * r + a * a;
	const grr = (r * r) / delta;
	return {
		gtt: -(1 - 2 / r),
		gtp: (-2 * a) / r,
		gpp: r * r + a * a + (2 * a * a) / r,
		grr,
		dgtt: -2 / (r * r),
		dgtp: (2 * a) / (r * r),
		dgpp: 2 * r - (2 * a * a) / (r * r),
		dgrr: (2 * r * delta - r * r * (2 * r - 2)) / (delta * delta)
	};
}

export interface GeoState {
	t: number;
	r: number;
	phi: number;
	/** dr/dτ */
	ur: number;
	/** Conserved energy per unit mass. */
	E: number;
	/** Conserved angular momentum per unit mass, positive counter-clockwise. */
	L: number;
}

/** dt/dτ and dφ/dτ from the conserved quantities at radius r. */
export function angularRates(m: Metric, E: number, L: number): { ut: number; up: number } {
	const det = m.gtt * m.gpp - m.gtp * m.gtp;
	return { ut: (-E * m.gpp - L * m.gtp) / det, up: (L * m.gtt + E * m.gtp) / det };
}

export function radialAcceleration(m: Metric, ut: number, up: number, ur: number): number {
	const grav = (m.dgtt * ut * ut + 2 * m.dgtp * ut * up + m.dgpp * up * up) / (2 * m.grr);
	return grav - (m.dgrr / (2 * m.grr)) * ur * ur;
}

/** Zero angular momentum observer frame at r: angular velocity of dragging and lapse. */
function zamo(m: Metric): { omega: number; alpha: number } {
	const omega = -m.gtp / m.gpp;
	return { omega, alpha: Math.sqrt(-m.gtt + (m.gtp * m.gtp) / m.gpp) };
}

/** Four-velocity from a velocity (as a fraction of c) measured in the local ZAMO frame. */
export function fromLocal(
	r: number,
	a: number,
	vr: number,
	vphi: number
): { ut: number; up: number; ur: number; E: number; L: number } {
	const m = metricAt(r, a);
	const { omega, alpha } = zamo(m);
	const v2 = vr * vr + vphi * vphi;
	const gamma = 1 / Math.sqrt(1 - Math.min(v2, 1 - 1e-12));
	const ut = gamma / alpha;
	const up = omega * ut + (gamma * vphi) / Math.sqrt(m.gpp);
	const ur = (gamma * vr) / Math.sqrt(m.grr);
	return { ut, up, ur, E: -(m.gtt * ut + m.gtp * up), L: m.gtp * ut + m.gpp * up };
}

/** Velocity in the local ZAMO frame from the four-velocity. */
export function toLocal(
	r: number,
	a: number,
	ut: number,
	up: number,
	ur: number
): { vr: number; vphi: number } {
	const m = metricAt(r, a);
	const { omega, alpha } = zamo(m);
	const gamma = alpha * ut;
	return {
		vr: (ur * Math.sqrt(m.grr)) / gamma,
		vphi: (Math.sqrt(m.gpp) * (up - omega * ut)) / gamma
	};
}

/** Constants of motion for a circular equatorial orbit, prograde (+1) or retrograde (-1). */
export function circularOrbit(
	r: number,
	a: number,
	direction: 1 | -1
): { E: number; L: number; ut: number } {
	const m = metricAt(r, a);
	const bigOmega = direction / (Math.pow(r, 1.5) + direction * a);
	const ut = 1 / Math.sqrt(-m.gtt - 2 * m.gtp * bigOmega - m.gpp * bigOmega * bigOmega);
	const up = bigOmega * ut;
	return { E: -(m.gtt * ut + m.gtp * up), L: m.gtp * ut + m.gpp * up, ut };
}

export function outerHorizonGeometric(a: number): number {
	return 1 + Math.sqrt(1 - a * a);
}

/** One adaptive RK4 step in proper time; returns the new state and the proper time advanced. */
export function stepGeodesic(
	s: GeoState,
	a: number,
	hCap: number
): { state: GeoState; dtau: number } {
	const deriv = (y: number[]) => {
		const m = metricAt(y[1], a);
		const { ut, up } = angularRates(m, s.E, s.L);
		return [ut, y[3], up, radialAcceleration(m, ut, up, y[3])];
	};
	const y0 = [s.t, s.r, s.phi, s.ur];
	const k1 = deriv(y0);
	const horizon = outerHorizonGeometric(a);
	const gap = Math.max(s.r - horizon, 1e-9);
	const h = Math.min(
		hCap,
		0.02 / Math.max(Math.abs(k1[2]), 1e-12),
		(0.002 * s.r) / Math.max(Math.abs(k1[3]), 1e-12),
		(0.05 * gap) / Math.max(Math.abs(k1[3]), 1e-12)
	);
	const add = (y: number[], k: number[], f: number) => y.map((v, i) => v + f * k[i]);
	const k2 = deriv(add(y0, k1, h / 2));
	const k3 = deriv(add(y0, k2, h / 2));
	const k4 = deriv(add(y0, k3, h));
	const y1 = y0.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
	return { state: { t: y1[0], r: y1[1], phi: y1[2], ur: y1[3], E: s.E, L: s.L }, dtau: h };
}

/** Gravitational radius GM/c² in metres and the matching time unit in seconds. */
export function geometricUnits(mass: number): { length: number; time: number } {
	const length = (G * mass) / (C * C);
	return { length, time: length / C };
}
