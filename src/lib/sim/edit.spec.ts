import { describe, expect, it } from 'vitest';
import { GM_EARTH, G, M_SUN, makeField } from '$lib/physics';
import {
	addWaypoint,
	clampWaypoint,
	orbitStatus,
	removeWaypoint,
	setDwell,
	snapRadius,
	toPolar,
	updateWaypoint
} from './edit';

const earth = makeField({ mass: GM_EARTH / G, radius: 6.371e6 });
const hole = makeField({ mass: 10 * M_SUN });

describe('course editing', () => {
	it('snaps only within tolerance and to the nearest ring', () => {
		expect(snapRadius(100, [90, 105, 200], 10)).toBe(105);
		expect(snapRadius(100, [120, 200], 10)).toBe(100);
	});

	it('keeps dwelling waypoints outside the body but lets a pass-through aim inside', () => {
		const held = clampWaypoint({ r: 1e6, phi: 0, dwell: { kind: 'hover', duration: 1 } }, earth);
		expect(held.r).toBeGreaterThan(earth.surface);
		expect(clampWaypoint({ r: 1e6, phi: 0 }, earth).r).toBe(1e6);
	});

	it('turns an impossible orbit inside the photon sphere into a hover', () => {
		const w = clampWaypoint(
			{
				r: hole.photonOrbit(1) * 0.9,
				phi: 0,
				dwell: { kind: 'orbit', revolutions: 1, direction: 1 }
			},
			hole
		);
		expect(w.dwell?.kind).toBe('hover');
	});

	it('classifies orbits by stability', () => {
		expect(orbitStatus(hole, hole.isco(1) * 2, 1)).toBe('stable');
		expect(orbitStatus(hole, hole.isco(1) * 0.7, 1)).toBe('unstable');
		expect(orbitStatus(hole, hole.photonOrbit(1) * 0.9, 1)).toBe('none');
	});

	it('adds, updates, dwells and removes without mutating the input', () => {
		const base = { cruiseSpeed: 1e4, waypoints: [{ r: 2.6e7, phi: 0 }] };
		const added = addWaypoint(base, { r: 7e6, phi: 1 }, earth);
		expect(added.waypoints).toHaveLength(2);
		expect(base.waypoints).toHaveLength(1);
		const moved = updateWaypoint(added, 1, { phi: 2 }, earth);
		expect(moved.waypoints[1].phi).toBe(2);
		const dwelt = setDwell(moved, 1, { kind: 'hover', duration: 30 }, earth);
		expect(dwelt.waypoints[1].dwell).toEqual({ kind: 'hover', duration: 30 });
		expect(removeWaypoint(dwelt, 0).waypoints[0].r).toBe(7e6);
	});

	it('converts to polar', () => {
		const p = toPolar(0, 5);
		expect(p.r).toBe(5);
		expect(p.phi).toBeCloseTo(Math.PI / 2, 12);
	});
});
