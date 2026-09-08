import { bodyById, type Body } from '$lib/catalogue';
import { keplerState, schwarzschildRadius, type Field } from '$lib/physics';
import { elementsOf } from '$lib/sim/defaults';
import { isochroneRadius } from './metric';
import { sx, sy, visibleRing, type View } from './view';

export interface Ring {
	r: number;
	label: string;
	dash: string;
}

export interface Isochrone {
	r: number;
	rate: number;
}

export interface CompanionNow {
	name: string;
	radius: number;
	x: number;
	y: number;
	path: string;
}

const ISOCHRONES = [0.9, 0.5, 0.1, 0.01];

/** Named orbits and, around a black hole, the photon sphere, ISCOs and ergosphere. */
export function landmarkRings(view: View, field: Field, body: Body): Ring[] {
	const out: Ring[] = [];
	if (field.horizon !== null) {
		out.push({ r: field.photonOrbit(1), label: 'photon sphere', dash: '2 3' });
		out.push({ r: field.isco(1), label: field.spin ? 'ISCO, prograde' : 'ISCO', dash: '6 4' });
		if (field.spin) {
			out.push({ r: field.isco(-1), label: 'ISCO, retrograde', dash: '6 4' });
			out.push({ r: field.ergosphere!, label: 'ergosphere', dash: '1 3' });
		}
	}
	for (const o of body.orbits ?? []) out.push({ r: o.radius.value, label: o.name, dash: '' });
	return out.filter((x) => visibleRing(view, x.r) && x.r > field.surface);
}

/** Radii where a clock held at rest runs at each listed fraction of a far one. */
export function isochroneRings(view: View, field: Field): Isochrone[] {
	const rsBody = field.horizon ?? schwarzschildRadius(field.mass);
	return ISOCHRONES.map((rate) => ({ r: isochroneRadius(rsBody, rate), rate })).filter(
		(x) => visibleRing(view, x.r) && x.r > field.surface
	);
}

/** The ellipse each companion follows, in screen space; depends on the camera, not the clock. */
export function companionPaths(view: View, body: Body): string[] {
	return (body.companions ?? []).map((c) => {
		const el = elementsOf(c);
		let d = '';
		for (let i = 0; i <= 180; i++) {
			const p = keplerState(el, (el.period * i) / 180);
			d += `${i === 0 ? 'M' : 'L'}${sx(view, p.x).toFixed(1)} ${sy(view, p.y).toFixed(1)}`;
		}
		return d;
	});
}

/** Companions where they really are `since` seconds after J2000. */
export function companionsNow(body: Body, since: number, paths: string[]): CompanionNow[] {
	return (body.companions ?? []).map((c, i) => {
		const partner = bodyById(c.body);
		const now = keplerState(elementsOf(c), since);
		return {
			name: partner.name,
			radius: partner.radius?.value ?? 0,
			x: now.x,
			y: now.y,
			path: paths[i]
		};
	});
}
