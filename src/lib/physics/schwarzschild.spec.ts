import { describe, expect, it } from 'vitest';
import {
	GM_EARTH,
	GM_SUN,
	G,
	L_B,
	L_C,
	L_G,
	R_EARTH,
	R_SUN,
	SECONDS_PER_DAY,
	M_SUN
} from './constants';
import { earthReferenceDeficit, relativeRateMinusOne } from './earth';
import {
	circularOrbitDeficit,
	circularOrbitPeriod,
	hoverAcceleration,
	isco,
	photonSphere,
	schwarzschildRadius,
	staticDeficit,
	staticRate
} from './schwarzschild';

const M_EARTH = GM_EARTH / G;

describe('Schwarzschild', () => {
	it('gives the Sun a 2.95 km Schwarzschild radius', () => {
		expect(schwarzschildRadius(M_SUN)).toBeCloseTo(2953.25, 0);
	});

	it('slows a clock on the solar photosphere by 2.12 parts per million', () => {
		expect(staticDeficit(M_SUN, R_SUN) * 1e6).toBeCloseTo(2.1226, 3);
	});

	it('reproduces Pound and Rebka: 22.5 m of height shifts rate by 2.46e-15', () => {
		const low = staticDeficit(M_EARTH, R_EARTH);
		const high = staticDeficit(M_EARTH, R_EARTH + 22.5);
		expect((low - high) / 2.46e-15).toBeCloseTo(1, 1);
	});

	it('makes a GPS clock gain 38.6 microseconds per day against sea level', () => {
		const gps = circularOrbitDeficit(M_EARTH, 26_560e3);
		const perDay = relativeRateMinusOne(gps + L_C, earthReferenceDeficit()) * SECONDS_PER_DAY;
		expect(perDay * 1e6).toBeCloseTo(38.6, 0);
		expect(circularOrbitPeriod(M_EARTH, 26_560e3) / 3600).toBeCloseTo(11.97, 1);
	});

	it('uses the IAU sea level deficit', () => {
		expect(earthReferenceDeficit()).toBe(L_B);
		expect(L_B - L_C).toBeCloseTo(L_G, 15);
		expect(staticDeficit(M_EARTH, R_EARTH)).toBeLessThan(L_G);
	});

	it('slows a clock on a 2.01 solar mass, 12 km neutron star by about 29 percent', () => {
		expect(staticRate(2.01 * M_SUN, 12e3)).toBeCloseTo(0.71, 2);
	});

	it('places the photon sphere at 1.5 and the ISCO at 3 Schwarzschild radii', () => {
		const rs = schwarzschildRadius(M_SUN);
		expect(photonSphere(M_SUN) / rs).toBe(1.5);
		expect(isco(M_SUN) / rs).toBe(3);
	});

	it('needs 1 g to hover at Earth sea level and diverges at the horizon', () => {
		expect(hoverAcceleration(M_EARTH, R_EARTH)).toBeCloseTo(9.8, 1);
		expect(hoverAcceleration(M_SUN, schwarzschildRadius(M_SUN) * 1.0001)).toBeGreaterThan(1e11);
	});

	it('keeps precision on tiny deficits', () => {
		expect(staticDeficit(M_EARTH, R_EARTH)).toBeCloseTo(GM_EARTH / (R_EARTH * 299792458 ** 2), 18);
		expect(staticDeficit(M_SUN, 1.495978707e11)).toBeCloseTo(
			GM_SUN / (1.495978707e11 * 299792458 ** 2),
			15
		);
	});
});
