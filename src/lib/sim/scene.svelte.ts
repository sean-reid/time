import { bodyById, type Body } from '$lib/catalogue';
import {
	earthReferenceDeficit,
	Trajectory,
	type Field,
	type FlightSample,
	type Heading,
	type Plan,
	type Space,
	type Start
} from '$lib/physics';
import {
	defaultCamera,
	defaultPlan,
	fieldFor,
	solarDeficit,
	spaceFor,
	WARPS,
	type Camera
} from './defaults';
import type { SceneSnapshot } from './url';

export type Phase = 'orbiting' | 'coasting' | 'holding' | 'landed' | 'horizon';

/** Roughly how many integrator steps one frame can afford, and how many an orbit takes. */
const STEPS_PER_FRAME = 20_000;
const STEPS_PER_ORBIT = 320;
/** Bounded ensure calls a replay may spend catching up to the present before the clock yields. */
const CATCH_UP_CALLS = 8;

/** Keep a start where an orbit or a hold can exist. */
function sanitiseStart(start: Start, field: Field): Start {
	if (start.kind === 'orbit') {
		const floor = field.photonOrbit(start.direction) * 1.01;
		const isco = field.isco(start.direction);
		return { ...start, r: start.r <= floor ? Math.max(isco, floor) : start.r };
	}
	const floor = field.surface * 1.0005;
	return { ...start, r: Math.max(floor, start.r) };
}

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
	/** Bumped when the flight gains samples, so drawings of the path know to refresh. */
	samplesVersion = $state(0);
	trajectory = $state.raw<Trajectory>() as Trajectory;

	field = $derived(fieldFor(this.body));
	space = $derived<Space>(spaceFor(this.body, this.departedAt));
	earthDeficit = $derived(earthReferenceDeficit());
	/** The Sun's share of this scene's deficit, so every scene is measured against the same time. */
	solar = $derived(solarDeficit(this.body));
	ship = $derived<ShipState>(this.stateAt(this.t));
	/** Total rate deficit of the ship's clock against barycentric time. */
	shipDeficit = $derived(this.ship.deficit + this.solar - this.ship.deficit * this.solar);
	shipTau = $derived(this.ship.tau - this.solar * this.t);
	earthElapsed = $derived(this.t * (1 - this.earthDeficit));
	drift = $derived(this.shipTau - this.earthElapsed);
	shipMs = $derived(this.departedAt + this.shipTau * 1000);
	earthMs = $derived(this.departedAt + this.earthElapsed * 1000);

	constructor(snapshot?: SceneSnapshot | null) {
		if (snapshot) {
			this.body = bodyById(snapshot.body);
			this.plan = { ...snapshot.plan, start: sanitiseStart(snapshot.plan.start, this.field) };
			this.warp = Math.min(snapshot.warp, this.maxWarp);
			this.t = snapshot.t;
			this.camera = snapshot.camera ?? defaultCamera(snapshot.plan);
		} else {
			this.plan = defaultPlan(this.body, this.field);
			this.camera = defaultCamera(this.plan);
		}
		this.rebuild();
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
		this.plan = {
			start: sanitiseStart({ ...this.plan.start, ...start }, this.field),
			manoeuvres: []
		};
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

	/** Kicks land on the running flight; only a manoeuvre placed in the past replays it. */
	private addManoeuvre(m: Plan['manoeuvres'][number]) {
		const kept = this.plan.manoeuvres.filter((x) => x.at <= m.at);
		this.plan = { ...this.plan, manoeuvres: [...kept, m] };
		if (this.trajectory.applyNow(m)) {
			this.t = this.trajectory.last.t;
			this.samplesVersion += 1;
		} else {
			this.rebuild();
		}
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

	/** Replay the flight from the start and bring it back to the present within a bounded effort. */
	private rebuild() {
		const traj = new Trajectory(this.space, this.plan);
		for (let i = 0; i < CATCH_UP_CALLS && !traj.ending && traj.last.t < this.t; i++) {
			traj.ensure(this.t);
		}
		if (!traj.ending && traj.last.t < this.t) this.t = traj.last.t;
		this.trajectory = traj;
		this.samplesVersion += 1;
	}

	/** Move the clock; scrubbing before the kept path replays the flight. */
	seek(t: number) {
		this.t = Math.max(0, t);
		if (this.t < this.trajectory.samples[0].t) this.rebuild();
		else this.samplesVersion += 1;
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

	/** Fastest warp the integrator can honour here at sixty frames a second. */
	maxWarp = $derived.by(() => {
		const period = this.field.orbitPeriod(this.plan.start.r, this.plan.start.direction);
		const allowed = WARPS.filter((w) => w <= STEPS_PER_FRAME * (period / STEPS_PER_ORBIT) * 60);
		return allowed[allowed.length - 1] ?? WARPS[0];
	});

	stepWarp(direction: 1 | -1) {
		const i = WARPS.indexOf(this.warp);
		const next = WARPS[Math.min(WARPS.length - 1, Math.max(0, (i < 0 ? 0 : i) + direction))];
		this.warp = Math.min(next, this.maxWarp);
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
			const deficit = ending.deficit ?? this.field.hoverDeficit(s.r);
			return {
				...s,
				t,
				tau: s.tau + (t - ending.t) * (1 - deficit),
				deficit,
				speed: 0,
				thrust: ending.thrust ?? this.field.hoverAcceleration(s.r),
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
