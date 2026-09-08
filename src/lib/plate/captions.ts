import type { Point } from './trail';

export interface Box {
	x: number;
	y: number;
	w: number;
	h: number;
}

export interface Circle {
	x: number;
	y: number;
	r: number;
}

export interface Segment {
	ax: number;
	ay: number;
	bx: number;
	by: number;
}

export type Tone = 'ink' | 'faint' | 'accent';

/** Where a caption could sit: the text anchor (middle, baseline) and the box it would cover. */
export interface Candidate {
	x: number;
	y: number;
	box: Box;
}

export interface Request {
	text: string;
	tone: Tone;
	candidates: Candidate[];
}

export interface Placed extends Candidate {
	text: string;
	tone: Tone;
}

/** Discs nothing may cover, lines captions prefer to avoid, and the plate they must stay inside. */
export interface Obstacles {
	frame: Box;
	/** Boxes other overlays own, such as the scale bar. */
	reserved: Box[];
	solids: Circle[];
	lines: Circle[];
	path: Segment[];
}

export type Direction = 'E' | 'W' | 'N' | 'S' | 'NE' | 'SE' | 'NW' | 'SW';

const FONT_PX = 11;
const BOX_H = 14;
const GAP = 3;
const D = Math.SQRT1_2;
const DIRS: Record<Direction, [number, number]> = {
	E: [1, 0],
	W: [-1, 0],
	N: [0, -1],
	S: [0, 1],
	NE: [D, -D],
	SE: [D, D],
	NW: [-D, -D],
	SW: [-D, D]
};
const RING_ANGLES = [90, 45, 135, 0, 180, -45, -135, -90];

/** Cheap width estimate for the 11 px caption face, with room for the paper halo. */
export function textWidth(text: string): number {
	return text.length * FONT_PX * 0.55 + 6;
}

function centred(cx: number, cy: number, w: number): Candidate {
	return { x: cx, y: cy + 4, box: { x: cx - w / 2, y: cy - BOX_H / 2, w, h: BOX_H } };
}

function extentAlong(w: number, nx: number, ny: number): number {
	return (Math.abs(nx) * w) / 2 + (Math.abs(ny) * BOX_H) / 2;
}

/** Boxes just outside a point in each direction, in order of preference. */
export function aroundPoint(
	p: Point,
	clearance: number,
	text: string,
	order: Direction[]
): Candidate[] {
	const w = textWidth(text);
	return order.map((d) => {
		const [nx, ny] = DIRS[d];
		const dist = clearance + extentAlong(w, nx, ny);
		return centred(p.x + nx * dist, p.y + ny * dist, w);
	});
}

/** Boxes hugging a circle: outside it at each angle first, then inside it. */
export function aroundRing(centre: Point, r: number, text: string): Candidate[] {
	const w = textWidth(text);
	const out: Candidate[] = [];
	for (const side of [1, -1]) {
		for (const deg of RING_ANGLES) {
			const a = (deg * Math.PI) / 180;
			const nx = Math.cos(a);
			const ny = -Math.sin(a);
			const extent = extentAlong(w, nx, ny);
			let dist = r + side * (4 + extent);
			let c = centred(centre.x + nx * dist, centre.y + ny * dist, w);
			for (let i = 0; side < 0 && i < 3; i++) {
				const over = farthest(c.box, centre.x, centre.y) - (r - 4);
				if (over <= 0) break;
				dist -= over;
				c = centred(centre.x + nx * dist, centre.y + ny * dist, w);
			}
			if (dist <= extent) continue;
			out.push(c);
		}
	}
	return out;
}

export function intersects(a: Box, b: Box): boolean {
	return (
		a.x < b.x + b.w + GAP && b.x < a.x + a.w + GAP && a.y < b.y + b.h + GAP && b.y < a.y + a.h + GAP
	);
}

function contains(outer: Box, inner: Box): boolean {
	return (
		inner.x >= outer.x &&
		inner.y >= outer.y &&
		inner.x + inner.w <= outer.x + outer.w &&
		inner.y + inner.h <= outer.y + outer.h
	);
}

function nearest(b: Box, x: number, y: number): number {
	const dx = Math.max(b.x - x, 0, x - (b.x + b.w));
	const dy = Math.max(b.y - y, 0, y - (b.y + b.h));
	return Math.hypot(dx, dy);
}

function farthest(b: Box, x: number, y: number): number {
	const dx = Math.max(x - b.x, b.x + b.w - x);
	const dy = Math.max(y - b.y, b.y + b.h - y);
	return Math.hypot(dx, dy);
}

export function coversDisc(b: Box, c: Circle): boolean {
	return nearest(b, c.x, c.y) < c.r + GAP;
}

export function crossesCircle(b: Box, c: Circle): boolean {
	return nearest(b, c.x, c.y) <= c.r + GAP && farthest(b, c.x, c.y) >= c.r - GAP;
}

export function crossesSegment(b: Box, s: Segment): boolean {
	const dx = s.bx - s.ax;
	const dy = s.by - s.ay;
	let t0 = 0;
	let t1 = 1;
	const clip = (p: number, q: number) => {
		if (p === 0) return q >= 0;
		const t = q / p;
		if (p < 0) {
			if (t > t1) return false;
			if (t > t0) t0 = t;
		} else {
			if (t < t0) return false;
			if (t < t1) t1 = t;
		}
		return true;
	};
	return (
		clip(-dx, s.ax - b.x + GAP) &&
		clip(dx, b.x + b.w + GAP - s.ax) &&
		clip(-dy, s.ay - b.y + GAP) &&
		clip(dy, b.y + b.h + GAP - s.ay)
	);
}

/**
 * Give each request, in priority order, its first candidate that stays on the plate and clear
 * of every placed caption and solid, preferring one that also crosses no line or path segment.
 * A request with no such candidate is left out rather than drawn over something else.
 */
export function placeCaptions(requests: Request[], obstacles: Obstacles): Placed[] {
	const placed: Placed[] = [];
	for (const req of requests) {
		const open = req.candidates.filter(
			(c) =>
				contains(obstacles.frame, c.box) &&
				!obstacles.reserved.some((b) => intersects(b, c.box)) &&
				!placed.some((p) => intersects(p.box, c.box)) &&
				!obstacles.solids.some((s) => coversDisc(c.box, s))
		);
		const pick =
			open.find(
				(c) =>
					!obstacles.lines.some((l) => crossesCircle(c.box, l)) &&
					!obstacles.path.some((s) => crossesSegment(c.box, s))
			) ?? open[0];
		if (pick) placed.push({ ...pick, text: req.text, tone: req.tone });
	}
	return placed;
}
