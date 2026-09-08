import { describe, expect, it } from 'vitest';
import { AU, C, GM_EARTH, G, M_SUN } from './constants';
import { makeField } from './field';
import { circularOrbitDeficit, circularOrbitPeriod, staticDeficit } from './schwarzschild';
import { Trajectory, type Space } from './trajectory';

const earthField = makeField({ mass: GM_EARTH / G, radius: 6.371e6 });
const earth: Space = { field: earthField, regime: 'newtonian', attractors: [], epoch: 0 };
const holeField = makeField({ mass: 4.297e6 * M_SUN, spin: 0.9 });
const hole: Space = { field: holeField, regime: 'geodesic', attractors: [], epoch: 0 };
const gps = 26_560e3;

describe('trajectory, Newtonian regime', () => {
	it('keeps a circular orbit circular for three periods and matches the orbit clock rate', () => {
		const traj = new Trajectory(earth, {
			start: { r: gps, phi: 0, kind: 'orbit', direction: 1 },
			manoeuvres: []
		});
		const period = circularOrbitPeriod(earthField.mass, gps);
		traj.ensure(3 * period);
		const s = traj.stateAt(3 * period);
		expect(s.r / gps).toBeCloseTo(1, 5);
		expect(s.phi).toBeCloseTo(6 * Math.PI, 2);
		expect(s.deficit).toBeCloseTo(circularOrbitDeficit(earthField.mass, gps), 13);
	});

	it('a prograde kick to escape speed sends the ship away for good', () => {
		const v = Math.sqrt(GM_EARTH / gps);
		const traj = new Trajectory(earth, {
			start: { r: gps, phi: 0, kind: 'orbit', direction: 1 },
			manoeuvres: [{ at: 100, kind: 'kick', dv: (Math.SQRT2 - 1) * v * 1.05, heading: 'prograde' }]
		});
		traj.ensure(30 * 86400);
		expect(traj.last.r).toBeGreaterThan(20 * gps);
		expect(traj.ending).toBeNull();
	});

	it('a retrograde kick drops the ship onto the surface', () => {
		const v = Math.sqrt(GM_EARTH / gps);
		const traj = new Trajectory(earth, {
			start: { r: gps, phi: 0, kind: 'orbit', direction: 1 },
			manoeuvres: [{ at: 0, kind: 'kick', dv: 0.7 * v, heading: 'retrograde' }]
		});
		traj.ensure(86400);
		expect(traj.ending?.kind).toBe('surface');
		expect(traj.last.r).toBeLessThanOrEqual(earthField.surface * 1.001);
	});

	it('holding station freezes the ship at the static rate with the local gravity as thrust', () => {
		const traj = new Trajectory(earth, {
			start: { r: 7e6, phi: 1, kind: 'hold', direction: 1 },
			manoeuvres: []
		});
		traj.ensure(3600);
		const s = traj.stateAt(1800);
		expect(s.r).toBeCloseTo(7e6, 3);
		expect(s.holding).toBe(true);
		expect(s.thrust).toBeCloseTo(GM_EARTH / 7e6 ** 2, 6);
		expect(s.deficit).toBeCloseTo(staticDeficit(earthField.mass, 7e6), 14);
	});

	it('feels a companion: a ship parked near the Moon falls toward it', () => {
		const moon = {
			mu: 4.9028e12,
			radius: 1.7374e6,
			elements: { a: 384_400e3, e: 0, period: 27.321661 * 86400, omega: 0, m0: 0 }
		};
		const space: Space = { ...earth, attractors: [moon] };
		const traj = new Trajectory(space, {
			start: { r: 384_400e3 - 20_000e3, phi: 0, kind: 'orbit', direction: 1 },
			manoeuvres: [{ at: 0, kind: 'kick', dv: 0, heading: 'prograde' }]
		});
		traj.ensure(6 * 3600);
		const s = traj.last;
		const p = {
			x: 384_400e3 * Math.cos((2 * Math.PI * s.t) / moon.elements.period),
			y: 384_400e3 * Math.sin((2 * Math.PI * s.t) / moon.elements.period)
		};
		const d = Math.hypot(s.r * Math.cos(s.phi) - p.x, s.r * Math.sin(s.phi) - p.y);
		expect(d).toBeLessThan(20_000e3);
	});
});

describe('trajectory, geodesic regime', () => {
	it('orbits Sgr A* at four ISCOs with the Kerr orbit clock rate', () => {
		const r = 4 * holeField.isco(1);
		const traj = new Trajectory(hole, {
			start: { r, phi: 0, kind: 'orbit', direction: 1 },
			manoeuvres: []
		});
		const period = holeField.orbitPeriod(r, 1);
		traj.ensure(2 * period);
		const s = traj.stateAt(1.5 * period);
		expect(s.r / r).toBeCloseTo(1, 6);
		expect(s.deficit).toBeCloseTo(holeField.orbitDeficit(r, 1), 8);
		expect(s.phi).toBeCloseTo(3 * Math.PI, 2);
	});

	it('a hard retrograde kick plunges through the horizon in finite proper time', () => {
		const r = 4 * holeField.isco(1);
		const traj = new Trajectory(hole, {
			start: { r, phi: 0, kind: 'orbit', direction: 1 },
			manoeuvres: [{ at: 10, kind: 'kick', dv: 0.3 * C, heading: 'retrograde' }]
		});
		traj.ensure(1e6);
		expect(traj.ending?.kind).toBe('horizon');
		expect(Number.isFinite(traj.ending!.tau)).toBe(true);
		expect(traj.ending!.tau).toBeLessThan(traj.ending!.t);
		expect(traj.last.deficit).toBeGreaterThan(0.99);
	});

	it('extends lazily and interpolates', () => {
		const r = 6 * holeField.isco(1);
		const traj = new Trajectory(hole, {
			start: { r, phi: 0, kind: 'orbit', direction: -1 },
			manoeuvres: []
		});
		traj.ensure(100);
		const reach = traj.last.t;
		traj.ensure(5000);
		expect(traj.last.t).toBeGreaterThan(reach);
		const s = traj.stateAt(2500);
		expect(s.t).toBe(2500);
		expect(s.phi).toBeLessThan(0);
	});
});

describe('trajectory, solar scene', () => {
	it('Earth-like circular orbit at 1 AU takes a year and carries the Sun deficit', () => {
		const sun = makeField({ mass: M_SUN, radius: 6.957e8 });
		const traj = new Trajectory(
			{ field: sun, regime: 'newtonian', attractors: [], epoch: 0 },
			{
				start: { r: AU, phi: 0, kind: 'orbit', direction: 1 },
				manoeuvres: []
			}
		);
		const year = circularOrbitPeriod(M_SUN, AU);
		expect(year / 86400).toBeCloseTo(365.25, 0);
		traj.ensure(year);
		expect(traj.last.phi).toBeCloseTo(2 * Math.PI, 2);
		expect(traj.last.deficit * 1e8).toBeCloseTo(1.48, 1);
	});
});

describe('trajectory, manoeuvre timing and limits', () => {
	it('applies a manoeuvre due at the current time before the flight is read', () => {
		const traj = new Trajectory(earth, {
			start: { r: gps, phi: 0, kind: 'orbit', direction: 1 },
			manoeuvres: [{ at: 100, kind: 'hold', duration: Infinity }]
		});
		traj.ensure(100);
		expect(traj.stateAt(100).holding).toBe(true);
		const kicked = new Trajectory(earth, {
			start: { r: gps, phi: 0, kind: 'orbit', direction: 1 },
			manoeuvres: [{ at: 0, kind: 'kick', dv: 1000, heading: 'prograde' }]
		});
		expect(kicked.stateAt(0).speed).toBeGreaterThan(Math.sqrt(GM_EARTH / gps) + 900);
	});

	it('never reports a local speed at or above light after stacked kicks', () => {
		const r = 4 * holeField.isco(1);
		const traj = new Trajectory(hole, {
			start: { r, phi: 0, kind: 'orbit', direction: 1 },
			manoeuvres: [
				{ at: 1, kind: 'kick', dv: 0.5 * C, heading: 'prograde' },
				{ at: 2, kind: 'kick', dv: 0.5 * C, heading: 'outward' },
				{ at: 3, kind: 'kick', dv: 0.5 * C, heading: 'prograde' }
			]
		});
		traj.ensure(50);
		for (const s of traj.samples) expect(s.speed).toBeLessThan(C);
		const fast = new Trajectory(earth, {
			start: { r: gps, phi: 0, kind: 'orbit', direction: 1 },
			manoeuvres: [{ at: 1, kind: 'kick', dv: 2 * C, heading: 'outward' }]
		});
		fast.ensure(10);
		expect(fast.last.speed).toBeLessThan(C);
	});

	it('outward and inward kicks move the orbit the right way', () => {
		const period = circularOrbitPeriod(earthField.mass, gps);
		const out = new Trajectory(earth, {
			start: { r: gps, phi: 0, kind: 'orbit', direction: 1 },
			manoeuvres: [{ at: 0, kind: 'kick', dv: 500, heading: 'outward' }]
		});
		out.ensure(period / 4);
		expect(out.last.r).toBeGreaterThan(gps);
		const inward = new Trajectory(hole, {
			start: { r: 6 * holeField.isco(1), phi: 0, kind: 'orbit', direction: 1 },
			manoeuvres: [{ at: 0, kind: 'kick', dv: 0.05 * C, heading: 'inward' }]
		});
		inward.ensure(holeField.orbitPeriod(6 * holeField.isco(1), 1) / 4);
		expect(inward.last.r).toBeLessThan(6 * holeField.isco(1));
	});
});

describe('trajectory, long flights', () => {
	it('thins old samples instead of dropping the start, and keeps manoeuvres on a sample', () => {
		const period = circularOrbitPeriod(earthField.mass, gps);
		const traj = new Trajectory(earth, {
			start: { r: gps, phi: 0, kind: 'orbit', direction: 1 },
			manoeuvres: [{ at: period, kind: 'kick', dv: 0, heading: 'prograde' }]
		});
		const first = traj.samples[0];
		traj.ensure(period);
		const gapAtStart = traj.samples[1].t - traj.samples[0].t;
		const end = 80 * period;
		while (traj.last.t < end) traj.ensure(end);
		const s = traj.samples;
		expect(s.length).toBeLessThanOrEqual(60_000);
		expect(s.length).toBeGreaterThan(40_000);
		expect(s[0]).toBe(first);
		expect(s[1].t - s[0].t).toBeGreaterThan(1.5 * gapAtStart);
		expect(s[s.length - 1].t - s[s.length - 2].t).toBeLessThan(1.5 * gapAtStart);
		expect(traj.samples.some((s) => s.t === period)).toBe(true);
		expect(traj.stateAt(period).phi).toBeCloseTo(2 * Math.PI, 2);
		expect(traj.stateAt(period / 3).r / gps).toBeCloseTo(1, 5);
		for (let i = 1; i < traj.samples.length; i++) {
			expect(traj.samples[i].t).toBeGreaterThan(traj.samples[i - 1].t);
		}
	});
});

describe('trajectory, manoeuvres on the live flight', () => {
	it('a kick applied at the present matches the same kick planned from the start', () => {
		const start = { r: gps, phi: 0, kind: 'orbit' as const, direction: 1 as const };
		const planned = new Trajectory(earth, {
			start,
			manoeuvres: [{ at: 1000, kind: 'kick', dv: 500, heading: 'prograde' }]
		});
		planned.ensure(5000);
		const live = new Trajectory(earth, { start, manoeuvres: [] });
		live.ensure(1000);
		const kept = live.samples.length;
		expect(live.applyNow({ at: 1000, kind: 'kick', dv: 500, heading: 'prograde' })).toBe(true);
		live.ensure(5000);
		expect(live.samples.length).toBeGreaterThan(kept);
		expect(live.samples[0].t).toBe(0);
		const a = planned.stateAt(5000);
		const b = live.stateAt(5000);
		expect(b.r).toBeCloseTo(a.r, -1);
		expect(b.phi).toBeCloseTo(a.phi, 6);
	});

	it('refuses a manoeuvre placed before the kept path', () => {
		const traj = new Trajectory(earth, {
			start: { r: gps, phi: 0, kind: 'orbit', direction: 1 },
			manoeuvres: []
		});
		traj.ensure(2000);
		expect(traj.applyNow({ at: 500, kind: 'hold', duration: Infinity })).toBe(false);
		expect(traj.last.holding).toBe(false);
	});
});
