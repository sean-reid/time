import { describe, expect, it } from 'vitest';
import { Trajectory } from '$lib/physics';
import { spaceFor } from '$lib/sim/defaults';
import { tourById, tours } from './index';

describe('tours', () => {
	it('every tour integrates cleanly and every stop comes true in order', () => {
		for (const tour of tours) {
			const traj = new Trajectory(spaceFor(tour.body, Date.now()), tour.plan);
			traj.ensure(3600);
			expect(Number.isFinite(traj.last.tau)).toBe(true);
			for (let i = 0; i < 40 && !traj.ending; i++) traj.ensure(traj.last.t * 2 + 86400);
			let reached = 0;
			for (const sample of traj.samples) {
				const ended = traj.ending && sample === traj.last;
				const phase = ended ? (traj.ending!.kind === 'horizon' ? 'horizon' : 'landed') : 'coasting';
				const scene = { ship: { ...sample, phase } } as unknown as Parameters<
					(typeof tour.stops)[number]['when']
				>[1];
				while (reached + 1 < tour.stops.length && tour.stops[reached + 1].when(sample, scene))
					reached++;
			}
			expect(reached, `${tour.id} reaches every stop`).toBe(tour.stops.length - 1);
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
