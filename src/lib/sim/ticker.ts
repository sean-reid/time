/** Whole seconds of a clock passed between two readings, capped so a jump cannot flood the scheduler. */
export function crossings(prev: number, next: number, cap = 30): number {
	if (next <= prev) return 0;
	return Math.min(cap, Math.floor(next) - Math.floor(prev));
}

/** Ticks per real second above this become a tone rather than separate clicks. */
export const TONE_THRESHOLD = 30;
const TOP_HZ = 4000;

/** Bring a tick rate into hearing by dividing by ten until it fits; both voices share the divisor. */
export function foldDivisor(maxHz: number): number {
	let d = 1;
	while (maxHz / d > TOP_HZ) d *= 10;
	return d;
}

interface Voice {
	gain: GainNode;
	osc: OscillatorNode | null;
	lastCount: number;
	freq: number;
	type: OscillatorType;
	level: number;
}

export class Ticker {
	private ctx: AudioContext | null = null;
	private master: GainNode | null = null;
	private ship: Voice | null = null;
	private earth: Voice | null = null;

	get running(): boolean {
		return this.ctx !== null;
	}

	/** Must be called from a user gesture; browsers refuse audio otherwise. */
	start(shipSeconds: number, earthSeconds: number) {
		if (this.ctx) return;
		const ctx = new AudioContext();
		const master = ctx.createGain();
		master.gain.value = 0.18;
		master.connect(ctx.destination);
		this.ctx = ctx;
		this.master = master;
		this.ship = this.voice(660, 'triangle', 1, shipSeconds);
		this.earth = this.voice(1320, 'sine', 0.55, earthSeconds);
	}

	stop() {
		this.ctx?.close();
		this.ctx = null;
		this.master = null;
		this.ship = null;
		this.earth = null;
	}

	private voice(freq: number, type: OscillatorType, level: number, seconds: number): Voice {
		const gain = this.ctx!.createGain();
		gain.gain.value = 0;
		gain.connect(this.master!);
		return { gain, osc: null, lastCount: Math.floor(seconds), freq, type, level };
	}

	/**
	 * Advance both voices. Rates are ticks of each clock per real second; seconds are the
	 * clocks' elapsed readings, which place the clicks on whole-second boundaries.
	 */
	update(shipSeconds: number, shipRate: number, earthSeconds: number, earthRate: number) {
		if (!this.ctx || !this.ship || !this.earth) return;
		const divisor = foldDivisor(Math.max(shipRate, earthRate));
		this.drive(this.ship, shipSeconds, shipRate / divisor);
		this.drive(this.earth, earthSeconds, earthRate / divisor);
	}

	private drive(v: Voice, seconds: number, rate: number) {
		const ctx = this.ctx!;
		if (rate >= TONE_THRESHOLD) {
			if (!v.osc) {
				v.osc = ctx.createOscillator();
				v.osc.type = v.type;
				v.osc.connect(v.gain);
				v.osc.start();
				v.gain.gain.setTargetAtTime(v.level * 0.5, ctx.currentTime, 0.05);
			}
			v.osc.frequency.setTargetAtTime(rate, ctx.currentTime, 0.03);
			v.lastCount = Math.floor(seconds);
			return;
		}
		if (v.osc) {
			v.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
			v.osc.stop(ctx.currentTime + 0.2);
			v.osc = null;
		}
		const n = crossings(v.lastCount, seconds);
		v.lastCount = Math.floor(seconds);
		for (let i = 0; i < n; i++) this.click(v, ctx.currentTime + i * 0.004);
	}

	private click(v: Voice, at: number) {
		const ctx = this.ctx!;
		const osc = ctx.createOscillator();
		const env = ctx.createGain();
		osc.type = v.type;
		osc.frequency.value = v.freq;
		env.gain.setValueAtTime(v.level, at);
		env.gain.exponentialRampToValueAtTime(0.001, at + 0.035);
		osc.connect(env);
		env.connect(this.master!);
		osc.start(at);
		osc.stop(at + 0.04);
	}
}
