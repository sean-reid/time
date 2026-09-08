import { describe, expect, it } from 'vitest';
import { bodyById } from '$lib/catalogue';
import {
	attractorsFor,
	epochSeconds,
	hillRadius,
	influenceFor,
	parentOf,
	regimeFor,
	solarDeficit,
	spaceFor
} from './defaults';
import { J2000_MS, L_C } from '$lib/physics';

describe('scene defaults', () => {
	it('pulls the ship toward companions only where Newtonian motion applies', () => {
		expect(attractorsFor(bodyById('earth'))).toHaveLength(1);
		expect(attractorsFor(bodyById('sun'))).toHaveLength(5);
		expect(attractorsFor(bodyById('sgr-a-star'))).toHaveLength(0);
		expect(regimeFor(bodyById('sirius-b'))).toBe('geodesic');
		expect(regimeFor(bodyById('jupiter'))).toBe('newtonian');
	});

	it("gives each solar system scene the Sun's share of its clock deficit", () => {
		expect(solarDeficit(bodyById('sun'))).toBe(0);
		expect(solarDeficit(bodyById('earth'))).toBe(L_C);
		expect(solarDeficit(bodyById('moon'))).toBe(L_C);
		expect(solarDeficit(bodyById('mars')) / L_C).toBeCloseTo(1 / 1.524, 2);
		expect(solarDeficit(bodyById('sgr-a-star'))).toBe(0);
	});

	it('finds each body its parent and the Hill radius around it', () => {
		expect(parentOf(bodyById('moon'))?.parent.id).toBe('earth');
		expect(parentOf(bodyById('earth'))?.parent.id).toBe('sun');
		expect(parentOf(bodyById('sun'))).toBeNull();
		expect(hillRadius(bodyById('moon'))).toBeGreaterThan(55_000e3);
		expect(hillRadius(bodyById('moon'))).toBeLessThan(62_000e3);
		expect(hillRadius(bodyById('earth'))).toBeGreaterThan(1.4e9);
		expect(hillRadius(bodyById('earth'))).toBeLessThan(1.55e9);
		expect(hillRadius(bodyById('sun'))).toBeNull();
	});

	it('bounds a Newtonian scene by the Hill sphere of the last body it pulls with', () => {
		const earth = influenceFor(bodyById('earth'));
		expect(earth?.body.id).toBe('earth');
		expect(earth?.orbit).toBeNull();
		expect(earth?.missing.id).toBe('sun');
		const moon = influenceFor(bodyById('moon'));
		expect(moon?.body.id).toBe('earth');
		expect(moon?.orbit?.body).toBe('earth');
		expect(moon?.radius).toBe(earth?.radius);
		expect(influenceFor(bodyById('mars'))?.body.id).toBe('mars');
		expect(influenceFor(bodyById('sun'))).toBeNull();
		expect(influenceFor(bodyById('sgr-a-star'))).toBeNull();
	});

	it('places the epoch relative to J2000', () => {
		expect(epochSeconds(J2000_MS)).toBe(0);
		expect(spaceFor(bodyById('earth'), J2000_MS + 86_400_000).epoch).toBe(86_400);
	});
});
