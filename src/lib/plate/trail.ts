import type { FlightSample } from '$lib/physics';

export interface Point {
	x: number;
	y: number;
}

/**
 * Builds the flown path as SVG path data, extending it by only the samples added since the last
 * call and keeping a point whenever it moves at least `tolerance` pixels from the last kept one.
 * Only the first `count` samples take part, and the result excludes the last of those, which the
 * integrator may still rewrite in place.
 */
export class Trail {
	private key = '';
	private samples: FlightSample[] | null = null;
	private first: FlightSample | null = null;
	private count = 0;
	private d = '';
	private lx = NaN;
	private ly = NaN;

	extend(
		samples: FlightSample[],
		key: string,
		project: (s: FlightSample) => Point,
		tolerance = 1,
		count = samples.length
	): string {
		const stale =
			key !== this.key ||
			samples !== this.samples ||
			samples[0] !== this.first ||
			count - 1 < this.count;
		if (stale) {
			this.key = key;
			this.samples = samples;
			this.first = samples[0] ?? null;
			this.count = 0;
			this.d = '';
			this.lx = NaN;
			this.ly = NaN;
		}
		const upto = Math.min(count, samples.length) - 1;
		for (let i = this.count; i < upto; i++) {
			const p = project(samples[i]);
			if (this.d === '') {
				this.d = `M${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
			} else if (Math.hypot(p.x - this.lx, p.y - this.ly) < tolerance) {
				continue;
			} else {
				this.d += `L${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
			}
			this.lx = p.x;
			this.ly = p.y;
		}
		this.count = Math.max(upto, 0);
		return this.d;
	}
}

/** How many samples lie at or before time t, given samples sorted by time. */
export function flownCount(samples: FlightSample[], t: number): number {
	let lo = 0;
	let hi = samples.length;
	while (lo < hi) {
		const mid = (lo + hi) >> 1;
		if (samples[mid].t <= t) lo = mid + 1;
		else hi = mid;
	}
	return lo;
}
