import type { Body } from '$lib/catalogue';
import { makeField, type Field, type FieldSource, type Plan, type Space } from '$lib/physics';
import { J2000_MS } from '$lib/physics';

export function fieldSource(body: Body): FieldSource {
	return { mass: body.mass.value, spin: body.spin?.value, radius: body.radius?.value };
}

export function fieldFor(body: Body): Field {
	return makeField(fieldSource(body));
}

const COMPACT = new Set(['black-hole', 'neutron-star', 'magnetar', 'white-dwarf']);

/** Geodesics around compact bodies; Newtonian motion with a post-Newtonian clock elsewhere. */
export function regimeFor(body: Body): Space['regime'] {
	return COMPACT.has(body.kind) ? 'geodesic' : 'newtonian';
}

/** Seconds from J2000.0 to a wall-clock instant, so companions sit where they really are. */
export function epochSeconds(wallMs: number): number {
	return (wallMs - J2000_MS) / 1000;
}

export function spaceFor(body: Body, wallMs: number): Space {
	return {
		field: fieldFor(body),
		regime: regimeFor(body),
		attractors: [],
		epoch: epochSeconds(wallMs)
	};
}

/** Where a visitor starts around a body: a named orbit if there is one, else a telling radius. */
export function defaultStartRadius(body: Body, field: Field): number {
	const named = body.orbits?.find((o) => o.id === 'gps') ?? body.orbits?.[0];
	if (named) return named.radius.value;
	if (body.kind === 'black-hole') return 2 * field.isco(1);
	if (body.kind === 'neutron-star' || body.kind === 'magnetar') {
		return Math.max(2 * field.surface, 1.2 * field.isco(1));
	}
	if (body.kind === 'star' || body.kind === 'white-dwarf') return 3 * field.surface;
	return 1.5 * field.surface;
}

export function defaultPlan(body: Body, field: Field): Plan {
	return {
		start: { r: defaultStartRadius(body, field), phi: -Math.PI / 4, kind: 'orbit', direction: 1 },
		manoeuvres: []
	};
}

export interface Camera {
	/** Metres visible across the shorter side of the plate. */
	frame: number;
	cx: number;
	cy: number;
	follow: boolean;
}

export function defaultCamera(plan: Plan): Camera {
	return { frame: 2.6 * plan.start.r, cx: 0, cy: 0, follow: false };
}

export const WARPS = [1, 10, 60, 600, 3600, 86_400, 604_800, 2_629_800, 31_557_600];
