import { C } from './constants';
import { angularRates, circularOrbit, geometricUnits, metricAt, toLocal } from './geodesic';
import {
	ergosphere,
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
	photonSphere,
	schwarzschildRadius,
	staticDeficit
} from './schwarzschild';

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
	/** Equatorial ergosphere radius of a spinning hole, else null. */
	ergosphere: number | null;
	photonOrbit(direction: Direction): number;
	isco(direction: Direction): number;
	hoverDeficit(r: number): number;
	hoverAcceleration(r: number): number;
	orbitDeficit(r: number, direction: Direction): number;
	orbitPeriod(r: number, direction: Direction): number;
	orbitLocalSpeed(r: number, direction?: Direction): number;
	/** Radial proper length per unit coordinate radius at r. */
	radialStretch(r: number): number;
}

/** Speed of a circular equatorial orbiter as measured by the zero angular momentum observer there. */
function kerrOrbitLocalSpeed(mass: number, spin: number, r: number, direction: Direction): number {
	const x = r / geometricUnits(mass).length;
	const { E, L } = circularOrbit(x, spin, direction);
	const { ut, up } = angularRates(metricAt(x, spin), E, L);
	const v = toLocal(x, spin, ut, up, 0);
	return C * Math.abs(v.vphi);
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
		ergosphere: horizon !== null && kerr ? ergosphere(mass) : null,
		photonOrbit: (d) => (kerr ? kerrPhotonOrbit(mass, spin, d) : photonSphere(mass)),
		isco: (d) => (kerr ? kerrIsco(mass, spin, d) : isco(mass)),
		hoverDeficit: (r) => (kerr ? kerrHoverDeficit(mass, spin, r) : staticDeficit(mass, r)),
		hoverAcceleration: (r) =>
			kerr ? kerrHoverAcceleration(mass, spin, r) : hoverAcceleration(mass, r),
		orbitDeficit: (r, d) =>
			kerr ? kerrOrbitDeficit(mass, spin, r, d) : circularOrbitDeficit(mass, r),
		orbitPeriod: (r, d) =>
			kerr ? kerrOrbitPeriod(mass, spin, r, d) : circularOrbitPeriod(mass, r),
		orbitLocalSpeed: (r, direction = 1) =>
			kerr ? kerrOrbitLocalSpeed(mass, spin, r, direction) : circularOrbitLocalSpeed(mass, r),
		radialStretch: (r) => {
			if (!kerr) return 1 / Math.sqrt(Math.max(1e-12, 1 - rs / r));
			const m = rs / 2;
			const delta = r * r - 2 * m * r + (spin * m) ** 2;
			return r / Math.sqrt(Math.max(1e-12 * r * r, delta));
		}
	};
}
