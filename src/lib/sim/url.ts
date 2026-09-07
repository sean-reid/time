import type { Course, Waypoint } from '$lib/physics';

export interface SceneSnapshot {
	body: string;
	course: Course;
	warp: number;
	/** Coordinate seconds into the flight. */
	t: number;
	camera?: { mpp: number; cx: number; cy: number; follow: boolean };
}

type Packed = [
	string,
	number,
	number,
	number,
	Array<[number, number] | [number, number, 'o', number, 1 | -1] | [number, number, 'h', number]>,
	Array<number | boolean>?
];

function packWaypoint(w: Waypoint): Packed[4][number] {
	const r = Number(w.r.toPrecision(9));
	const phi = Number(w.phi.toPrecision(6));
	if (!w.dwell) return [r, phi];
	if (w.dwell.kind === 'orbit') return [r, phi, 'o', w.dwell.revolutions, w.dwell.direction];
	return [r, phi, 'h', Number(w.dwell.duration.toPrecision(6))];
}

function unpackWaypoint(p: Packed[4][number]): Waypoint {
	const [r, phi] = p;
	if (p.length === 2) return { r, phi };
	if (p[2] === 'o') return { r, phi, dwell: { kind: 'orbit', revolutions: p[3], direction: p[4] } };
	return { r, phi, dwell: { kind: 'hover', duration: p[3] } };
}

function toBase64Url(s: string): string {
	const bytes = new TextEncoder().encode(s);
	let bin = '';
	for (const b of bytes) bin += String.fromCharCode(b);
	return btoa(bin).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): string {
	const bin = atob(s.replaceAll('-', '+').replaceAll('_', '/'));
	const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
	return new TextDecoder().decode(bytes);
}

export function encodeScene(s: SceneSnapshot): string {
	const packed: Packed = [
		s.body,
		Number(s.course.cruiseSpeed.toPrecision(6)),
		s.warp,
		Number(s.t.toPrecision(9)),
		s.course.waypoints.map(packWaypoint)
	];
	if (s.camera) {
		packed.push([
			Number(s.camera.mpp.toPrecision(6)),
			Number(s.camera.cx.toPrecision(6)),
			Number(s.camera.cy.toPrecision(6)),
			s.camera.follow
		]);
	}
	return toBase64Url(JSON.stringify(packed));
}

export function decodeScene(encoded: string): SceneSnapshot | null {
	try {
		const p = JSON.parse(fromBase64Url(encoded)) as Packed;
		if (typeof p[0] !== 'string' || !Array.isArray(p[4])) return null;
		const snapshot: SceneSnapshot = {
			body: p[0],
			course: { cruiseSpeed: p[1], waypoints: p[4].map(unpackWaypoint) },
			warp: p[2],
			t: p[3]
		};
		const cam = p[5];
		if (cam && cam.length === 4) {
			snapshot.camera = {
				mpp: cam[0] as number,
				cx: cam[1] as number,
				cy: cam[2] as number,
				follow: cam[3] as boolean
			};
		}
		return snapshot;
	} catch {
		return null;
	}
}
