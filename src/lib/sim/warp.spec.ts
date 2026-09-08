import { describe, expect, it } from 'vitest';
import { GM_EARTH } from '$lib/physics';
import { WARPS } from './defaults';
import { keplerPeriod, shortfall, warpCap, WarpMeter } from './warp';

const GPS_R = 26_571_000;
const GPS_V = Math.sqrt(GM_EARTH / GPS_R);

describe('keplerPeriod', () => {
	it('matches the circular period on a circular orbit', () => {
		const circular = 2 * Math.PI * Math.sqrt(GPS_R ** 3 / GM_EARTH);
		expect(keplerPeriod(GM_EARTH, GPS_R, GPS_V)).toBeCloseTo(circular, 6);
	});

	it('shrinks after a retrograde kick and grows after a prograde one', () => {
		const circular = keplerPeriod(GM_EARTH, GPS_R, GPS_V);
		expect(keplerPeriod(GM_EARTH, GPS_R, GPS_V / 2)).toBeLessThan(circular / 2);
		expect(keplerPeriod(GM_EARTH, GPS_R, GPS_V * 1.2)).toBeGreaterThan(circular);
	});

	it('falls back to the circular period once the ship is unbound', () => {
		const circular = keplerPeriod(GM_EARTH, GPS_R, GPS_V);
		expect(keplerPeriod(GM_EARTH, GPS_R, GPS_V * Math.SQRT2)).toBeCloseTo(circular, 6);
		expect(keplerPeriod(GM_EARTH, GPS_R, GPS_V * 3)).toBeCloseTo(circular, 6);
	});
});

describe('warpCap', () => {
	it('picks the largest listed warp within the step budget', () => {
		expect(warpCap(1e9)).toBe(WARPS[WARPS.length - 1]);
		expect(warpCap(1e-3)).toBe(WARPS[0]);
		const cap = warpCap(600);
		expect(WARPS).toContain(cap);
		expect(cap).toBeLessThan(WARPS[WARPS.length - 1]);
	});

	it('allows less on a Newtonian orbit, which takes ten times the steps', () => {
		const period = 43_082;
		expect(warpCap(period, 'newtonian')).toBeLessThan(warpCap(period, 'geodesic'));
		expect(warpCap(period, 'newtonian')).toBeLessThanOrEqual((20_000 * period * 60) / 3142);
	});

	it('never rises as the orbit tightens', () => {
		const periods = [1e7, 1e6, 1e5, 1e4, 1e3, 1e2, 1e1, 1];
		const caps = periods.map((p) => warpCap(p));
		for (let i = 1; i < caps.length; i++) expect(caps[i]).toBeLessThanOrEqual(caps[i - 1]);
	});
});

describe('shortfall', () => {
	it('stays quiet within a few percent of the setting and before any measurement', () => {
		expect(shortfall(600, null)).toBeNull();
		expect(shortfall(600, 600)).toBeNull();
		expect(shortfall(600, 580)).toBeNull();
		expect(shortfall(600, 700)).toBeNull();
	});

	it('reports the achieved warp once it trails the setting', () => {
		expect(shortfall(600, 410)).toBe(410);
		expect(shortfall(600, 0)).toBe(0);
	});
});

describe('WarpMeter', () => {
	it('reads null until a frame is recorded and the achieved rate after', () => {
		const m = new WarpMeter();
		expect(m.rate).toBeNull();
		m.record(10, 1 / 60);
		expect(m.rate).toBeCloseTo(600, 9);
		m.record(5, 1 / 60);
		expect(m.rate).toBeCloseTo(450, 9);
	});

	it('forgets frames beyond the window', () => {
		const m = new WarpMeter();
		for (let i = 0; i < 12; i++) m.record(10, 1 / 60);
		for (let i = 0; i < 12; i++) m.record(5, 1 / 60);
		expect(m.rate).toBeCloseTo(300, 9);
	});

	it('ignores stalls and empty frames, and resets on demand', () => {
		const m = new WarpMeter();
		m.record(10, 1 / 60);
		m.record(0, 2);
		m.record(1, 0);
		expect(m.rate).toBeCloseTo(600, 9);
		m.reset();
		expect(m.rate).toBeNull();
	});
});
