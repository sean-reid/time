import { describe, expect, it } from 'vitest';
import { C, GM_EARTH, G, M_SUN } from './constants';
import { makeField } from './field';
import { integrate } from './integrator';
import { circularOrbitDeficit, circularOrbitPeriod, staticDeficit } from './schwarzschild';

const earth = makeField({ mass: GM_EARTH / G, radius: 6.371e6 });
const hole = makeField({ mass: 10 * M_SUN });
const spinning = makeField({ mass: 10 * M_SUN, spin: 0.9 });

describe('integrate', () => {
	it('hovering for a coordinate hour ages the ship by the static rate', () => {
		const r = 26_560e3;
		const f = integrate(earth, {
			waypoints: [{ r, phi: 0, dwell: { kind: 'hover', duration: 3600 } }],
			cruiseSpeed: 1e3
		});
		expect(f.totalT).toBe(3600);
		expect(f.totalTau).toBeCloseTo(3600 * (1 - staticDeficit(earth.mass, r)), 9);
		expect(f.ending.kind).toBe('complete');
	});

	it('two GPS revolutions take two periods and sweep 4π', () => {
		const r = 26_560e3;
		const f = integrate(earth, {
			waypoints: [{ r, phi: 0.3, dwell: { kind: 'orbit', revolutions: 2, direction: 1 } }],
			cruiseSpeed: 1e3
		});
		const period = circularOrbitPeriod(earth.mass, r);
		expect(f.totalT).toBeCloseTo(2 * period, 6);
		expect(f.totalTau).toBeCloseTo(2 * period * (1 - circularOrbitDeficit(earth.mass, r)), 6);
		const mid = f.stateAt(period / 2);
		expect(mid.phi).toBeCloseTo(0.3 + Math.PI, 2);
		expect(f.stateAt(period).r).toBeCloseTo(r, 3);
	});

	it('a fast cruise far from anything is ordinary special relativity', () => {
		const far = makeField({ mass: 1, radius: 1 });
		const v = 0.6 * C;
		const f = integrate(far, {
			waypoints: [
				{ r: 1e12, phi: 0 },
				{ r: 1e12, phi: Math.PI }
			],
			cruiseSpeed: v
		});
		expect(f.totalTau / f.totalT).toBeCloseTo(0.8, 6);
	});

	it('a dive into a black hole ends at the horizon with finite ship time', () => {
		const f = integrate(hole, {
			waypoints: [
				{ r: 100 * hole.surface, phi: 0 },
				{ r: 0.5 * hole.surface, phi: 0 }
			],
			cruiseSpeed: 0.1 * C
		});
		expect(f.ending.kind).toBe('horizon');
		expect(f.totalTau).toBeGreaterThan(0);
		expect(Number.isFinite(f.totalTau)).toBe(true);
		expect(f.totalT).toBeGreaterThan(f.totalTau);
		const last = f.samples[f.samples.length - 1];
		expect(last.r / hole.surface).toBeCloseTo(1, 2);
		expect(1 - last.deficit).toBeLessThan(1e-4);
	});

	it('a course into a planet ends at its surface', () => {
		const f = integrate(earth, {
			waypoints: [
				{ r: 1e7, phi: 1 },
				{ r: 0, phi: 1 }
			],
			cruiseSpeed: 7e3
		});
		expect(f.ending.kind).toBe('surface');
		expect(f.samples[f.samples.length - 1].r).toBeGreaterThanOrEqual(earth.surface);
	});

	it('uses the Kerr orbit rate for a spinning hole and stays monotonic in time', () => {
		const r = 6 * spinning.surface;
		const f = integrate(spinning, {
			waypoints: [
				{ r: 50 * spinning.surface, phi: 0 },
				{ r, phi: 0, dwell: { kind: 'orbit', revolutions: 3, direction: 1 } },
				{ r: 50 * spinning.surface, phi: 2 }
			],
			cruiseSpeed: 0.05 * C
		});
		for (let i = 1; i < f.samples.length; i++) {
			expect(f.samples[i].t).toBeGreaterThanOrEqual(f.samples[i - 1].t);
			expect(f.samples[i].tau).toBeGreaterThanOrEqual(f.samples[i - 1].tau);
		}
		expect(f.samples.some((s) => s.thrust === 0 && s.speed > 0)).toBe(true);
		expect(f.ending.kind).toBe('complete');
	});

	it('leaves an orbit from where the orbit ends', () => {
		const r = 26_560e3;
		const f = integrate(earth, {
			waypoints: [
				{ r, phi: 0, dwell: { kind: 'orbit', revolutions: 0.5, direction: 1 } },
				{ r: 2 * r, phi: Math.PI }
			],
			cruiseSpeed: 1e4
		});
		const period = circularOrbitPeriod(earth.mass, r);
		const justAfter = f.stateAt(period / 2 + 1);
		expect(Math.cos(justAfter.phi)).toBeCloseTo(-1, 3);
		expect(justAfter.r).toBeGreaterThan(r);
	});

	it('interpolates state between samples', () => {
		const f = integrate(earth, {
			waypoints: [{ r: 7e6, phi: 0, dwell: { kind: 'hover', duration: 100 } }],
			cruiseSpeed: 1
		});
		const s = f.stateAt(50);
		expect(s.t).toBe(50);
		expect(s.tau).toBeCloseTo(50 * (1 - staticDeficit(earth.mass, 7e6)), 9);
		expect(f.stateAt(-1).t).toBe(0);
		expect(f.stateAt(1e9).t).toBe(100);
	});
});
