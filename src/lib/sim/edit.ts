import type { Course, Dwell, Field, Waypoint } from '$lib/physics';

export type { Dwell };

export const CRUISE_SPEEDS = [
	1e4, 1e5, 1e6, 2_997_924.58, 29_979_245.8, 149_896_229, 269_813_212.2
];

export function toPolar(x: number, y: number): { r: number; phi: number } {
	return { r: Math.hypot(x, y), phi: Math.atan2(y, x) };
}

/** Snap a radius onto the nearest candidate ring when it lies within `tolerance` metres. */
export function snapRadius(r: number, candidates: readonly number[], tolerance: number): number {
	let best = r;
	let bestGap = tolerance;
	for (const c of candidates) {
		const gap = Math.abs(c - r);
		if (gap < bestGap) {
			best = c;
			bestGap = gap;
		}
	}
	return best;
}

/** Smallest radius a waypoint may take: just outside the surface or horizon. */
export function floorRadius(field: Field): number {
	return field.surface * 1.0005;
}

/** Dwelling needs open space; a pass-through may aim inside, which ends the flight at the surface or horizon. */
export function clampWaypoint(w: Waypoint, field: Field): Waypoint {
	if (!w.dwell) return { ...w, r: Math.max(0, w.r) };
	const r = Math.max(floorRadius(field), w.r);
	if (w.dwell.kind === 'orbit' && r < field.photonOrbit(w.dwell.direction) * 1.001) {
		return { ...w, r, dwell: { kind: 'hover', duration: 60 } };
	}
	return { ...w, r };
}

export function addWaypoint(course: Course, w: Waypoint, field: Field): Course {
	return { ...course, waypoints: [...course.waypoints, clampWaypoint(w, field)] };
}

export function updateWaypoint(
	course: Course,
	i: number,
	patch: Partial<Waypoint>,
	field: Field
): Course {
	const waypoints = course.waypoints.map((w, k) =>
		k === i ? clampWaypoint({ ...w, ...patch }, field) : w
	);
	return { ...course, waypoints };
}

export function removeWaypoint(course: Course, i: number): Course {
	return { ...course, waypoints: course.waypoints.filter((_, k) => k !== i) };
}

export function setDwell(
	course: Course,
	i: number,
	dwell: Dwell | undefined,
	field: Field
): Course {
	return updateWaypoint(course, i, { dwell }, field);
}

/** Whether a circular orbit can exist at r; between photon sphere and ISCO it exists but needs a steadying hand. */
export function orbitStatus(
	field: Field,
	r: number,
	direction: 1 | -1
): 'stable' | 'unstable' | 'none' {
	if (r <= field.photonOrbit(direction)) return 'none';
	if (r < field.isco(direction)) return 'unstable';
	return 'stable';
}
