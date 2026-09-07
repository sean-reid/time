import { bodyById, type Body } from '$lib/catalogue';
import {
	earthReferenceDeficit,
	integrate,
	type Course,
	type Flight,
	type Sample
} from '$lib/physics';
import { defaultCamera, defaultCourse, fieldFor, WARPS, type Camera } from './defaults';
import {
	addWaypoint,
	clampWaypoint,
	removeWaypoint,
	snapRadius,
	toPolar,
	updateWaypoint,
	type Dwell as EditDwell
} from './edit';
import type { SceneSnapshot } from './url';

export type Phase = 'orbiting' | 'holding' | 'cruising' | 'landed' | 'horizon';

export interface ShipState extends Sample {
	phase: Phase;
}

export class Scene {
	body = $state<Body>(bodyById('earth'));
	course = $state<Course>({ waypoints: [], cruiseSpeed: 1 });
	warp = $state(1);
	t = $state(0);
	playing = $state(true);
	camera = $state<Camera>({ frame: 1, cx: 0, cy: 0, follow: false });
	/** Wall clock at which the ship left Earth; both clocks read this at t = 0. */
	departedAt = $state(Date.now());
	plotting = $state(false);
	selected = $state<number | null>(null);

	field = $derived(fieldFor(this.body));
	flight = $derived<Flight>(integrate(this.field, this.course));
	earthDeficit = $derived(earthReferenceDeficit(this.body.id === 'earth'));
	ship = $derived<ShipState>(this.stateAt(this.t));
	earthElapsed = $derived(this.t * (1 - this.earthDeficit));
	drift = $derived(this.ship.tau - this.earthElapsed);
	shipMs = $derived(this.departedAt + this.ship.tau * 1000);
	earthMs = $derived(this.departedAt + this.earthElapsed * 1000);

	constructor(snapshot?: SceneSnapshot | null) {
		if (snapshot) {
			this.body = bodyById(snapshot.body);
			this.course = {
				...snapshot.course,
				waypoints: snapshot.course.waypoints.map((w) => clampWaypoint(w, this.field))
			};
			this.warp = snapshot.warp;
			this.t = snapshot.t;
			this.camera = snapshot.camera ?? defaultCamera(snapshot.course);
		} else {
			this.course = defaultCourse(this.body, this.field);
			this.camera = defaultCamera(this.course);
		}
	}

	setBody(id: string) {
		this.body = bodyById(id);
		this.course = defaultCourse(this.body, this.field);
		this.camera = defaultCamera(this.course);
		this.restart();
	}

	setCourse(course: Course) {
		this.course = course;
		this.restart();
	}

	clearCourse() {
		this.selected = null;
		this.setCourse(defaultCourse(this.body, this.field));
	}

	addWaypointAt(x: number, y: number) {
		this.course = addWaypoint(this.course, toPolar(x, y), this.field);
		this.selected = this.course.waypoints.length - 1;
	}

	addWaypointByKeyboard() {
		const from = this.course.waypoints[this.selected ?? this.course.waypoints.length - 1];
		const r = from ? from.r * 1.25 : this.field.surface * 3;
		const phi = from ? from.phi + 0.6 : 0;
		this.course = addWaypoint(this.course, { r, phi }, this.field);
		this.selected = this.course.waypoints.length - 1;
	}

	moveWaypoint(i: number, x: number, y: number, snapTo: readonly number[], tolerance: number) {
		const p = toPolar(x, y);
		const r = snapRadius(p.r, snapTo, tolerance);
		this.course = updateWaypoint(this.course, i, { r, phi: p.phi }, this.field);
	}

	patchWaypoint(i: number, patch: { r?: number; phi?: number; dwell?: EditDwell | undefined }) {
		this.course = updateWaypoint(this.course, i, patch, this.field);
	}

	removeWaypoint(i: number) {
		this.course = removeWaypoint(this.course, i);
		if (this.course.waypoints.length === 0) this.clearCourse();
		else this.selected = Math.min(i, this.course.waypoints.length - 1);
	}

	setCruiseSpeed(v: number) {
		this.course = { ...this.course, cruiseSpeed: v };
	}

	restart() {
		this.t = 0;
		this.departedAt = Date.now();
		this.playing = true;
	}

	advance(realSeconds: number) {
		if (this.playing) this.t += realSeconds * this.warp;
	}

	stepWarp(direction: 1 | -1) {
		const i = WARPS.indexOf(this.warp);
		const next = WARPS[Math.min(WARPS.length - 1, Math.max(0, (i < 0 ? 0 : i) + direction))];
		this.warp = next;
	}

	snapshot(): SceneSnapshot {
		return {
			body: this.body.id,
			course: this.course,
			warp: this.warp,
			t: this.t,
			camera: this.camera
		};
	}

	/** The ship's state at coordinate time t, continuing the last waypoint's motion past the course end. */
	stateAt(t: number): ShipState {
		const f = this.flight;
		const last = f.samples[f.samples.length - 1];
		if (t <= f.totalT || f.samples.length < 2) {
			return { ...f.stateAt(t), phase: phaseOf(f.stateAt(t), this.course) };
		}
		const extra = t - f.totalT;
		if (f.ending.kind === 'horizon') {
			return { ...last, t, deficit: 1, speed: 0, thrust: 0, phase: 'horizon' };
		}
		const wp = this.course.waypoints[this.course.waypoints.length - 1];
		if (f.ending.kind === 'complete' && wp?.dwell?.kind === 'orbit') {
			const d = wp.dwell;
			const deficit = this.field.orbitDeficit(wp.r, d.direction);
			const period = this.field.orbitPeriod(wp.r, d.direction);
			return {
				t,
				tau: last.tau + extra * (1 - deficit),
				r: wp.r,
				phi: last.phi + (d.direction * 2 * Math.PI * extra) / period,
				deficit,
				speed: this.field.orbitLocalSpeed(wp.r),
				thrust: 0,
				segment: last.segment,
				phase: 'orbiting'
			};
		}
		const deficit = this.field.hoverDeficit(last.r);
		return {
			t,
			tau: last.tau + extra * (1 - deficit),
			r: last.r,
			phi: last.phi,
			deficit,
			speed: 0,
			thrust: this.field.hoverAcceleration(last.r),
			segment: last.segment,
			phase: f.ending.kind === 'surface' ? 'landed' : 'holding'
		};
	}
}

function phaseOf(s: Sample, course: Course): Phase {
	if (s.speed > 0 && s.thrust === 0) {
		const w = course.waypoints;
		const dwellIndex = dwellSegments(w).indexOf(s.segment);
		return dwellIndex >= 0 ? 'orbiting' : 'cruising';
	}
	return 'holding';
}

/** Segment numbers that belong to a dwell rather than a transfer, in integrator order. */
function dwellSegments(waypoints: Course['waypoints']): number[] {
	const out: number[] = [];
	let seg = 0;
	waypoints.forEach((w, i) => {
		if (w.dwell) out.push(seg++);
		if (i < waypoints.length - 1) seg++;
	});
	return out;
}
