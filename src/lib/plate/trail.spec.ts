import { describe, expect, it } from 'vitest';
import type { FlightSample } from '$lib/physics';
import { Trail } from './trail';

function sample(t: number, x: number, y: number): FlightSample {
	return {
		t,
		tau: t,
		r: Math.hypot(x, y),
		phi: Math.atan2(y, x),
		deficit: 0,
		speed: 0,
		thrust: 0,
		holding: false
	};
}
const project = (s: FlightSample) => ({ x: s.r * Math.cos(s.phi), y: s.r * Math.sin(s.phi) });
const segments = (d: string) => (d.match(/L/g) ?? []).length;

describe('trail', () => {
	it('keeps every kept sample of a curve instead of striding over it', () => {
		const pts: FlightSample[] = [];
		for (let i = 0; i <= 4000; i++) {
			const a = (i / 4000) * 2 * Math.PI * 3;
			pts.push(sample(i, 200 * Math.cos(a), 200 * Math.sin(a)));
		}
		const d = new Trail().extend(pts, 'k', project);
		expect(segments(d)).toBeGreaterThan(1800);
		expect(d.startsWith('M200.0 0.0')).toBe(true);
	});

	it('drops points that stay within a pixel and appends only new samples', () => {
		const trail = new Trail();
		const pts = [sample(0, 0, 0), sample(1, 0.2, 0), sample(2, 0.4, 0), sample(3, 5, 0)];
		expect(trail.extend(pts, 'k', project)).toBe('M0.0 0.0');
		pts.push(sample(4, 10, 0));
		expect(trail.extend(pts, 'k', project)).toBe('M0.0 0.0L5.0 0.0');
		pts.push(sample(5, 20, 0), sample(6, 30, 0));
		expect(trail.extend(pts, 'k', project)).toBe('M0.0 0.0L5.0 0.0L10.0 0.0L20.0 0.0');
	});

	it('starts over when the samples are replaced by a thinned array', () => {
		const trail = new Trail();
		const pts = [
			sample(0, 0, 0),
			sample(1, 5, 0),
			sample(2, 10, 0),
			sample(3, 15, 0),
			sample(4, 20, 0)
		];
		expect(trail.extend(pts, 'k', project)).toBe('M0.0 0.0L5.0 0.0L10.0 0.0L15.0 0.0');
		const thinned = [pts[0], pts[2], pts[4], sample(5, 25, 0), sample(6, 30, 0)];
		expect(trail.extend(thinned, 'k', project)).toBe('M0.0 0.0L10.0 0.0L20.0 0.0L25.0 0.0');
	});

	it('starts over when the zoom key or the sample array changes', () => {
		const trail = new Trail();
		const pts = [sample(0, 0, 0), sample(1, 5, 0), sample(2, 10, 0)];
		trail.extend(pts, 'a', project);
		expect(trail.extend(pts, 'b', (s) => ({ x: project(s).x * 2, y: 0 }))).toBe(
			'M0.0 0.0L10.0 0.0'
		);
		expect(trail.extend([sample(0, 1, 1), sample(1, 9, 9)], 'b', project)).toBe('M1.0 1.0');
	});
});
