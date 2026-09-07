import { describe, expect, it } from 'vitest';
import { AU, G, GM_SUN } from './constants';
import { eccentricAnomaly, keplerState, meanAnomaly, type Elements } from './kepler';

const year = 365.256_363 * 86_400;
const earth: Elements = { a: AU, e: 0.0167, period: year, omega: 1.7966, m0: 6.24 };

describe('kepler', () => {
	it('solves the eccentric anomaly to machine precision', () => {
		for (const e of [0, 0.1, 0.5, 0.9, 0.99]) {
			for (const m of [0, 0.3, 1.7, 3.1, 5.9]) {
				const bigE = eccentricAnomaly(m, e);
				expect(bigE - e * Math.sin(bigE)).toBeCloseTo(m, 11);
			}
		}
	});

	it('returns to the same place after one period', () => {
		const a = keplerState(earth, 12_345);
		const b = keplerState(earth, 12_345 + year);
		expect(b.x).toBeCloseTo(a.x, 2);
		expect(b.y).toBeCloseTo(a.y, 2);
	});

	it('spans periapsis to apoapsis and obeys vis-viva', () => {
		const el: Elements = { a: 1e11, e: 0.4, period: 3e7, omega: 0, m0: 0 };
		const peri = keplerState(el, 0);
		const apo = keplerState(el, el.period / 2);
		expect(peri.r).toBeCloseTo(el.a * 0.6, 3);
		expect(apo.r).toBeCloseTo(el.a * 1.4, 3);
		const mu = (4 * Math.PI ** 2 * el.a ** 3) / el.period ** 2;
		const v2 = peri.vx ** 2 + peri.vy ** 2;
		expect(v2).toBeCloseTo(mu * (2 / peri.r - 1 / el.a), -2);
		expect(peri.x * peri.vx + peri.y * peri.vy).toBeCloseTo(0, 3);
	});

	it('moves Earth at about 29.8 km/s', () => {
		const s = keplerState(earth, 0);
		expect(Math.hypot(s.vx, s.vy) / 1e3).toBeCloseTo(29.8, 0);
		expect(GM_SUN / G).toBeGreaterThan(1e30);
	});

	it('wraps the mean anomaly', () => {
		expect(meanAnomaly(earth, 0)).toBeCloseTo(6.24, 6);
		expect(meanAnomaly(earth, 10 * year)).toBeCloseTo(6.24, 4);
	});
});
