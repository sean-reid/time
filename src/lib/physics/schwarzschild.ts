import { C2, G } from './constants';

export function schwarzschildRadius(mass: number): number {
	return (2 * G * mass) / C2;
}

/** 1 - sqrt(1 - x) without cancellation; x in [0, 1]. */
export function sqrtDeficit(x: number): number {
	return x / (1 + Math.sqrt(1 - x));
}

/** Rate deficit 1 - dτ/dt of a clock held still at radius r. */
export function staticDeficit(mass: number, r: number): number {
	return sqrtDeficit(schwarzschildRadius(mass) / r);
}

export function staticRate(mass: number, r: number): number {
	return 1 - staticDeficit(mass, r);
}

/** Proper acceleration needed to hover at r, m/s². */
export function hoverAcceleration(mass: number, r: number): number {
	const rs = schwarzschildRadius(mass);
	return (G * mass) / (r * r * Math.sqrt(1 - rs / r));
}

export function photonSphere(mass: number): number {
	return 1.5 * schwarzschildRadius(mass);
}

export function isco(mass: number): number {
	return 3 * schwarzschildRadius(mass);
}

/** Rate deficit of a clock on a circular orbit at r, gravity and speed combined. */
export function circularOrbitDeficit(mass: number, r: number): number {
	return sqrtDeficit(1.5 * (schwarzschildRadius(mass) / r));
}

/** Speed of a circular orbiter as measured by a static observer at r. */
export function circularOrbitLocalSpeed(mass: number, r: number): number {
	return Math.sqrt((G * mass) / (r - schwarzschildRadius(mass)));
}

/** Coordinate period of a circular orbit, identical to the Newtonian value. */
export function circularOrbitPeriod(mass: number, r: number): number {
	return 2 * Math.PI * Math.sqrt((r * r * r) / (G * mass));
}
