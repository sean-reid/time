import { bodyById, type Body } from '$lib/catalogue';
import {
	formatClock,
	formatDrift,
	formatLength,
	formatRelativeRate,
	formatSpeed,
	formatThrust
} from '$lib/format';
import { AU, R_SUN, type Course } from '$lib/physics';
import { fieldFor, type Camera } from '$lib/sim/defaults';
import { floorRadius } from '$lib/sim/edit';
import type { Scene } from '$lib/sim/scene.svelte';

export interface Stop {
	/** Integrator segment at which this stop begins, or 'end' for after the course. */
	segment: number | 'end';
	/** Metres across the shorter side of the plate once this stop is reached. */
	frame?: number;
	text: (scene: Scene) => string;
}

export interface Tour {
	id: string;
	title: string;
	blurb: string;
	body: Body;
	course: Course;
	warp: number;
	camera: Camera;
	stops: Stop[];
}

const rate = (s: Scene) => formatRelativeRate(s.ship.deficit, s.earthDeficit);
const up = (s: Scene) => formatLength(s.ship.r - s.field.surface);
const thrust = (s: Scene) => formatThrust(s.ship.thrust);
const speed = (s: Scene) => formatSpeed(s.ship.speed);

function gps(): Tour {
	const body = bodyById('earth');
	const field = fieldFor(body);
	const gpsR = body.orbits!.find((o) => o.id === 'gps')!.radius.value;
	const issR = body.orbits!.find((o) => o.id === 'iss')!.radius.value;
	return {
		id: 'gps',
		title: 'Why GPS corrects its clocks',
		blurb: 'From the GPS constellation down to the ground, the two effects trade places.',
		body,
		course: {
			cruiseSpeed: 1e4,
			waypoints: [
				{ r: gpsR, phi: -Math.PI / 4, dwell: { kind: 'orbit', revolutions: 1, direction: 1 } },
				{ r: issR, phi: -Math.PI / 4, dwell: { kind: 'orbit', revolutions: 2, direction: 1 } },
				{ r: field.surface + 20e3, phi: -Math.PI / 4, dwell: { kind: 'hover', duration: 7200 } }
			]
		},
		warp: 600,
		camera: { frame: 2.6 * gpsR, cx: 0, cy: 0, follow: false },
		stops: [
			{
				segment: 0,
				text: (s) =>
					`You are in the GPS constellation's orbit, ${up(s)} up. Weaker gravity speeds your clock; your ${speed(s)} slows it. Net, ${rate(s)}. Every satellite corrects for exactly this.`
			},
			{
				segment: 2,
				frame: 3.2 * issR,
				text: (s) =>
					`At the station's height the balance flips: ${speed(s)} costs more than the slightly weaker gravity gives back. ${cap(rate(s))}.`
			},
			{
				segment: 4,
				frame: 3.2 * issR,
				text: (s) =>
					`Holding ${up(s)} above sea level, with ${thrust(s)} to stay put. ${cap(rate(s))}: near the ground the two clocks agree.`
			}
		]
	};
}

function sunDive(): Tour {
	const body = bodyById('sun');
	const field = fieldFor(body);
	return {
		id: 'sun',
		title: 'Dive to the photosphere',
		blurb: 'From Earth’s distance to the surface of the Sun, at a hundredth of light speed.',
		body,
		course: {
			cruiseSpeed: 2_997_924.58,
			waypoints: [
				{ r: AU, phi: 0 },
				{ r: 3 * R_SUN, phi: 0, dwell: { kind: 'hover', duration: 4 * 3600 } },
				{ r: floorRadius(field), phi: 0, dwell: { kind: 'hover', duration: 4 * 3600 } }
			]
		},
		warp: 3600,
		camera: { frame: 40 * R_SUN, cx: 0, cy: 0, follow: true },
		stops: [
			{
				segment: 0,
				frame: 40 * R_SUN,
				text: (s) =>
					`Under way from Earth's distance at ${speed(s)}. The Sun's pull slows every clock out here by ten parts per billion, Earth's included, so only your motion shows: ${rate(s)}.`
			},
			{
				segment: 1,
				frame: 12 * R_SUN,
				text: (s) => `Three solar radii out. Holding station takes ${thrust(s)}, and ${rate(s)}.`
			},
			{
				segment: 3,
				frame: 6 * R_SUN,
				text: (s) =>
					`At the photosphere, ${up(s)} above the nominal surface: ${rate(s)}. Standing here takes ${thrust(s)}.`
			}
		]
	};
}

function neutronStar(): Tour {
	const body = bodyById('psr-j0348-0432');
	const field = fieldFor(body);
	const R = field.surface;
	return {
		id: 'neutron-star',
		title: 'The clock you can see slowing',
		blurb: 'A two solar mass pulsar twelve kilometres across. Here the hands visibly lag.',
		body,
		course: {
			cruiseSpeed: 14_989_622.9,
			waypoints: [
				{
					r: 100e3 + R,
					phi: -Math.PI / 4,
					dwell: { kind: 'orbit', revolutions: 400, direction: 1 }
				},
				{ r: 2 * R, phi: Math.PI / 2, dwell: { kind: 'hover', duration: 20 } },
				{ r: floorRadius(field), phi: Math.PI / 2, dwell: { kind: 'hover', duration: 20 } }
			]
		},
		warp: 1,
		camera: { frame: 2.8 * (100e3 + R), cx: 0, cy: 0, follow: false },
		stops: [
			{
				segment: 0,
				text: (s) =>
					`Orbiting a star of two solar masses ${up(s)} out, at ${speed(s)}. Watch the red second hand: ${rate(s)}.`
			},
			{
				segment: 2,
				frame: 6 * R,
				text: (s) => `Holding one radius above the surface takes ${thrust(s)}. ${cap(rate(s))}.`
			},
			{
				segment: 4,
				frame: 6 * R,
				text: (s) =>
					`At the surface, ${rate(s)}, and ${thrust(s)} to stand there. This is where light itself starts to fall behind.`
			}
		]
	};
}

function sgrA(): Tour {
	const body = bodyById('sgr-a-star');
	const field = fieldFor(body);
	const isco = field.isco(1);
	const ergo = 2 * (field.surface / (1 + Math.sqrt(1 - field.spin ** 2)));
	return {
		id: 'sgr-a-star',
		title: 'Into Sagittarius A*',
		blurb: 'A wide orbit, the last stable orbit, the ergosphere, then the horizon.',
		body,
		course: {
			cruiseSpeed: 29_979_245.8,
			waypoints: [
				{
					r: 4 * isco,
					phi: -Math.PI / 4,
					dwell: { kind: 'orbit', revolutions: 0.5, direction: 1 }
				},
				{ r: 1.02 * isco, phi: 1.2, dwell: { kind: 'hover', duration: 3600 } },
				{ r: 0.9 * ergo, phi: 1.8, dwell: { kind: 'hover', duration: 3600 } },
				{ r: 0, phi: 1.8 }
			]
		},
		warp: 600,
		camera: { frame: 2.6 * 4 * isco, cx: 0, cy: 0, follow: false },
		stops: [
			{
				segment: 0,
				text: (s) =>
					`A wide orbit of the galaxy's central black hole, ${up(s)} above the horizon at ${speed(s)}. Already ${rate(s)}.`
			},
			{
				segment: 2,
				frame: 3 * isco,
				text: (s) =>
					`Holding just outside the innermost stable orbit. ${cap(rate(s))}; holding takes ${thrust(s)}.`
			},
			{
				segment: 4,
				frame: 3 * ergo,
				text: (s) =>
					`Inside the ergosphere nothing can stay still. You hold your radius while dragged space sweeps you around: ${rate(s)}.`
			},
			{
				segment: 'end',
				frame: 3 * ergo,
				text: (s) =>
					`You crossed the horizon at ${formatClock(s.shipMs)} on your clock, ${formatDrift(s.drift).slice(1)} behind Earth. From here no signal gets out, and Earth's clock, reckoned from far away, runs on without you.`
			}
		]
	};
}

function cap(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

export const tours: Tour[] = [gps(), sunDive(), neutronStar(), sgrA()];

export function tourById(id: string): Tour | null {
	return tours.find((t) => t.id === id) ?? null;
}

export function tourSnapshot(tour: Tour) {
	return { body: tour.body.id, course: tour.course, warp: tour.warp, t: 0, camera: tour.camera };
}

/** Index of the stop the ship is currently in, given the integrator segment and whether the course is over. */
export function currentStop(tour: Tour, segment: number, over: boolean): number {
	let idx = 0;
	tour.stops.forEach((stop, i) => {
		if (stop.segment === 'end' ? over : segment >= stop.segment) idx = i;
	});
	return idx;
}
