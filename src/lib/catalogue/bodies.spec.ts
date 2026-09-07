import { describe, expect, it } from 'vitest';
import { bodies, bodyById } from './index';
import type { Body, Quantity } from './types';

const G = 6.6743e-11;
const c = 299792458;

function quantities(body: Body): Quantity[] {
	const own = [
		body.mass,
		body.radius,
		body.spin,
		body.rotationPeriod,
		body.distanceFromEarth
	].filter((q): q is Quantity => q !== undefined);
	return own.concat((body.orbits ?? []).map((o) => o.radius));
}

const all: readonly Body[] = bodies;
const blackHoles = all.filter((b) => b.kind === 'black-hole');
const others = all.filter((b) => b.kind !== 'black-hole');

describe('catalogue', () => {
	it('has unique kebab-case ids and non-empty names', () => {
		const ids = all.map((b) => b.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const body of all) {
			expect(body.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
			expect(body.name.trim()).not.toBe('');
			expect(body.summary.trim()).not.toBe('');
		}
	});

	it('cites a labelled http(s) source on every quantity', () => {
		for (const body of all) {
			for (const q of quantities(body)) {
				expect(Number.isFinite(q.value)).toBe(true);
				expect(q.value).toBeGreaterThan(0);
				expect(q.source.label.trim()).not.toBe('');
				expect(q.source.url).toMatch(/^https?:\/\/\S+$/);
			}
		}
	});

	it('gives black holes a spin in [0, 1) and no radius', () => {
		expect(blackHoles.length).toBeGreaterThan(0);
		for (const body of blackHoles) {
			expect(body.radius).toBeUndefined();
			expect(body.spin?.unit).toBe('1');
			expect(body.spin?.value).toBeGreaterThanOrEqual(0);
			expect(body.spin?.value).toBeLessThan(1);
		}
	});

	it('gives every other body a radius larger than its Schwarzschild radius', () => {
		expect(others.length).toBeGreaterThan(0);
		for (const body of others) {
			expect(body.spin).toBeUndefined();
			const schwarzschild = (2 * G * body.mass.value) / c ** 2;
			expect(body.radius?.value).toBeGreaterThan(schwarzschild);
		}
	});

	it('uses SI units', () => {
		for (const body of all) {
			expect(body.mass.unit).toBe('kg');
			expect(body.radius?.unit ?? 'm').toBe('m');
			expect(body.rotationPeriod?.unit ?? 's').toBe('s');
			expect(body.distanceFromEarth?.unit ?? 'm').toBe('m');
			for (const orbit of body.orbits ?? []) expect(orbit.radius.unit).toBe('m');
		}
	});

	it('matches reference values for Earth and the Sun', () => {
		const earth = bodyById('earth');
		expect(Math.abs(earth.mass.value / 5.9722e24 - 1)).toBeLessThan(1e-3);
		expect(Math.abs((earth.radius?.value ?? 0) / 6.371e6 - 1)).toBeLessThan(1e-3);

		const sun = bodyById('sun');
		expect(Math.abs(sun.mass.value / 1.9884e30 - 1)).toBeLessThan(1e-3);
		expect(Math.abs((sun.radius?.value ?? 0) / 6.957e8 - 1)).toBeLessThan(1e-3);
	});

	it('lists Earth orbits with strictly increasing radii', () => {
		const orbits = bodyById('earth').orbits ?? [];
		expect(orbits.map((o) => o.id)).toEqual(['iss', 'gps', 'geostationary', 'moon']);
		for (let i = 1; i < orbits.length; i++) {
			expect(orbits[i].radius.value).toBeGreaterThan(orbits[i - 1].radius.value);
		}
		const earthRadius = bodyById('earth').radius?.value ?? 0;
		expect(orbits[0].radius.value).toBeGreaterThan(earthRadius);
	});

	it('orders the display solar system first, then remnants, then black holes', () => {
		const rank = (b: Body) =>
			b.kind === 'black-hole' ? 2 : ['star', 'planet', 'moon'].includes(b.kind) ? 0 : 1;
		const ranks = all.map(rank);
		expect(ranks).toEqual([...ranks].sort());
	});

	it('throws on an unknown id', () => {
		expect(() => bodyById('planet-x')).toThrow('Unknown body: planet-x');
		expect(bodyById('sgr-a-star').name).toBe('Sagittarius A*');
	});
});
