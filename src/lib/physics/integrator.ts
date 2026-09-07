import type { Course, Waypoint } from './course';
import type { Field } from './field';

export interface Sample {
	/** Coordinate time since departure. */
	t: number;
	/** Ship proper time since departure. */
	tau: number;
	r: number;
	phi: number;
	/** Rate deficit 1 - dτ/dt at this sample. */
	deficit: number;
	/** Local speed relative to observers holding station. */
	speed: number;
	/** Proper acceleration the engine supplies, m/s². */
	thrust: number;
	segment: number;
}

export type Ending =
	| { kind: 'complete' }
	| { kind: 'horizon'; t: number; tau: number }
	| { kind: 'surface'; t: number; tau: number };

export interface Flight {
	samples: Sample[];
	ending: Ending;
	totalT: number;
	totalTau: number;
	stateAt(t: number): Sample;
}

const MAX_SAMPLES = 40_000;
const MAX_LOG_R_STEP = 0.002;
const MAX_PHI_STEP = 0.01;
/** Fraction of the remaining gap to a horizon or surface covered per step, so the approach resolves. */
const MAX_FLOOR_STEP = 0.05;

function push(samples: Sample[], s: Sample) {
	if (samples.length < MAX_SAMPLES) samples.push(s);
}

export function integrate(field: Field, course: Course): Flight {
	const samples: Sample[] = [];
	let ending: Ending = { kind: 'complete' };
	const wps = course.waypoints;
	if (wps.length === 0) return emptyFlight();

	let t = 0;
	let tau = 0;
	let segment = 0;
	const first = wps[0];
	const orbiting = first.dwell?.kind === 'orbit' ? first.dwell : null;
	push(samples, {
		t,
		tau,
		r: first.r,
		phi: first.phi,
		deficit: orbiting
			? field.orbitDeficit(first.r, orbiting.direction)
			: field.hoverDeficit(first.r),
		speed: orbiting ? field.orbitLocalSpeed(first.r) : 0,
		thrust: orbiting ? 0 : field.hoverAcceleration(first.r),
		segment
	});

	outer: for (let i = 0; i < wps.length; i++) {
		const w = wps[i];
		if (w.dwell) {
			const res = dwell(field, w, t, tau, segment, samples);
			t = res.t;
			tau = res.tau;
			segment++;
		}
		const next = wps[i + 1];
		if (!next) break;
		const res = transfer(field, w, next, course.cruiseSpeed, t, tau, segment, samples);
		t = res.t;
		tau = res.tau;
		segment++;
		if (res.ending) {
			ending = res.ending;
			break outer;
		}
	}

	const last = samples[samples.length - 1];
	return {
		samples,
		ending,
		totalT: last.t,
		totalTau: last.tau,
		stateAt: (q) => stateAt(samples, q)
	};
}

function emptyFlight(): Flight {
	const s: Sample = { t: 0, tau: 0, r: 0, phi: 0, deficit: 0, speed: 0, thrust: 0, segment: 0 };
	return { samples: [s], ending: { kind: 'complete' }, totalT: 0, totalTau: 0, stateAt: () => s };
}

function dwell(
	field: Field,
	w: Waypoint,
	t0: number,
	tau0: number,
	segment: number,
	samples: Sample[]
): { t: number; tau: number } {
	const d = w.dwell!;
	if (d.kind === 'hover') {
		const deficit = field.hoverDeficit(w.r);
		const thrust = field.hoverAcceleration(w.r);
		const steps = 64;
		for (let k = 1; k <= steps; k++) {
			const t = t0 + (d.duration * k) / steps;
			const tau = tau0 + (t - t0) * (1 - deficit);
			push(samples, { t, tau, r: w.r, phi: w.phi, deficit, speed: 0, thrust, segment });
		}
		return { t: t0 + d.duration, tau: tau0 + d.duration * (1 - deficit) };
	}
	const deficit = field.orbitDeficit(w.r, d.direction);
	const period = field.orbitPeriod(w.r, d.direction);
	const speed = field.orbitLocalSpeed(w.r);
	const total = d.revolutions * period;
	const steps = Math.min(4000, Math.max(64, Math.ceil(d.revolutions * 128)));
	for (let k = 1; k <= steps; k++) {
		const t = t0 + (total * k) / steps;
		const phi = w.phi + d.direction * 2 * Math.PI * d.revolutions * (k / steps);
		push(samples, {
			t,
			tau: tau0 + (t - t0) * (1 - deficit),
			r: w.r,
			phi,
			deficit,
			speed,
			thrust: 0,
			segment
		});
	}
	return { t: t0 + total, tau: tau0 + total * (1 - deficit) };
}

function transfer(
	field: Field,
	a: Waypoint,
	b: Waypoint,
	v: number,
	t0: number,
	tau0: number,
	segment: number,
	samples: Sample[]
): { t: number; tau: number; ending?: Ending } {
	const ax = a.r * Math.cos(a.phi);
	const ay = a.r * Math.sin(a.phi);
	const bx = b.r * Math.cos(b.phi);
	const by = b.r * Math.sin(b.phi);
	const floor = field.horizon ?? field.surface;
	let t = t0;
	let tau = tau0;
	let s = 0;
	let x = ax;
	let y = ay;
	let r = a.r;
	let phi = a.phi;
	let guard = 0;
	while (s < 1 && guard++ < MAX_SAMPLES) {
		const dxTotal = bx - ax;
		const dyTotal = by - ay;
		const dlTotal = Math.hypot(dxTotal, dyTotal);
		if (dlTotal === 0) break;
		const radial = Math.abs((x * dxTotal + y * dyTotal) / (r * dlTotal));
		const dsByR = (MAX_LOG_R_STEP * r) / (dlTotal * Math.max(radial, 1e-3));
		const dsByFloor = (MAX_FLOOR_STEP * (r - floor)) / (dlTotal * Math.max(radial, 1e-3));
		const dsByPhi = (MAX_PHI_STEP * r) / dlTotal;
		const ds = Math.min(1 - s, dsByR, dsByFloor, dsByPhi, 0.01);
		const nx = ax + dxTotal * (s + ds);
		const ny = ay + dyTotal * (s + ds);
		const nr = Math.hypot(nx, ny);
		const nphi = Math.atan2(ny, nx);
		const rMid = 0.5 * (r + nr);
		if (nr <= floor * (1 + 1e-9)) {
			const kind = field.horizon !== null ? 'horizon' : 'surface';
			push(samples, {
				t,
				tau,
				r,
				phi,
				deficit: field.movingDeficit(r, v),
				speed: v,
				thrust: 0,
				segment
			});
			return { t, tau, ending: { kind, t, tau } };
		}
		const dr = nr - r;
		let dphi = nphi - phi;
		if (dphi > Math.PI) dphi -= 2 * Math.PI;
		if (dphi < -Math.PI) dphi += 2 * Math.PI;
		const properLength = Math.hypot(dr * field.radialStretch(rMid), rMid * dphi);
		const hover = field.hoverDeficit(rMid);
		const dt = properLength / (v * (1 - hover));
		const deficit = field.movingDeficit(rMid, v);
		t += dt;
		tau += dt * (1 - deficit);
		s += ds;
		x = nx;
		y = ny;
		r = nr;
		phi = nphi;
		push(samples, { t, tau, r, phi, deficit, speed: v, thrust: 0, segment });
	}
	return { t, tau };
}

function stateAt(samples: Sample[], t: number): Sample {
	if (t <= samples[0].t) return samples[0];
	const last = samples[samples.length - 1];
	if (t >= last.t) return last;
	let lo = 0;
	let hi = samples.length - 1;
	while (hi - lo > 1) {
		const mid = (lo + hi) >> 1;
		if (samples[mid].t <= t) lo = mid;
		else hi = mid;
	}
	const a = samples[lo];
	const b = samples[hi];
	const f = (t - a.t) / (b.t - a.t);
	let dphi = b.phi - a.phi;
	if (dphi > Math.PI) dphi -= 2 * Math.PI;
	if (dphi < -Math.PI) dphi += 2 * Math.PI;
	return {
		t,
		tau: a.tau + f * (b.tau - a.tau),
		r: a.r + f * (b.r - a.r),
		phi: a.phi + f * dphi,
		deficit: a.deficit + f * (b.deficit - a.deficit),
		speed: a.speed,
		thrust: a.thrust,
		segment: a.segment
	};
}
