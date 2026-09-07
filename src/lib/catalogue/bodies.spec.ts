import { describe, expect, it } from 'vitest';
import { bodies, bodyById } from './index';
import type { Body, Companion, Quantity } from './types';

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
const AU = 149597870700;
const withCompanions = all.filter((b) => (b.companions?.length ?? 0) > 0);

function companionQuantities(c: Companion): Quantity[] {
	return [c.semiMajorAxis, c.eccentricity, c.period, c.argumentOfPeriapsis, c.meanAnomalyAtEpoch];
}

function kindRank(b: Body): number {
	return b.kind === 'black-hole' ? 2 : ['star', 'planet', 'moon'].includes(b.kind) ? 0 : 1;
}

/** A companion displays with its primary, so a star orbiting a remnant ranks as a remnant. */
function displayRank(b: Body): number {
	const primaries = all.filter((p) => p.companions?.some((c) => c.body === b.id));
	return Math.max(kindRank(b), ...primaries.map(kindRank));
}
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
		const ranks = all.map(displayRank);
		expect(ranks).toEqual([...ranks].sort());
	});

	it('places a stellar companion right after the remnant or black hole it orbits', () => {
		for (const body of all) {
			for (const companion of body.companions ?? []) {
				if (kindRank(bodyById(companion.body)) >= kindRank(body)) continue;
				expect(all.indexOf(bodyById(companion.body))).toBe(all.indexOf(body) + 1);
			}
		}
	});

	it('gives every scene a companion that exists in the catalogue', () => {
		expect(withCompanions.map((b) => b.id)).toEqual([
			'sun',
			'earth',
			'moon',
			'sirius-b',
			'psr-j0348-0432',
			'cygnus-x-1',
			'sgr-a-star'
		]);
		for (const body of withCompanions) {
			for (const c of body.companions ?? []) {
				expect(c.body).not.toBe(body.id);
				expect(bodyById(c.body).id).toBe(c.body);
			}
		}
	});

	it('cites a labelled http(s) source on every companion element, in SI', () => {
		for (const body of withCompanions) {
			for (const c of body.companions ?? []) {
				for (const q of companionQuantities(c)) {
					expect(Number.isFinite(q.value)).toBe(true);
					expect(q.source.label.trim()).not.toBe('');
					expect(q.source.url).toMatch(/^https?:\/\/\S+$/);
				}
				expect(c.semiMajorAxis.unit).toBe('m');
				expect(c.period.unit).toBe('s');
				expect(c.eccentricity.unit).toBe('1');
				expect(c.argumentOfPeriapsis.unit).toBe('1');
				expect(c.meanAnomalyAtEpoch.unit).toBe('1');
			}
		}
	});

	it('keeps companion elements in range', () => {
		for (const body of withCompanions) {
			for (const c of body.companions ?? []) {
				expect(c.semiMajorAxis.value).toBeGreaterThan(0);
				expect(c.period.value).toBeGreaterThan(0);
				expect(c.eccentricity.value).toBeGreaterThanOrEqual(0);
				expect(c.eccentricity.value).toBeLessThan(1);
				for (const angle of [c.argumentOfPeriapsis, c.meanAnomalyAtEpoch]) {
					expect(angle.value).toBeGreaterThanOrEqual(0);
					expect(angle.value).toBeLessThan(2 * Math.PI);
					if (angle.value === 0) expect(angle.note).toBeDefined();
				}
			}
		}
	});

	it("satisfies Kepler's third law within 5 percent for every companion", () => {
		for (const body of withCompanions) {
			for (const c of body.companions ?? []) {
				const total = body.mass.value + bodyById(c.body).mass.value;
				const kepler = 2 * Math.PI * Math.sqrt(c.semiMajorAxis.value ** 3 / (G * total));
				expect(Math.abs(c.period.value / kepler - 1)).toBeLessThan(0.05);
			}
		}
	});

	it('gives the Sun five companions in increasing semi-major axis', () => {
		const companions = bodyById('sun').companions ?? [];
		expect(companions.map((c) => c.body)).toEqual(['mercury', 'venus', 'earth', 'mars', 'jupiter']);
		for (let i = 1; i < companions.length; i++) {
			expect(companions[i].semiMajorAxis.value).toBeGreaterThan(
				companions[i - 1].semiMajorAxis.value
			);
		}
	});

	it('matches reference elements for Earth, the Moon and S2', () => {
		const earth = bodyById('sun').companions?.find((c) => c.body === 'earth');
		expect(Math.abs((earth?.semiMajorAxis.value ?? 0) / AU - 1)).toBeLessThan(1e-4);
		expect(Math.abs((earth?.period.value ?? 0) / 31558150 - 1)).toBeLessThan(1e-5);
		expect(((earth?.argumentOfPeriapsis.value ?? 0) * 180) / Math.PI).toBeCloseTo(102.93768, 4);
		expect(((earth?.meanAnomalyAtEpoch.value ?? 0) * 180) / Math.PI).toBeCloseTo(357.52689, 4);

		const moon = bodyById('earth').companions?.[0];
		const back = bodyById('moon').companions?.[0];
		expect(moon?.semiMajorAxis.value).toBe(384400e3);
		expect(back?.semiMajorAxis.value).toBe(moon?.semiMajorAxis.value);
		expect(back?.period.value).toBe(moon?.period.value);

		const s2 = bodyById('sgr-a-star').companions?.[0];
		expect(Math.abs((s2?.semiMajorAxis.value ?? 0) / (1031.3 * AU) - 1)).toBeLessThan(1e-3);
		expect(Math.abs((s2?.period.value ?? 0) / (16.0455 * 365.25 * 86400) - 1)).toBeLessThan(1e-9);
		expect(((s2?.meanAnomalyAtEpoch.value ?? 0) * 180) / Math.PI).toBeCloseTo(307.64, 1);
	});

	it('throws on an unknown id', () => {
		expect(() => bodyById('planet-x')).toThrow('Unknown body: planet-x');
		expect(bodyById('sgr-a-star').name).toBe('Sagittarius A*');
	});
});
