import type { FlightSample } from '$lib/physics';

export interface Point {
	x: number;
	y: number;
}

/**
 * Builds the flown path as SVG path data, extending it by only the samples added since the last
 * call and keeping a point whenever it moves at least `tolerance` pixels from the last kept one.
 * The result excludes the newest sample, which the integrator still rewrites in place.
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
		tolerance = 1
	): string {
		const stale =
			key !== this.key ||
			samples !== this.samples ||
			samples[0] !== this.first ||
			samples.length - 1 < this.count;
		if (stale) {
			this.key = key;
			this.samples = samples;
			this.first = samples[0] ?? null;
			this.count = 0;
			this.d = '';
			this.lx = NaN;
			this.ly = NaN;
		}
		const upto = samples.length - 1;
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
