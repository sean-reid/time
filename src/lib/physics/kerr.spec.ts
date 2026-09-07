import { describe, expect, it } from 'vitest';
import { M_SUN } from './constants';
import { makeField } from './field';
import {
	gravitationalRadius,
	kerrHoverAcceleration,
	kerrHoverDeficit,
	kerrIsco,
	kerrOrbitDeficit,
	kerrOrbitPeriod,
	kerrPhotonOrbit,
	outerHorizon
} from './kerr';
import {
	circularOrbitDeficit,
	circularOrbitPeriod,
	hoverAcceleration,
	staticDeficit
} from './schwarzschild';

const M = 10 * M_SUN;
const m = gravitationalRadius(M);

describe('Kerr', () => {
	it('matches Schwarzschild at zero spin', () => {
		expect(outerHorizon(M, 0) / m).toBeCloseTo(2, 12);
		expect(kerrIsco(M, 0, 1) / m).toBeCloseTo(6, 9);
		expect(kerrPhotonOrbit(M, 0, 1) / m).toBeCloseTo(3, 9);
		for (const x of [3.1, 6, 20, 1000]) {
			expect(kerrOrbitDeficit(M, 0, x * m, 1)).toBeCloseTo(circularOrbitDeficit(M, x * m), 14);
			expect(kerrOrbitPeriod(M, 0, x * m, 1)).toBeCloseTo(circularOrbitPeriod(M, x * m), 6);
			expect(kerrHoverDeficit(M, 0, x * m)).toBeCloseTo(staticDeficit(M, x * m), 14);
			expect(kerrHoverAcceleration(M, 0, x * m) / hoverAcceleration(M, x * m)).toBeCloseTo(1, 5);
		}
	});

	it('reproduces Bardeen, Press and Teukolsky radii at extremal spin', () => {
		expect(outerHorizon(M, 1) / m).toBeCloseTo(1, 12);
		expect(kerrIsco(M, 1, 1) / m).toBeCloseTo(1, 6);
		expect(kerrIsco(M, 1, -1) / m).toBeCloseTo(9, 6);
		expect(kerrPhotonOrbit(M, 1, 1) / m).toBeCloseTo(1, 6);
		expect(kerrPhotonOrbit(M, 1, -1) / m).toBeCloseTo(4, 6);
	});

	it('puts the prograde ISCO of a 0.9 spin hole at 2.32 gravitational radii', () => {
		expect(kerrIsco(M, 0.9, 1) / m).toBeCloseTo(2.3209, 3);
		expect(kerrIsco(M, 0.9, -1) / m).toBeCloseTo(8.7174, 3);
	});

	it('drags prograde orbiters: they keep more time and circle more slowly', () => {
		const r = 6 * m;
		expect(kerrOrbitDeficit(M, 0.9, r, 1)).toBeCloseTo(0.2566, 3);
		expect(kerrOrbitDeficit(M, 0.9, r, -1)).toBeCloseTo(0.3455, 3);
		expect(kerrOrbitPeriod(M, 0.9, r, 1)).toBeGreaterThan(kerrOrbitPeriod(M, 0.9, r, -1));
	});

	it('stretches radial distance toward the Kerr horizon, not the Schwarzschild radius', () => {
		const f = makeField({ mass: M, spin: 0.9 });
		const plain = makeField({ mass: M });
		expect(f.radialStretch(1000 * m) / plain.radialStretch(1000 * m)).toBeCloseTo(1, 6);
		expect(f.radialStretch(1.6 * m)).toBeLessThan(10);
		expect(f.radialStretch(f.surface * 1.0001)).toBeGreaterThan(50);
	});

	it('lets a hovering ship reach inside the ergosphere of a spinning hole', () => {
		const r = 1.5 * m;
		expect(outerHorizon(M, 0.9) / m).toBeCloseTo(1.436, 3);
		const d = kerrHoverDeficit(M, 0.9, r);
		expect(d).toBeGreaterThan(0.5);
		expect(d).toBeLessThan(1);
		expect(kerrHoverAcceleration(M, 0.9, r)).toBeGreaterThan(kerrHoverAcceleration(M, 0.9, 3 * m));
	});
});
