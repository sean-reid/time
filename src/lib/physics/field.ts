import {
	kerrHoverAcceleration,
	kerrHoverDeficit,
	kerrIsco,
	kerrOrbitDeficit,
	kerrOrbitPeriod,
	kerrPhotonOrbit,
	outerHorizon,
	type Direction
} from './kerr';
import {
	circularOrbitDeficit,
	circularOrbitLocalSpeed,
	circularOrbitPeriod,
	hoverAcceleration,
	isco,
	movingDeficit,
	photonSphere,
	schwarzschildRadius,
	sqrtDeficit,
	staticDeficit
} from './schwarzschild';
import { C2 } from './constants';

export interface FieldSource {
	mass: number;
	spin?: number;
	radius?: number;
}

/** Everything the simulator asks of one central body, Schwarzschild or Kerr. */
export interface Field {
	mass: number;
	spin: number;
	/** Surface radius, or the outer horizon for a black hole. */
	surface: number;
	horizon: number | null;
	photonOrbit(direction: Direction): number;
	isco(direction: Direction): number;
	hoverDeficit(r: number): number;
	hoverAcceleration(r: number): number;
	orbitDeficit(r: number, direction: Direction): number;
	orbitPeriod(r: number, direction: Direction): number;
	orbitLocalSpeed(r: number): number;
	movingDeficit(r: number, v: number): number;
	/** Radial proper length per unit coordinate radius at r. */
	radialStretch(r: number): number;
}

export function makeField(src: FieldSource): Field {
	const { mass } = src;
	const spin = src.spin ?? 0;
	const kerr = spin !== 0;
	const rs = schwarzschildRadius(mass);
	const horizon = src.radius === undefined ? (kerr ? outerHorizon(mass, spin) : rs) : null;
	return {
		mass,
		spin,
		surface: src.radius ?? horizon!,
		horizon,
		photonOrbit: (d) => (kerr ? kerrPhotonOrbit(mass, spin, d) : photonSphere(mass)),
		isco: (d) => (kerr ? kerrIsco(mass, spin, d) : isco(mass)),
		hoverDeficit: (r) => (kerr ? kerrHoverDeficit(mass, spin, r) : staticDeficit(mass, r)),
		hoverAcceleration: (r) =>
			kerr ? kerrHoverAcceleration(mass, spin, r) : hoverAcceleration(mass, r),
		orbitDeficit: (r, d) =>
			kerr ? kerrOrbitDeficit(mass, spin, r, d) : circularOrbitDeficit(mass, r),
		orbitPeriod: (r, d) =>
			kerr ? kerrOrbitPeriod(mass, spin, r, d) : circularOrbitPeriod(mass, r),
		orbitLocalSpeed: (r) => circularOrbitLocalSpeed(mass, r),
		movingDeficit: (r, v) => {
			if (!kerr) return movingDeficit(mass, r, v);
			const g = kerrHoverDeficit(mass, spin, r);
			const k = sqrtDeficit((v * v) / C2);
			return g + k - g * k;
		},
		radialStretch: (r) => {
			if (!kerr) return 1 / Math.sqrt(Math.max(1e-12, 1 - rs / r));
			const m = rs / 2;
			const delta = r * r - 2 * m * r + (spin * m) ** 2;
			return r / Math.sqrt(Math.max(1e-12 * r * r, delta));
		}
	};
}
