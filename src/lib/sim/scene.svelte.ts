import { bodyById, type Body } from '$lib/catalogue';
import {
	earthReferenceDeficit,
	Trajectory,
	type FlightSample,
	type Heading,
	type Plan,
	type Space,
	type Start
} from '$lib/physics';
import { defaultCamera, defaultPlan, fieldFor, spaceFor, WARPS, type Camera } from './defaults';
import type { SceneSnapshot } from './url';

export type Phase = 'orbiting' | 'coasting' | 'holding' | 'landed' | 'horizon';

export interface ShipState extends FlightSample {
	phase: Phase;
}

export class Scene {
	body = $state<Body>(bodyById('earth'));
	plan = $state<Plan>({ start: { r: 1, phi: 0, kind: 'orbit', direction: 1 }, manoeuvres: [] });
	warp = $state(1);
	t = $state(0);
	playing = $state(true);
	camera = $state<Camera>({ frame: 1, cx: 0, cy: 0, follow: false });
	/** Wall clock at which the ship left Earth; both clocks read this at t = 0. */
	departedAt = $state(Date.now());
	/** Id of the guided tour this scene came from, cleared by any edit. */
	tour = $state<string | null>(null);
	sound = $state(false);
	/** Bumped when the trajectory must be rebuilt from the start. */
	private generation = $state(0);
	/** Bumped when the flight gains samples, so drawings of the path know to refresh. */
	samplesVersion = $state(0);

	field = $derived(fieldFor(this.body));
	space = $derived<Space>(spaceFor(this.body, this.departedAt));
	trajectory = $derived.by(() => {
		void this.generation;
		return new Trajectory(this.space, this.plan);
	});
	earthDeficit = $derived(earthReferenceDeficit(this.body.id === 'earth'));
	ship = $derived<ShipState>(this.stateAt(this.t));
	earthElapsed = $derived(this.t * (1 - this.earthDeficit));
	drift = $derived(this.ship.tau - this.earthElapsed);
	shipMs = $derived(this.departedAt + this.ship.tau * 1000);
	earthMs = $derived(this.departedAt + this.earthElapsed * 1000);

	constructor(snapshot?: SceneSnapshot | null) {
		if (snapshot) {
			this.body = bodyById(snapshot.body);
			this.plan = snapshot.plan;
			this.warp = snapshot.warp;
			this.t = snapshot.t;
			this.camera = snapshot.camera ?? defaultCamera(snapshot.plan);
		} else {
			this.plan = defaultPlan(this.body, this.field);
			this.camera = defaultCamera(this.plan);
		}
	}

	setBody(id: string) {
		this.tour = null;
		this.body = bodyById(id);
		this.plan = defaultPlan(this.body, this.field);
		this.camera = defaultCamera(this.plan);
		this.restart();
	}

	setStart(start: Partial<Start>) {
		this.tour = null;
		this.plan = { start: { ...this.plan.start, ...start }, manoeuvres: [] };
		this.restart();
	}

	/** Change velocity now, as measured by observers holding station at the ship. */
	kick(dv: number, heading: Heading) {
		this.tour = null;
		this.addManoeuvre({ at: this.t, kind: 'kick', dv, heading });
	}

	/** Fire the engine to stop dead and hold this radius until told to let go. */
	hold() {
		this.tour = null;
		this.addManoeuvre({ at: this.t, kind: 'hold', duration: Infinity });
	}

	/** End a hold: the ship falls from rest. */
	letGo() {
		this.tour = null;
		this.addManoeuvre({ at: this.t, kind: 'kick', dv: 0, heading: 'prograde' });
	}

	private addManoeuvre(m: Plan['manoeuvres'][number]) {
		const kept = this.plan.manoeuvres.filter((x) => x.at <= m.at);
		this.plan = { ...this.plan, manoeuvres: [...kept, m] };
		this.rebuild();
	}

	removeManoeuvre(index: number) {
		this.tour = null;
		this.plan = { ...this.plan, manoeuvres: this.plan.manoeuvres.filter((_, i) => i !== index) };
		this.rebuild();
	}

	clearManoeuvres() {
		this.tour = null;
		this.plan = { ...this.plan, manoeuvres: [] };
		this.rebuild();
	}

	restart() {
		this.t = 0;
		this.departedAt = Date.now();
		this.playing = true;
		this.rebuild();
	}

	private rebuild() {
		this.generation += 1;
	}

	/** Move the clock; scrubbing backwards rebuilds the flight from the start. */
	seek(t: number) {
		if (t < this.trajectory.samples[0].t) this.rebuild();
		this.t = Math.max(0, t);
		this.samplesVersion += 1;
	}

	advance(realSeconds: number) {
		if (!this.playing) return;
		const target = this.t + realSeconds * this.warp;
		const before = this.trajectory.samples.length;
		const last = this.trajectory.last;
		this.trajectory.ensure(target);
		if (this.trajectory.samples.length !== before || this.trajectory.last !== last)
			this.samplesVersion += 1;
		this.t = this.trajectory.ending ? target : Math.min(target, this.trajectory.last.t);
	}

	stepWarp(direction: 1 | -1) {
		const i = WARPS.indexOf(this.warp);
		this.warp = WARPS[Math.min(WARPS.length - 1, Math.max(0, (i < 0 ? 0 : i) + direction))];
	}

	snapshot(): SceneSnapshot {
		return { body: this.body.id, plan: this.plan, warp: this.warp, t: this.t, camera: this.camera };
	}

	stateAt(t: number): ShipState {
		const traj = this.trajectory;
		traj.ensure(t);
		const s = traj.stateAt(t);
		const ending = traj.ending;
		if (ending && t >= ending.t) {
			if (ending.kind === 'horizon') {
				return { ...s, t, deficit: 1, speed: 0, thrust: 0, holding: false, phase: 'horizon' };
			}
			return {
				...s,
				t,
				tau: s.tau + (t - ending.t) * (1 - this.field.hoverDeficit(s.r)),
				deficit: this.field.hoverDeficit(s.r),
				speed: 0,
				thrust: this.field.hoverAcceleration(s.r),
				holding: true,
				phase: 'landed'
			};
		}
		const phase: Phase = s.holding
			? 'holding'
			: this.plan.manoeuvres.length === 0
				? 'orbiting'
				: 'coasting';
		return { ...s, phase };
	}
}
