import { describe, expect, it } from 'vitest';
import { bodyById } from '$lib/catalogue';
import { tourById, tourSnapshot } from '$lib/tours';
import { defaultStartRadius, fieldFor } from './defaults';
import { Scene } from './scene.svelte';
import { decodeScene, encodeScene } from './url';

/** Run the clock for a stretch of flight time at the current warp. */
function fly(scene: Scene, seconds: number) {
	scene.advance(seconds / scene.warp);
}

/** Fly far enough that the trajectory drops its oldest samples. */
function flyPastKeptPath(scene: Scene) {
	scene.warp = 604_800;
	while (scene.trajectory.samples[0].t === 0) fly(scene, 1e6);
}

describe('Scene', () => {
	it('starts on the default orbit with the clock at zero', () => {
		const scene = new Scene();
		expect(scene.body.id).toBe('earth');
		expect(scene.t).toBe(0);
		expect(scene.ship.phase).toBe('orbiting');
		expect(scene.ship.r).toBeCloseTo(defaultStartRadius(scene.body, scene.field), 0);
		expect(scene.plan.manoeuvres).toEqual([]);
	});

	it('kicks the running flight without replaying it', () => {
		const scene = new Scene();
		scene.warp = 600;
		fly(scene, 1200);
		const traj = scene.trajectory;
		const first = traj.samples[0];
		const before = scene.t;
		const speedBefore = scene.ship.speed;
		const dv = 500;
		scene.kick(dv, 'prograde');
		expect(scene.t).toBeGreaterThanOrEqual(before);
		expect(scene.trajectory).toBe(traj);
		expect(traj.samples[0]).toBe(first);
		expect(scene.plan.manoeuvres).toEqual([{ at: scene.t, kind: 'kick', dv, heading: 'prograde' }]);
		expect(scene.ship.speed).toBeCloseTo(speedBefore + dv, 0);
		expect(scene.ship.phase).toBe('coasting');
		fly(scene, 600);
		expect(scene.t).toBeGreaterThan(before);
		expect(scene.trajectory).toBe(traj);
	});

	it('replays the flight for a kick placed in the past', () => {
		const scene = new Scene();
		scene.warp = 600;
		fly(scene, 6000);
		const traj = scene.trajectory;
		scene.seek(1000);
		expect(scene.trajectory).toBe(traj);
		scene.kick(500, 'retrograde');
		expect(scene.trajectory).not.toBe(traj);
		expect(scene.t).toBe(1000);
		expect(scene.trajectory.samples[0].t).toBe(0);
		expect(scene.trajectory.last.t).toBeGreaterThanOrEqual(1000);
		expect(scene.ship.phase).toBe('coasting');
	});

	it('holds station and falls from rest when let go', () => {
		const scene = new Scene();
		scene.warp = 60;
		fly(scene, 120);
		scene.hold();
		const held = scene.ship;
		expect(held.holding).toBe(true);
		expect(held.phase).toBe('holding');
		expect(held.speed).toBe(0);
		expect(held.thrust).toBeGreaterThan(0);
		fly(scene, 600);
		expect(scene.ship.holding).toBe(true);
		expect(scene.ship.r).toBeCloseTo(held.r, 0);
		scene.letGo();
		expect(scene.plan.manoeuvres.map((m) => m.kind)).toEqual(['hold', 'kick']);
		fly(scene, 600);
		expect(scene.ship.holding).toBe(false);
		expect(scene.ship.phase).toBe('coasting');
		expect(scene.ship.r).toBeLessThan(held.r);
		expect(scene.ship.speed).toBeGreaterThan(0);
	});

	it('shows a hold, a release, and a kick at once while paused', () => {
		const scene = new Scene();
		scene.warp = 60;
		fly(scene, 120);
		scene.playing = false;
		const before = scene.ship.speed;
		scene.hold();
		expect(scene.ship.holding).toBe(true);
		scene.letGo();
		expect(scene.ship.holding).toBe(false);
		expect(scene.ship.speed).toBe(0);
		scene.kick(500, 'prograde');
		expect(scene.ship.speed).toBeCloseTo(500, 0);
		expect(before).toBeGreaterThan(1000);
	});

	it('treats a long frame gap as a short frame instead of leaping', () => {
		const scene = new Scene();
		scene.warp = 60;
		scene.advance(600);
		expect(scene.t).toBeLessThanOrEqual(0.25 * 60 + 1e-9);
		expect(scene.t).toBeGreaterThan(0);
	});

	it('restart clears the manoeuvres and returns the clock to zero', () => {
		const scene = new Scene();
		scene.warp = 600;
		fly(scene, 1200);
		scene.kick(500, 'retrograde');
		scene.playing = false;
		scene.restart();
		expect(scene.plan.manoeuvres).toEqual([]);
		expect(scene.t).toBe(0);
		expect(scene.playing).toBe(true);
		expect(scene.ship.phase).toBe('orbiting');
		expect(scene.trajectory.samples[0].t).toBe(0);
	});

	it('restart keeps a tour flight scripted', () => {
		const tour = tourById('gps')!;
		const scene = new Scene(tourSnapshot(tour));
		scene.tour = tour.id;
		fly(scene, 3600);
		scene.restart();
		expect(scene.tour).toBe('gps');
		expect(scene.plan.manoeuvres).toEqual(tour.plan.manoeuvres);
		expect(scene.t).toBe(0);
		fly(scene, tour.plan.manoeuvres[0].at + 60);
		expect(scene.ship.phase).toBe('coasting');
	});

	it('seeking before the kept path replays and catches up to the sought time', () => {
		const scene = new Scene();
		flyPastKeptPath(scene);
		const traj = scene.trajectory;
		const dropped = traj.samples[0].t;
		expect(dropped).toBeGreaterThan(0);
		const target = dropped / 2;
		scene.seek(target);
		expect(scene.trajectory).not.toBe(traj);
		expect(scene.t).toBe(target);
		expect(scene.trajectory.samples[0].t).toBe(0);
		expect(scene.trajectory.last.t).toBeGreaterThanOrEqual(target);
		expect(scene.ship.t).toBe(target);
		expect(scene.ship.phase).toBe('orbiting');
	});

	it('seeking within the kept path keeps the flight', () => {
		const scene = new Scene();
		scene.warp = 600;
		fly(scene, 6000);
		const traj = scene.trajectory;
		scene.seek(3000);
		expect(scene.trajectory).toBe(traj);
		expect(scene.t).toBe(3000);
		scene.seek(-5);
		expect(scene.t).toBe(0);
		expect(scene.trajectory).toBe(traj);
	});

	it('setBody resets the plan, camera, and clock', () => {
		const scene = new Scene();
		scene.warp = 600;
		fly(scene, 1200);
		scene.kick(500, 'prograde');
		scene.tour = 'gps';
		scene.setBody('sgr-a-star');
		const body = bodyById('sgr-a-star');
		expect(scene.body.id).toBe(body.id);
		expect(scene.tour).toBeNull();
		expect(scene.t).toBe(0);
		expect(scene.plan.manoeuvres).toEqual([]);
		expect(scene.plan.start.r).toBe(defaultStartRadius(body, fieldFor(body)));
		expect(scene.camera.frame).toBeCloseTo(2.6 * scene.plan.start.r, 0);
		expect(scene.ship.phase).toBe('orbiting');
		expect(scene.ship.deficit).toBeGreaterThan(0.01);
	});

	it('survives a round trip through a share link', () => {
		const scene = new Scene();
		scene.warp = 600;
		fly(scene, 1200);
		scene.kick(500, 'retrograde');
		fly(scene, 600);
		scene.hold();
		scene.camera = { ...scene.camera, frame: 1e8, follow: true };
		const snapshot = scene.snapshot();
		const decoded = decodeScene(encodeScene(snapshot));
		expect(decoded).not.toBeNull();
		const copy = new Scene(decoded);
		expect(copy.body.id).toBe(scene.body.id);
		expect(copy.warp).toBe(scene.warp);
		expect(copy.camera).toEqual(scene.camera);
		expect(copy.plan.manoeuvres.map((m) => m.kind)).toEqual(['kick', 'hold']);
		expect(copy.t).toBeCloseTo(scene.t, 3);
		expect(copy.ship.r).toBeCloseTo(scene.ship.r, -1);
		expect(copy.ship.phi).toBeCloseTo(scene.ship.phi, 5);
		expect(copy.ship.holding).toBe(true);
	});
});
