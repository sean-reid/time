import { WARPS } from './defaults';

/** Roughly how many integrator steps one frame can afford, and how many an orbit takes in each regime. */
const STEPS_PER_FRAME = 20_000;
export const STEPS_PER_ORBIT = { geodesic: 320, newtonian: 3142 } as const;
export type Regime = keyof typeof STEPS_PER_ORBIT;
const FRAMES_PER_SECOND = 60;
/** Frames longer than this are stalls, not measurements. */
const STALL_SECONDS = 0.25;
const WINDOW_FRAMES = 12;
const SHORTFALL = 0.05;

/** Fastest warp the integrator can honour on an orbit of this period in this regime. */
export function warpCap(period: number, regime: Regime = 'geodesic'): number {
	const budget = STEPS_PER_FRAME * (period / STEPS_PER_ORBIT[regime]) * FRAMES_PER_SECOND;
	const allowed = WARPS.filter((w) => w <= budget);
	return allowed[allowed.length - 1] ?? WARPS[0];
}

/** Kepler period of the orbit through r at this speed; an unbound ship gets the circular period at r. */
export function keplerPeriod(mu: number, r: number, speed: number): number {
	const energy = (speed * speed) / 2 - mu / r;
	const a = energy < 0 ? -mu / (2 * energy) : r;
	return 2 * Math.PI * Math.sqrt((a * a * a) / mu);
}

/** The warp really achieved when it trails the setting by more than a few percent, else null. */
export function shortfall(setting: number, measured: number | null): number | null {
	if (measured === null || measured >= setting * (1 - SHORTFALL)) return null;
	return measured;
}

/** Simulated seconds advanced per real second, over the last few frames. */
export class WarpMeter {
	private sim: number[] = [];
	private real: number[] = [];

	record(simSeconds: number, realSeconds: number): void {
		if (realSeconds <= 0 || realSeconds > STALL_SECONDS) return;
		this.sim.push(simSeconds);
		this.real.push(realSeconds);
		if (this.sim.length > WINDOW_FRAMES) {
			this.sim.shift();
			this.real.shift();
		}
	}

	reset(): void {
		this.sim = [];
		this.real = [];
	}

	/** null until a frame has been recorded. */
	get rate(): number | null {
		if (this.real.length === 0) return null;
		const real = this.real.reduce((a, b) => a + b, 0);
		return this.sim.reduce((a, b) => a + b, 0) / real;
	}
}
