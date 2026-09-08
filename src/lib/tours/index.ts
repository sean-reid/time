import { bodyById, type Body } from '$lib/catalogue';
import {
	formatClock,
	formatDrift,
	formatLength,
	formatRelativeRate,
	formatSpeed,
	formatThrust
} from '$lib/format';
import { AU, C, GM_EARTH, GM_SUN, R_SUN, type FlightSample, type Plan } from '$lib/physics';
import { fieldFor, type Camera } from '$lib/sim/defaults';
import type { Scene } from '$lib/sim/scene.svelte';

export interface Stop {
	/** The stop begins at the first sample for which this holds; stops must come true in order. */
	when: (sample: FlightSample, scene: Scene) => boolean;
	/** Metres across the shorter side of the plate once this stop is reached. */
	frame?: number;
	text: (scene: Scene) => string;
}

export interface Tour {
	id: string;
	title: string;
	blurb: string;
	body: Body;
	plan: Plan;
	warp: number;
	camera: Camera;
	stops: Stop[];
}

const rate = (s: Scene) => formatRelativeRate(s.shipDeficit, s.earthDeficit);
const up = (s: Scene) => formatLength(s.ship.r - s.field.surface);
const thrust = (s: Scene) => formatThrust(s.ship.thrust);
const speed = (s: Scene) => formatSpeed(s.ship.speed);
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const always = () => true;

function gps(): Tour {
	const body = bodyById('earth');
	const field = fieldFor(body);
	const gpsR = body.orbits!.find((o) => o.id === 'gps')!.radius.value;
	const v = Math.sqrt(GM_EARTH / gpsR);
	const period = field.orbitPeriod(gpsR, 1);
	return {
		id: 'gps',
		title: 'Why GPS corrects its clocks',
		blurb: 'Start in the GPS constellation, brake, and fall toward the ground.',
		body,
		plan: {
			start: { r: gpsR, phi: -Math.PI / 4, kind: 'orbit', direction: 1 },
			manoeuvres: [
				{ at: period / 2, kind: 'kick', dv: 0.36 * v, heading: 'retrograde' },
				{ at: period / 2 + 3 * 3600, kind: 'kick', dv: 0.6 * v, heading: 'retrograde' }
			]
		},
		warp: 600,
		camera: { frame: 2.6 * gpsR, cx: 0, cy: 0, follow: false },
		stops: [
			{
				when: always,
				text: (s) =>
					`You are in the GPS constellation's orbit, ${up(s)} up at ${speed(s)}. Weaker gravity speeds your clock; your speed slows it. Net, ${rate(s)}. Every satellite corrects for exactly this.`
			},
			{
				when: (smp) => smp.t >= period / 2,
				text: (s) =>
					`A retrograde kick. You are still in free fall, but now on an ellipse that dips far lower. Watch the rate change as you descend: ${rate(s)}.`
			},
			{
				when: (smp) => smp.t > period / 2 + 600 && smp.r < 1.3 * field.surface,
				frame: 3.2 * field.surface,
				text: (s) =>
					`Low and fast: ${speed(s)} at ${up(s)}. Down here speed costs more than the thinner gravity gives back, so ${rate(s)}.`
			},
			{
				when: (smp, s) => s.ship.phase === 'landed',
				frame: 3.2 * field.surface,
				text: (s) =>
					`Down. Standing here takes ${thrust(s)}, and the two clocks agree to within ${rate(s).replace(' fast', '').replace(' slow', '')}.`
			}
		]
	};
}

function sunDive(): Tour {
	const body = bodyById('sun');
	const v = Math.sqrt(GM_SUN / AU);
	return {
		id: 'sun',
		title: 'Fall into the Sun',
		blurb: 'Cancel most of Earth’s orbital speed and let the Sun take you, two months of falling.',
		body,
		plan: {
			start: { r: AU, phi: 0, kind: 'orbit', direction: 1 },
			manoeuvres: [{ at: 0, kind: 'kick', dv: 0.93 * v, heading: 'retrograde' }]
		},
		warp: 86_400,
		camera: { frame: 2.6 * AU, cx: 0, cy: 0, follow: false },
		stops: [
			{
				when: always,
				text: (s) =>
					`At Earth's distance, having thrown away most of your orbital speed. The Sun's pull slows clocks out here by ten parts per billion, Earth's included; ${rate(s)} for now.`
			},
			{
				when: (smp) => smp.r < 0.3 * AU,
				frame: 0.8 * AU,
				text: (s) =>
					`Inside Mercury's orbit at ${speed(s)}. Gravity and speed now both cost you: ${rate(s)}.`
			},
			{
				when: (smp) => smp.r < 0.03 * AU,
				frame: 0.08 * AU,
				text: (s) =>
					`${cap(up(s))} above the photosphere and falling at ${speed(s)}. ${cap(rate(s))}.`
			},
			{
				when: (smp, s) => s.ship.phase === 'landed',
				frame: 12 * R_SUN,
				text: (s) =>
					`You reached the photosphere at ${formatClock(s.shipMs)} on your clock, ${formatDrift(s.drift).slice(1)} behind Earth. Standing here takes ${thrust(s)}.`
			}
		]
	};
}

function neutronStar(): Tour {
	const body = bodyById('psr-j0348-0432');
	const field = fieldFor(body);
	const R = field.surface;
	const r0 = R + 100e3;
	const v = field.orbitLocalSpeed(r0);
	return {
		id: 'neutron-star',
		title: 'The clock you can see slowing',
		blurb: 'A two solar mass pulsar twelve kilometres in radius. Brake, and swing low over it.',
		body,
		plan: {
			start: { r: r0, phi: -Math.PI / 4, kind: 'orbit', direction: 1 },
			manoeuvres: [{ at: 4, kind: 'kick', dv: 0.3 * v, heading: 'retrograde' }]
		},
		warp: 1,
		camera: { frame: 2.8 * r0, cx: 0, cy: 0, follow: false },
		stops: [
			{
				when: always,
				text: (s) =>
					`Orbiting a star of two solar masses ${up(s)} out, at ${speed(s)}. Watch the red second hand: ${rate(s)}.`
			},
			{
				when: (smp) => smp.t >= 4,
				frame: 2.8 * r0,
				text: (s) =>
					`A retrograde kick puts you on an ellipse that swings low over the star. Each pass at the low point, ${rate(s)}, and the hand lags more.`
			},
			{
				when: (smp) => smp.t > 4 && smp.r < 2.6 * R,
				frame: 6 * R,
				text: (s) =>
					`Low point of the ellipse, ${up(s)} above the surface at ${speed(s)}: ${rate(s)}.`
			}
		]
	};
}

function sgrA(): Tour {
	const body = bodyById('sgr-a-star');
	const field = fieldFor(body);
	const isco = field.isco(1);
	const ergo = field.ergosphere!;
	const r0 = 4 * isco;
	return {
		id: 'sgr-a-star',
		title: 'Into Sagittarius A*',
		blurb:
			'A wide orbit, a hard brake, then the fall through the last stable orbit and the ergosphere.',
		body,
		plan: {
			start: { r: r0, phi: -Math.PI / 4, kind: 'orbit', direction: 1 },
			manoeuvres: [
				{ at: field.orbitPeriod(r0, 1) / 2, kind: 'kick', dv: 0.25 * C, heading: 'retrograde' }
			]
		},
		warp: 600,
		camera: { frame: 2.6 * r0, cx: 0, cy: 0, follow: false },
		stops: [
			{
				when: always,
				text: (s) =>
					`A wide orbit of the galaxy's central black hole, ${up(s)} above the horizon at ${speed(s)}. Already ${rate(s)}.`
			},
			{
				when: (smp) => smp.t >= field.orbitPeriod(r0, 1) / 2,
				text: (s) =>
					`A quarter of light speed thrown away. Nothing can circle inside the innermost stable orbit, so from here it is a fall: ${rate(s)}.`
			},
			{
				when: (smp) => smp.r < isco,
				frame: 3 * isco,
				text: (s) => `Inside the innermost stable orbit at ${speed(s)}. ${cap(rate(s))}.`
			},
			{
				when: (smp) => smp.r < ergo,
				frame: 3 * ergo,
				text: (s) =>
					`Inside the ergosphere nothing can stay still; dragged space sweeps you around as you fall. ${cap(rate(s))}.`
			},
			{
				when: (smp, s) => s.ship.phase === 'horizon',
				frame: 3 * ergo,
				text: (s) =>
					`You crossed the horizon at ${formatClock(s.shipMs)} on your clock, ${formatDrift(s.drift).slice(1)} behind Earth. From here no signal gets out, and Earth's clock, reckoned from far away, runs on without you.`
			}
		]
	};
}

export const tours: Tour[] = [gps(), sunDive(), neutronStar(), sgrA()];

export function tourById(id: string): Tour | null {
	return tours.find((t) => t.id === id) ?? null;
}

export function tourSnapshot(tour: Tour) {
	return { body: tour.body.id, plan: tour.plan, warp: tour.warp, t: 0, camera: tour.camera };
}

/** Index of the current stop: the last one whose condition has come true by now. */
export function currentStop(tour: Tour, scene: Scene): number {
	let idx = 0;
	tour.stops.forEach((stop, i) => {
		if (stop.when(scene.ship, scene)) idx = i;
	});
	return idx;
}

/** Coordinate time at which the next stop begins, searching forward through the flight. */
export function nextStopTime(tour: Tour, scene: Scene, from: number): number | null {
	const index = currentStop(tour, scene);
	const target = tour.stops[index + 1];
	if (!target) return null;
	const traj = scene.trajectory;
	for (let pass = 0; pass < 40; pass++) {
		for (const s of traj.samples) {
			if (s.t > from && target.when(s, scene)) return s.t;
		}
		if (traj.ending) return traj.ending.t + 1;
		traj.ensure(traj.last.t * 2 + 60);
	}
	return null;
}
