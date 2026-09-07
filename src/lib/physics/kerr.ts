import { C, C2, G } from './constants';
import { sqrtDeficit } from './schwarzschild';

export type Direction = 1 | -1;

/** Gravitational radius GM/c² in metres; Kerr formulas below are in units of it. */
export function gravitationalRadius(mass: number): number {
	return (G * mass) / C2;
}

export function outerHorizon(mass: number, spin: number): number {
	return gravitationalRadius(mass) * (1 + Math.sqrt(1 - spin * spin));
}

/** Equatorial ergosphere boundary; inside it nothing can stay still. */
export function ergosphere(mass: number): number {
	return 2 * gravitationalRadius(mass);
}

/** Bardeen, Press and Teukolsky 1972, equatorial circular photon orbit. */
export function kerrPhotonOrbit(mass: number, spin: number, direction: Direction): number {
	const m = gravitationalRadius(mass);
	return 2 * m * (1 + Math.cos((2 / 3) * Math.acos(-direction * spin)));
}

/** Bardeen, Press and Teukolsky 1972, innermost stable circular orbit. */
export function kerrIsco(mass: number, spin: number, direction: Direction): number {
	const m = gravitationalRadius(mass);
	const a2 = spin * spin;
	const z1 = 1 + Math.cbrt(1 - a2) * (Math.cbrt(1 + spin) + Math.cbrt(1 - spin));
	const z2 = Math.sqrt(3 * a2 + z1 * z1);
	return m * (3 + z2 - direction * Math.sqrt((3 - z1) * (3 + z1 + 2 * z2)));
}

/** Rate deficit 1 - dτ/dt on an equatorial circular orbit, prograde or retrograde. */
export function kerrOrbitDeficit(
	mass: number,
	spin: number,
	r: number,
	direction: Direction
): number {
	const m = gravitationalRadius(mass);
	const x = r / m;
	const a = direction * spin;
	const num = x ** 0.75 * Math.sqrt(x ** 1.5 - 3 * Math.sqrt(x) + 2 * a);
	const den = x ** 1.5 + a;
	const rate = num / den;
	return spin === 0 ? sqrtDeficit(3 / x) : 1 - rate;
}

/** Coordinate period of an equatorial circular orbit. */
export function kerrOrbitPeriod(
	mass: number,
	spin: number,
	r: number,
	direction: Direction
): number {
	const m = gravitationalRadius(mass);
	const x = r / m;
	return (2 * Math.PI * m * (x ** 1.5 + direction * spin)) / C;
}

/** Lapse of the zero angular momentum observer at the equator: dτ/dt for a ship holding radius. */
function zamoLapse(x: number, spin: number): number {
	const a2 = spin * spin;
	const delta = x * x - 2 * x + a2;
	const bigA = (x * x + a2) ** 2 - a2 * delta;
	return Math.sqrt((delta * x * x) / bigA);
}

/** Rate deficit of a ship holding radius r against the pull, co-rotating with dragged space. */
export function kerrHoverDeficit(mass: number, spin: number, r: number): number {
	const x = r / gravitationalRadius(mass);
	if (spin === 0) return sqrtDeficit(2 / x);
	return 1 - zamoLapse(x, spin);
}

/** Proper acceleration to hold radius r as a zero angular momentum observer, m/s². */
export function kerrHoverAcceleration(mass: number, spin: number, r: number): number {
	const m = gravitationalRadius(mass);
	const x = r / m;
	const h = 1e-6 * x;
	const alpha = zamoLapse(x, spin);
	const dAlpha = (zamoLapse(x + h, spin) - zamoLapse(x - h, spin)) / (2 * h);
	const delta = x * x - 2 * x + spin * spin;
	const geometric = (dAlpha / alpha) * Math.sqrt(delta / (x * x));
	return (geometric * C2) / m;
}
