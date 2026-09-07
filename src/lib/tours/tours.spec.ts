import { describe, expect, it } from 'vitest';
import { Trajectory } from '$lib/physics';
import { spaceFor } from '$lib/sim/defaults';
import { tourById, tours } from './index';

describe('tours', () => {
	it('every tour flies for at least an hour of coordinate time without error', () => {
		for (const tour of tours) {
			const traj = new Trajectory(spaceFor(tour.body, Date.now()), tour.plan);
			traj.ensure(3600);
			expect(traj.last.t).toBeGreaterThan(0);
			expect(Number.isFinite(traj.last.tau)).toBe(true);
		}
	});

	it('the Sgr A* tour ends at the horizon', () => {
		const tour = tourById('sgr-a-star')!;
		const traj = new Trajectory(spaceFor(tour.body, Date.now()), tour.plan);
		for (let i = 0; i < 20 && !traj.ending; i++) traj.ensure(1e7);
		expect(traj.ending?.kind).toBe('horizon');
	});

	it('the GPS tour lands and the Sun dive reaches the photosphere', () => {
		for (const id of ['gps', 'sun']) {
			const tour = tourById(id)!;
			const traj = new Trajectory(spaceFor(tour.body, Date.now()), tour.plan);
			for (let i = 0; i < 40 && !traj.ending; i++) traj.ensure(traj.last.t * 2 + 86400);
			expect(traj.ending?.kind).toBe('surface');
		}
	});
});
