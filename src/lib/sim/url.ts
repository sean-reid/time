import { findBody } from '$lib/catalogue';
import { C, type Heading, type Manoeuvre, type Plan } from '$lib/physics';
import { WARPS, type Camera } from './defaults';

export interface SceneSnapshot {
	body: string;
	plan: Plan;
	warp: number;
	/** Coordinate seconds into the flight. */
	t: number;
	camera?: Camera;
}

/** Wire order of headings; changing it would corrupt every shared link. */
const HEADINGS: Heading[] = ['prograde', 'retrograde', 'outward', 'inward'];
/** Wire value for a hold that lasts until the ship is let go. */
const OPEN_HOLD = -1;
/** Longest flight a link may describe, in coordinate seconds: about thirty thousand years. */
export const MAX_LINK_SECONDS = 1e12;
const MAX_MANOEUVRES = 64;

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
	return [sig(m.at, 9), 'h', m.duration === Infinity ? OPEN_HOLD : sig(m.duration, 6)];
}

function finite(n: unknown, min: number, max: number): n is number {
	return typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
}

function unpack(p: unknown): Manoeuvre | null {
	if (!Array.isArray(p) || !finite(p[0], 0, MAX_LINK_SECONDS)) return null;
	if (p[1] === 'k') {
		if (!finite(p[2], 0, C) || !finite(p[3], 0, HEADINGS.length - 1)) return null;
		return { at: p[0], kind: 'kick', dv: p[2], heading: HEADINGS[Math.round(p[3])] };
	}
	if (p[1] === 'h') {
		if (p[2] === OPEN_HOLD) return { at: p[0], kind: 'hold', duration: Infinity };
		if (!finite(p[2], 0, MAX_LINK_SECONDS)) return null;
		return { at: p[0], kind: 'hold', duration: p[2] };
	}
	return null;
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

/** Decode a link, or null when any part of it is not a scene this site can show. */
export function decodeScene(encoded: string): SceneSnapshot | null {
	try {
		const p = JSON.parse(fromBase64Url(encoded)) as unknown[];
		if (!Array.isArray(p) || typeof p[0] !== 'string' || !findBody(p[0])) return null;
		const st = p[1];
		if (!Array.isArray(st) || !finite(st[0], 1, 1e30) || !finite(st[1], -1e6, 1e6)) return null;
		if (!Array.isArray(p[2]) || p[2].length > MAX_MANOEUVRES) return null;
		const manoeuvres: Manoeuvre[] = [];
		for (const raw of p[2]) {
			const m = unpack(raw);
			if (!m) return null;
			manoeuvres.push(m);
		}
		const rawWarp = p[3];
		if (!finite(rawWarp, 1, WARPS[WARPS.length - 1]) || !finite(p[4], 0, MAX_LINK_SECONDS))
			return null;
		const warp = WARPS.reduce((best, w) =>
			Math.abs(w - rawWarp) < Math.abs(best - rawWarp) ? w : best
		);
		const snapshot: SceneSnapshot = {
			body: p[0],
			plan: {
				start: {
					r: st[0],
					phi: st[1],
					kind: st[2] === 'h' ? 'hold' : 'orbit',
					direction: st[3] === -1 ? -1 : 1
				},
				manoeuvres
			},
			warp,
			t: p[4]
		};
		const cam = p[5];
		if (
			Array.isArray(cam) &&
			cam.length === 4 &&
			finite(cam[0], 1, 1e30) &&
			finite(cam[1], -1e30, 1e30) &&
			finite(cam[2], -1e30, 1e30)
		) {
			snapshot.camera = { frame: cam[0], cx: cam[1], cy: cam[2], follow: cam[3] === true };
		}
		return snapshot;
	} catch {
		return null;
	}
}
