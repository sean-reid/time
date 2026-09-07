import { describe, expect, it } from 'vitest';
import { isochroneRadius, properRadius } from './metric';

describe('metric helpers', () => {
	it('matches coordinate distance far from the body up to a slow log term', () => {
		const rs = 1;
		const r = 1e6;
		const rho = properRadius(r, rs);
		expect(rho).toBeGreaterThan(r);
		expect(rho - r).toBeLessThan(10);
	});

	it('stretches without bound approaching the horizon', () => {
		const rs = 3000;
		const near = properRadius(rs * 1.0001, rs) - properRadius(rs * 1.00005, rs);
		const far = properRadius(rs * 10.0001, rs) - properRadius(rs * 10.00005, rs);
		expect(near / far).toBeGreaterThan(5);
		expect(properRadius(rs, rs)).toBe(0);
	});

	it('is the identity without a mass', () => {
		expect(properRadius(5, 0)).toBe(5);
	});

	it('places the half-rate isochrone at 4/3 of the Schwarzschild radius', () => {
		expect(isochroneRadius(3, 0.5)).toBeCloseTo(4, 9);
	});
});
