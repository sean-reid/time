import { C, C2, G } from './constants';
import type { Field } from './field';
import {
	angularRates,
	circularOrbit,
	fromLocal,
	geometricUnits,
	MAX_LOCAL_SPEED,
	metricAt,
	outerHorizonGeometric,
	stepGeodesic,
	toLocal,
	type GeoState
} from './geodesic';
import { keplerState, type Elements } from './kepler';
import { sqrtDeficit } from './schwarzschild';

export type Heading = 'prograde' | 'retrograde' | 'outward' | 'inward';

export type Manoeuvre =
	| { at: number; kind: 'kick'; dv: number; heading: Heading }
	| { at: number; kind: 'hold'; duration: number };

export interface Start {
	r: number;
	phi: number;
	kind: 'orbit' | 'hold';
	direction: 1 | -1;
}

export interface Plan {
	start: Start;
	manoeuvres: Manoeuvre[];
}

export interface FlightSample {
	t: number;
	tau: number;
	r: number;
	/** Unwrapped, so it keeps counting past 2π. */
	phi: number;
	deficit: number;
	/** Speed relative to observers holding station, m/s. */
	speed: number;
	thrust: number;
	holding: boolean;
}

export type FlightEnding = {
	kind: 'horizon' | 'surface';
	t: number;
	tau: number;
	/** Clock deficit and gravity where the ship came to rest, for a landing. */
	deficit?: number;
	thrust?: number;
} | null;

/** A companion whose pull the ship feels in the Newtonian regime. */
export interface Attractor {
	mu: number;
	radius: number;
	elements: Elements;
}

export interface Space {
	field: Field;
	/** Geodesics around compact bodies; Newtonian motion with a post-Newtonian clock elsewhere. */
	regime: 'geodesic' | 'newtonian';
	attractors: Attractor[];
	/** Seconds since J2000 at flight time zero, so companions sit where they really are. */
	epoch: number;
}

const MAX_SAMPLES = 60_000;
const MAX_STEPS_PER_ENSURE = 40_000;

interface Stepper {
	sample(): FlightSample;
	/** Advance by at most `dt` coordinate seconds. Returns false when the flight has ended. */
	step(dt: number): boolean;
	kick(dv: number, heading: Heading): void;
	hold(duration: number): void;
	ending: FlightEnding;
}

export class Trajectory {
	samples: FlightSample[] = [];
	ending: FlightEnding = null;
	private stepper: Stepper;
	private queue: Manoeuvre[];
	private lastPushedPhi = NaN;
	private lastPushedT = -Infinity;

	constructor(
		private space: Space,
		private plan: Plan
	) {
		this.stepper =
			space.regime === 'geodesic'
				? new GeodesicStepper(space, plan.start)
				: new NewtonianStepper(space, plan.start);
		this.queue = [...plan.manoeuvres].sort((a, b) => a.at - b.at);
		if (plan.start.kind === 'hold') this.stepper.hold(Infinity);
		this.applyDue(0);
		this.push(this.stepper.sample(), true);
	}

	/** Apply every queued manoeuvre whose time has come. */
	private applyDue(now: number): boolean {
		let applied = false;
		while (this.queue.length && this.queue[0].at <= now + 1e-9) {
			const next = this.queue.shift()!;
			if (next.kind === 'kick') this.stepper.kick(next.dv, next.heading);
			else this.stepper.hold(next.duration);
			applied = true;
		}
		return applied;
	}

	get last(): FlightSample {
		return this.samples[this.samples.length - 1];
	}

	/** Apply a manoeuvre to the live flight when its time is within the last step; false means replay. */
	applyNow(m: Manoeuvre): boolean {
		const prev = this.samples[this.samples.length - 2] ?? this.samples[0];
		if (this.ending || m.at < prev.t || m.at > this.last.t + 1e-9) return false;
		this.queue = [];
		if (m.kind === 'kick') this.stepper.kick(m.dv, m.heading);
		else this.stepper.hold(m.duration);
		this.push(this.stepper.sample(), true);
		return true;
	}

	/** Integrate until coordinate time tMax or the flight ends; bounded work per call. */
	ensure(tMax: number): void {
		let steps = 0;
		while (!this.ending && steps++ < MAX_STEPS_PER_ENSURE) {
			if (this.applyDue(this.last.t)) this.push(this.stepper.sample(), true);
			if (this.last.t >= tMax) break;
			const next = this.queue[0];
			const target = next ? Math.min(tMax, next.at) : tMax;
			const alive = this.stepper.step(target - this.last.t);
			this.push(this.stepper.sample(), !alive);
			if (!alive) this.ending = this.stepper.ending;
		}
	}

	private push(s: FlightSample, force: boolean) {
		const moved = Math.abs(s.phi - this.lastPushedPhi) >= 0.004 || s.t - this.lastPushedT >= 1;
		if (!force && !moved && this.samples.length > 1) {
			this.samples[this.samples.length - 1] = s;
			return;
		}
		this.samples.push(s);
		this.lastPushedPhi = s.phi;
		this.lastPushedT = s.t;
		if (this.samples.length > MAX_SAMPLES) this.samples.splice(0, this.samples.length >> 2);
	}

	stateAt(t: number): FlightSample {
		const s = this.samples;
		if (t <= s[0].t) return s[0];
		if (t >= this.last.t) return this.last;
		let lo = 0;
		let hi = s.length - 1;
		while (hi - lo > 1) {
			const mid = (lo + hi) >> 1;
			if (s[mid].t <= t) lo = mid;
			else hi = mid;
		}
		const a = s[lo];
		const b = s[hi];
		const f = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t);
		return {
			t,
			tau: a.tau + f * (b.tau - a.tau),
			r: a.r + f * (b.r - a.r),
			phi: a.phi + f * (b.phi - a.phi),
			deficit: a.deficit + f * (b.deficit - a.deficit),
			speed: a.speed + f * (b.speed - a.speed),
			thrust: a.thrust,
			holding: a.holding
		};
	}
}

class GeodesicStepper implements Stepper {
	private a: number;
	private len: number;
	private time: number;
	private state: GeoState;
	private tau = 0;
	private horizon: number;
	private surface: number;
	private holdLeft = 0;
	private direction: 1 | -1;
	ending: FlightEnding = null;

	constructor(space: Space, start: Start) {
		this.direction = start.direction;
		const u = geometricUnits(space.field.mass);
		this.len = u.length;
		this.time = u.time;
		this.a = space.field.spin;
		this.horizon = outerHorizonGeometric(this.a);
		this.surface = space.field.horizon === null ? space.field.surface / this.len : this.horizon;
		const r = start.r / this.len;
		const { E, L } = circularOrbit(r, this.a, start.direction);
		this.state = { t: 0, r, phi: start.phi, ur: 0, E, L };
	}

	sample(): FlightSample {
		const s = this.state;
		const m = metricAt(s.r, this.a);
		const { ut, up } = angularRates(m, s.E, s.L);
		const holding = this.holdLeft > 0;
		const v = holding ? { vr: 0, vphi: 0 } : toLocal(s.r, this.a, ut, up, s.ur);
		const rest = fromLocal(s.r, this.a, 0, 0);
		return {
			t: s.t * this.time,
			tau: this.tau * this.time,
			r: s.r * this.len,
			phi: s.phi,
			deficit: 1 - 1 / (holding ? rest.ut : ut),
			speed: C * Math.hypot(v.vr, v.vphi),
			thrust: holding ? this.hoverAcceleration(s.r) : 0,
			holding
		};
	}

	private hoverAcceleration(r: number): number {
		const h = 1e-6 * r;
		const alpha = (x: number) => {
			const m = metricAt(x, this.a);
			return Math.sqrt(-m.gtt + (m.gtp * m.gtp) / m.gpp);
		};
		const dAlpha = (alpha(r + h) - alpha(r - h)) / (2 * h);
		const m = metricAt(r, this.a);
		return ((dAlpha / alpha(r)) * Math.sqrt(1 / m.grr) * C2) / this.len;
	}

	step(dt: number): boolean {
		const dtGeo = dt / this.time;
		if (this.holdLeft > 0) {
			const use = Math.min(dtGeo, this.holdLeft);
			const rest = fromLocal(this.state.r, this.a, 0, 0);
			const m = metricAt(this.state.r, this.a);
			const dragged = (-m.gtp / m.gpp) * use;
			this.state = {
				...this.state,
				t: this.state.t + use,
				phi: this.state.phi + dragged,
				ur: 0,
				E: rest.E,
				L: rest.L
			};
			this.tau += use / rest.ut;
			this.holdLeft -= use;
			return true;
		}
		const { ut } = angularRates(metricAt(this.state.r, this.a), this.state.E, this.state.L);
		const { state, dtau } = stepGeodesic(this.state, this.a, dtGeo / ut);
		this.state = state;
		this.tau += dtau;
		if (state.r <= this.surface * (1 + 1e-6)) {
			this.ending = {
				kind: this.surface === this.horizon ? 'horizon' : 'surface',
				t: state.t * this.time,
				tau: this.tau * this.time
			};
			return false;
		}
		return true;
	}

	kick(dv: number, heading: Heading): void {
		const s = this.state;
		this.holdLeft = 0;
		const { ut, up } = angularRates(metricAt(s.r, this.a), s.E, s.L);
		const v = toLocal(s.r, this.a, ut, up, s.ur);
		const speed = Math.hypot(v.vr, v.vphi);
		const along =
			speed > 1e-9 ? { r: v.vr / speed, p: v.vphi / speed } : { r: 0, p: this.direction };
		const dir = directionVector(heading, along);
		const dvc = dv / C;
		const next = fromLocal(s.r, this.a, v.vr + dvc * dir.r, v.vphi + dvc * dir.p);
		this.state = { ...s, ur: next.ur, E: next.E, L: next.L };
	}

	hold(duration: number): void {
		this.holdLeft = duration === Infinity ? Infinity : duration / this.time;
		const rest = fromLocal(this.state.r, this.a, 0, 0);
		this.state = { ...this.state, ur: 0, E: rest.E, L: rest.L };
	}
}

class NewtonianStepper implements Stepper {
	private x: number;
	private y: number;
	private vx: number;
	private vy: number;
	private t = 0;
	private tau = 0;
	private phi: number;
	private holdLeft = 0;
	private direction: 1 | -1;
	ending: FlightEnding = null;

	constructor(
		private space: Space,
		start: Start
	) {
		this.direction = start.direction;
		this.x = start.r * Math.cos(start.phi);
		this.y = start.r * Math.sin(start.phi);
		this.phi = start.phi;
		const v = Math.sqrt((space.field.mass * G) / start.r);
		this.vx = -start.direction * v * Math.sin(start.phi);
		this.vy = start.direction * v * Math.cos(start.phi);
	}

	private mu(): number {
		return this.space.field.mass * G;
	}

	private keplerCache: { t: number; states: { x: number; y: number }[] } | null = null;

	/** Companion positions at t, solved once per distinct time since RK4 asks several times per step. */
	private companionsAt(t: number): { x: number; y: number }[] {
		if (this.keplerCache && this.keplerCache.t === t) return this.keplerCache.states;
		const states = this.space.attractors.map((c) => keplerState(c.elements, this.space.epoch + t));
		this.keplerCache = { t, states };
		return states;
	}

	private pulls(
		x: number,
		y: number,
		t: number
	): { ax: number; ay: number; grav: number; hit: boolean } {
		let ax = 0;
		let ay = 0;
		let grav = 0;
		let hit = false;
		const r = Math.hypot(x, y);
		const mu = this.mu();
		ax -= (mu * x) / (r * r * r);
		ay -= (mu * y) / (r * r * r);
		grav += mu / (r * C2);
		if (r <= this.space.field.surface) hit = true;
		const positions = this.companionsAt(t);
		for (const [i, c] of this.space.attractors.entries()) {
			const p = positions[i];
			const dx = x - p.x;
			const dy = y - p.y;
			const d = Math.hypot(dx, dy);
			const pr = Math.hypot(p.x, p.y);
			ax -= (c.mu * dx) / (d * d * d) + (c.mu * p.x) / (pr * pr * pr);
			ay -= (c.mu * dy) / (d * d * d) + (c.mu * p.y) / (pr * pr * pr);
			grav += c.mu / (d * C2);
			if (d <= c.radius) hit = true;
		}
		return { ax, ay, grav, hit };
	}

	sample(): FlightSample {
		const r = Math.hypot(this.x, this.y);
		const holding = this.holdLeft > 0;
		const { ax, ay, grav } = this.pulls(this.x, this.y, this.t);
		const v = holding ? 0 : Math.hypot(this.vx, this.vy);
		const kin = sqrtDeficit(Math.min(0.999, (v * v) / C2));
		return {
			t: this.t,
			tau: this.tau,
			r,
			phi: this.phi,
			deficit: grav + kin - grav * kin,
			speed: v,
			thrust: holding ? Math.hypot(ax, ay) : 0,
			holding
		};
	}

	private timescale(): number {
		let h = 0.002 * Math.sqrt(Math.hypot(this.x, this.y) ** 3 / this.mu());
		const positions = this.companionsAt(this.t);
		for (const [i, c] of this.space.attractors.entries()) {
			const p = positions[i];
			const d = Math.hypot(this.x - p.x, this.y - p.y);
			h = Math.min(h, 0.002 * Math.sqrt(d ** 3 / c.mu));
		}
		return Math.max(0.05, h);
	}

	step(dt: number): boolean {
		if (this.holdLeft > 0) {
			const use = Math.min(dt, this.holdLeft);
			const { grav } = this.pulls(this.x, this.y, this.t);
			this.t += use;
			this.tau += use * (1 - grav);
			this.holdLeft -= use;
			return true;
		}
		const h = Math.min(dt, this.timescale());
		const [x0, y0, t0, tau0] = [this.x, this.y, this.t, this.tau];
		const r0 = Math.hypot(x0, y0);
		const f = (x: number, y: number, vx: number, vy: number, t: number) => {
			const p = this.pulls(x, y, t);
			return [vx, vy, p.ax, p.ay];
		};
		const k1 = f(this.x, this.y, this.vx, this.vy, this.t);
		const k2 = f(
			this.x + (h / 2) * k1[0],
			this.y + (h / 2) * k1[1],
			this.vx + (h / 2) * k1[2],
			this.vy + (h / 2) * k1[3],
			this.t + h / 2
		);
		const k3 = f(
			this.x + (h / 2) * k2[0],
			this.y + (h / 2) * k2[1],
			this.vx + (h / 2) * k2[2],
			this.vy + (h / 2) * k2[3],
			this.t + h / 2
		);
		const k4 = f(
			this.x + h * k3[0],
			this.y + h * k3[1],
			this.vx + h * k3[2],
			this.vy + h * k3[3],
			this.t + h
		);
		const vMid = Math.hypot(this.vx, this.vy);
		const gravMid = this.pulls(this.x, this.y, this.t).grav;
		this.x += (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
		this.y += (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
		this.vx += (h / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
		this.vy += (h / 6) * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]);
		this.t += h;
		const kin = sqrtDeficit(Math.min(0.999, (vMid * vMid) / C2));
		this.tau += h * (1 - (gravMid + kin - gravMid * kin));
		const raw = Math.atan2(this.y, this.x);
		let d = raw - (((this.phi % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)) + Math.PI;
		d = ((d % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
		this.phi += d > Math.PI ? d - 2 * Math.PI : d;
		const after = this.pulls(this.x, this.y, this.t);
		if (after.hit) {
			const r1 = Math.hypot(this.x, this.y);
			const f = Math.min(1, Math.max(0, (r0 - this.space.field.surface) / Math.max(1e-9, r0 - r1)));
			this.x = x0 + (this.x - x0) * f;
			this.y = y0 + (this.y - y0) * f;
			this.t = t0 + h * f;
			this.tau = tau0 + (this.tau - tau0) * f;
			const rest = this.pulls(this.x, this.y, this.t);
			this.ending = {
				kind: 'surface',
				t: this.t,
				tau: this.tau,
				deficit: rest.grav,
				thrust: Math.hypot(rest.ax, rest.ay)
			};
			return false;
		}
		return true;
	}

	kick(dv: number, heading: Heading): void {
		this.holdLeft = 0;
		const speed = Math.hypot(this.vx, this.vy);
		const r = Math.hypot(this.x, this.y);
		const rhat = { x: this.x / r, y: this.y / r };
		const along =
			speed > 1e-9 ? { x: this.vx / speed, y: this.vy / speed } : { x: -rhat.y, y: rhat.x };
		const dir = directionVectorXY(heading, along, rhat);
		this.vx += dv * dir.x;
		this.vy += dv * dir.y;
		const after = Math.hypot(this.vx, this.vy);
		const cap = MAX_LOCAL_SPEED * C;
		if (after > cap) {
			this.vx *= cap / after;
			this.vy *= cap / after;
		}
	}

	hold(duration: number): void {
		this.holdLeft = duration;
		this.vx = 0;
		this.vy = 0;
	}
}

function directionVector(
	heading: Heading,
	along: { r: number; p: number }
): { r: number; p: number } {
	switch (heading) {
		case 'prograde':
			return along;
		case 'retrograde':
			return { r: -along.r, p: -along.p };
		case 'outward':
			return { r: 1, p: 0 };
		case 'inward':
			return { r: -1, p: 0 };
	}
}

function directionVectorXY(
	heading: Heading,
	along: { x: number; y: number },
	rhat: { x: number; y: number }
): { x: number; y: number } {
	switch (heading) {
		case 'prograde':
			return along;
		case 'retrograde':
			return { x: -along.x, y: -along.y };
		case 'outward':
			return rhat;
		case 'inward':
			return { x: -rhat.x, y: -rhat.y };
	}
}
