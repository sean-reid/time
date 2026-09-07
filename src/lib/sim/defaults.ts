import type { Body } from '$lib/catalogue';
import { C, makeField, type Course, type Field, type FieldSource } from '$lib/physics';

export function fieldSource(body: Body): FieldSource {
	return { mass: body.mass.value, spin: body.spin?.value, radius: body.radius?.value };
}

export function fieldFor(body: Body): Field {
	return makeField(fieldSource(body));
}

/** Where a visitor starts around a body: a named orbit if there is one, else a telling radius. */
export function defaultOrbitRadius(body: Body, field: Field): number {
	const named = body.orbits?.find((o) => o.id === 'gps') ?? body.orbits?.[0];
	if (named) return named.radius.value;
	if (body.kind === 'black-hole') return 2 * field.isco(1);
	if (body.kind === 'neutron-star' || body.kind === 'magnetar') {
		return Math.max(2 * field.surface, 1.2 * field.isco(1));
	}
	if (body.kind === 'star' || body.kind === 'white-dwarf') return 3 * field.surface;
	return 1.5 * field.surface;
}

export function defaultCruiseSpeed(field: Field, r: number): number {
	const v = 2 * field.orbitLocalSpeed(r);
	return Math.min(0.2 * C, Math.max(1e4, v));
}

export function defaultCourse(body: Body, field: Field): Course {
	const r = defaultOrbitRadius(body, field);
	return {
		cruiseSpeed: defaultCruiseSpeed(field, r),
		waypoints: [{ r, phi: -Math.PI / 4, dwell: { kind: 'orbit', revolutions: 1, direction: 1 } }]
	};
}

export interface Camera {
	/** Metres visible across the shorter side of the plate. */
	frame: number;
	cx: number;
	cy: number;
	follow: boolean;
}

export function defaultCamera(course: Course): Camera {
	const rMax = Math.max(...course.waypoints.map((w) => w.r));
	return { frame: 2.6 * rMax, cx: 0, cy: 0, follow: false };
}

export const WARPS = [1, 10, 60, 600, 3600, 86_400, 604_800, 2_629_800, 31_557_600];
