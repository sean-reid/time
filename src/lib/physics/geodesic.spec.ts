import { describe, expect, it } from 'vitest';
import {
	angularRates,
	circularOrbit,
	fromLocal,
	metricAt,
	stepGeodesic,
	toLocal,
	type GeoState
} from './geodesic';

function norm(r: number, a: number, ut: number, up: number, ur: number): number {
	const m = metricAt(r, a);
	return m.gtt * ut * ut + 2 * m.gtp * ut * up + m.gpp * up * up + m.grr * ur * ur;
}

function run(state: GeoState, a: number, tauEnd: number): GeoState {
	let s = state;
	let tau = 0;
	while (tau < tauEnd) {
		const { state: next, dtau } = stepGeodesic(s, a, tauEnd - tau);
		s = next;
		tau += dtau;
	}
	return s;
}

describe('equatorial geodesics', () => {
	it('keeps the four-velocity normalised and a circular orbit circular, with spin', () => {
		for (const a of [0, 0.9]) {
			const r = 8;
			const { E, L, ut } = circularOrbit(r, a, 1);
			const m = metricAt(r, a);
			const { up } = angularRates(m, E, L);
			expect(norm(r, a, ut, up, 0)).toBeCloseTo(-1, 9);
			const s = run({ t: 0, r, phi: 0, ur: 0, E, L }, a, 500);
			expect(s.r).toBeCloseTo(r, 6);
			const rates = angularRates(metricAt(s.r, a), E, L);
			expect(norm(s.r, a, rates.ut, rates.up, s.ur)).toBeCloseTo(-1, 6);
		}
	});

	it('matches the Kepler period far out and 1/sqrt(1 - 3/r) time dilation on the orbit', () => {
		const r = 1000;
		const { E, L, ut } = circularOrbit(r, 0, 1);
		const m = metricAt(r, 0);
		const { up } = angularRates(m, E, L);
		expect(up / ut).toBeCloseTo(Math.pow(r, -1.5), 12);
		expect(ut).toBeCloseTo(1 / Math.sqrt(1 - 3 / r), 12);
	});

	it('round-trips local velocities through the frame', () => {
		const { ut, up, ur } = fromLocal(6, 0.7, 0.1, -0.4);
		const v = toLocal(6, 0.7, ut, up, ur);
		expect(v.vr).toBeCloseTo(0.1, 12);
		expect(v.vphi).toBeCloseTo(-0.4, 12);
		expect(norm(6, 0.7, ut, up, ur)).toBeCloseTo(-1, 10);
	});

	it('precesses Mercury by 43 arcseconds per century', () => {
		const mSun = 1.476625e3;
		const a = 5.7909e10 / mSun;
		const e = 0.20563;
		const rp = a * (1 - e);
		const vp = Math.sqrt((1 + e) / (a * (1 - e)));
		const { E, L } = fromLocal(rp, 0, 0, vp / Math.sqrt(1 - 2 / rp));
		let s: GeoState = { t: 0, r: rp, phi: 0, ur: 0, E, L };
		const peri: number[] = [];
		let prev: GeoState[] = [];
		while (peri.length < 3 && s.phi < 30) {
			const up = angularRates(metricAt(s.r, 0), E, L).up;
			const { state } = stepGeodesic(s, 0, 1e-4 / up);
			prev = [...prev.slice(-1), s];
			if (prev.length === 2 && s.ur < 0 && state.ur >= 0 && state.phi > 1) {
				const [p0, p1, p2] = [prev[0], s, state];
				const d1 = (p1.ur - p0.ur) / (p1.phi - p0.phi);
				const d2 = (p2.ur - p1.ur) / (p2.phi - p1.phi);
				const curv = (d2 - d1) / (p2.phi - p0.phi);
				const slope = d1 + curv * (p1.phi - p0.phi);
				const root = p1.phi - p1.ur / slope - (curv * (p1.ur / slope) ** 2) / slope;
				peri.push(root);
			}
			s = state;
		}
		const perOrbit = (peri[2] - peri[0]) / 2 - 2 * Math.PI;
		const perCentury = ((perOrbit * (36525 / 87.969) * 180) / Math.PI) * 3600;
		const analytic =
			((((6 * Math.PI) / (a * (1 - e * e))) * (36525 / 87.969) * 180) / Math.PI) * 3600;
		expect(analytic).toBeCloseTo(43, 0);
		expect(perCentury / analytic).toBeCloseTo(1, 1);
	});

	it('falls from rest to the horizon in the textbook proper time', () => {
		const r0 = 10;
		const { E, L } = fromLocal(r0, 0, 0, 0);
		let s: GeoState = { t: 0, r: r0, phi: 0, ur: 0, E, L };
		let tau = 0;
		while (s.r > 2.001) {
			const { state, dtau } = stepGeodesic(s, 0, 0.5);
			s = state;
			tau += dtau;
		}
		const eta = Math.acos((2 * 2) / r0 - 1);
		const expected = Math.sqrt(r0 ** 3 / 8) * (eta + Math.sin(eta));
		expect(tau / expected).toBeCloseTo(1, 2);
		expect(s.t).toBeGreaterThan(tau);
	});
});
