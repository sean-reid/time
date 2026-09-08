import { describe, expect, it } from 'vitest';
import { bodyById } from '$lib/catalogue';
import { attractorsFor, epochSeconds, regimeFor, solarDeficit, spaceFor } from './defaults';
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

	it('places the epoch relative to J2000', () => {
		expect(epochSeconds(J2000_MS)).toBe(0);
		expect(spaceFor(bodyById('earth'), J2000_MS + 86_400_000).epoch).toBe(86_400);
	});
});
