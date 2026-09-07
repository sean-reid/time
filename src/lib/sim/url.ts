import type { Heading, Manoeuvre, Plan } from '$lib/physics';

export interface SceneSnapshot {
	body: string;
	plan: Plan;
	warp: number;
	/** Coordinate seconds into the flight. */
	t: number;
	camera?: { frame: number; cx: number; cy: number; follow: boolean };
}

const HEADINGS: Heading[] = ['prograde', 'retrograde', 'outward', 'inward'];

type PackedManoeuvre = [number, 'k', number, number] | [number, 'h', number];
type Packed = [
	string,
	[number, number, 'o' | 'h', 1 | -1],
	PackedManoeuvre[],
	number,
	number,
	Array<number | boolean>?
];

function sig(n: number, digits: number): number {
	return Number(n.toPrecision(digits));
}

function pack(m: Manoeuvre): PackedManoeuvre {
	if (m.kind === 'kick') return [sig(m.at, 9), 'k', sig(m.dv, 6), HEADINGS.indexOf(m.heading)];
	return [sig(m.at, 9), 'h', sig(m.duration, 6)];
}

function unpack(p: PackedManoeuvre): Manoeuvre {
	if (p[1] === 'k')
		return { at: p[0], kind: 'kick', dv: p[2], heading: HEADINGS[p[3]] ?? 'prograde' };
	return { at: p[0], kind: 'hold', duration: p[2] };
}

function toBase64Url(s: string): string {
	const bytes = new TextEncoder().encode(s);
	let bin = '';
	for (const b of bytes) bin += String.fromCharCode(b);
	return btoa(bin).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): string {
	const bin = atob(s.replaceAll('-', '+').replaceAll('_', '/'));
	return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function encodeScene(s: SceneSnapshot): string {
	const st = s.plan.start;
	const packed: Packed = [
		s.body,
		[sig(st.r, 9), sig(st.phi, 6), st.kind === 'orbit' ? 'o' : 'h', st.direction],
		s.plan.manoeuvres.map(pack),
		s.warp,
		sig(s.t, 9)
	];
	if (s.camera) {
		packed.push([
			sig(s.camera.frame, 6),
			sig(s.camera.cx, 6),
			sig(s.camera.cy, 6),
			s.camera.follow
		]);
	}
	return toBase64Url(JSON.stringify(packed));
}

export function decodeScene(encoded: string): SceneSnapshot | null {
	try {
		const p = JSON.parse(fromBase64Url(encoded)) as Packed;
		if (typeof p[0] !== 'string' || !Array.isArray(p[1]) || !Array.isArray(p[2])) return null;
		const [r, phi, kind, direction] = p[1];
		const snapshot: SceneSnapshot = {
			body: p[0],
			plan: {
				start: {
					r,
					phi,
					kind: kind === 'h' ? 'hold' : 'orbit',
					direction: direction === -1 ? -1 : 1
				},
				manoeuvres: p[2].map(unpack)
			},
			warp: p[3],
			t: p[4]
		};
		const cam = p[5];
		if (cam && cam.length === 4) {
			snapshot.camera = {
				frame: cam[0] as number,
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
