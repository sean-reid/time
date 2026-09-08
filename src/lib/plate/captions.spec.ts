import { describe, expect, it } from 'vitest';
import {
	aroundPoint,
	aroundRing,
	coversDisc,
	crossesCircle,
	crossesSegment,
	intersects,
	placeCaptions,
	textWidth,
	type Obstacles
} from './captions';

const frame = { x: 0, y: 0, w: 1000, h: 800 };
const empty: Obstacles = { frame, solids: [], lines: [], path: [] };
const origin = { x: 500, y: 400 };

describe('caption geometry', () => {
	it('puts the first candidate just outside the point in the preferred direction', () => {
		const [east] = aroundPoint(origin, 10, 'Earth', ['E']);
		expect(east.box.x).toBeCloseTo(510);
		expect(east.y).toBe(404);
		const [ring] = aroundRing(origin, 100, 'ISCO');
		expect(ring.box.y + ring.box.h).toBeCloseTo(296);
		expect(ring.x).toBe(500);
	});

	it('offers inside positions only when the box fits between the ring and the centre', () => {
		const inside = aroundRing(origin, 100, 'ISCO').slice(8);
		expect(inside.length).toBe(8);
		for (const c of inside) expect(crossesCircle(c.box, { ...origin, r: 100 })).toBe(false);
		expect(aroundRing(origin, 12, 'ISCO').length).toBe(8);
	});

	it('detects boxes, circles and segments touching a box', () => {
		const box = { x: 100, y: 100, w: 50, h: 14 };
		expect(intersects(box, { x: 151, y: 100, w: 10, h: 14 })).toBe(true);
		expect(intersects(box, { x: 160, y: 100, w: 10, h: 14 })).toBe(false);
		expect(crossesCircle(box, { x: 100, y: 100, r: 20 })).toBe(true);
		expect(crossesCircle(box, { x: 100, y: 100, r: 500 })).toBe(false);
		expect(crossesCircle(box, { x: 300, y: 300, r: 10 })).toBe(false);
		expect(crossesSegment(box, { ax: 0, ay: 0, bx: 200, by: 200 })).toBe(true);
		expect(crossesSegment(box, { ax: 0, ay: 130, bx: 200, by: 130 })).toBe(false);
		expect(crossesSegment(box, { ax: 120, ay: 0, bx: 120, by: 90 })).toBe(false);
	});
});

describe('placeCaptions', () => {
	it('keeps a lower priority caption off a higher one and hides it when nowhere is free', () => {
		const you = {
			text: 'You',
			tone: 'accent' as const,
			candidates: aroundPoint(origin, 8, 'You', ['SE'])
		};
		const below = { x: origin.x, y: origin.y + 34 };
		const sun = {
			text: 'Sun',
			tone: 'ink' as const,
			candidates: aroundPoint(below, 2, 'Sun', ['N', 'E', 'W', 'S'])
		};
		const placed = placeCaptions([you, sun], empty);
		expect(placed.map((p) => p.text)).toEqual(['You', 'Sun']);
		expect(intersects(placed[0].box, placed[1].box)).toBe(false);
		expect(placed[1].x).toBeGreaterThan(sun.candidates[0].x);
		const boxed = placeCaptions([you, { ...sun, candidates: sun.candidates.slice(0, 1) }], empty);
		expect(boxed.map((p) => p.text)).toEqual(['You']);
	});

	it('tucks a ring caption inside its ring when the outside would cross the next ring', () => {
		const lines = [
			{ ...origin, r: 100 },
			{ ...origin, r: 110 }
		];
		const rings = lines.map((c) => ({
			text: `ring ${c.r}`,
			tone: 'ink' as const,
			candidates: aroundRing(origin, c.r, `ring ${c.r}`)
		}));
		const placed = placeCaptions(rings, { ...empty, lines });
		expect(placed.length).toBe(2);
		for (const p of placed) for (const l of lines) expect(crossesCircle(p.box, l)).toBe(false);
		expect(placed[0].box.y).toBeGreaterThan(origin.y - 100);
		expect(placed[1].box.y + placed[1].box.h).toBeLessThan(origin.y - 110);
	});

	it('crosses a line before it covers the body or another caption', () => {
		const lines = [
			{ ...origin, r: 100 },
			{ ...origin, r: 110 }
		];
		const body = { ...origin, r: 95 };
		const rings = lines.map((c) => ({
			text: `ring ${c.r}`,
			tone: 'ink' as const,
			candidates: aroundRing(origin, c.r, `ring ${c.r}`)
		}));
		const placed = placeCaptions(rings, { ...empty, lines, solids: [body] });
		expect(placed.length).toBe(2);
		for (const p of placed) expect(coversDisc(p.box, body)).toBe(false);
		expect(intersects(placed[0].box, placed[1].box)).toBe(false);
	});

	it('drops candidates that leave the plate and keeps the box width honest', () => {
		const edge = { x: 990, y: 400 };
		const req = {
			text: 'Jupiter',
			tone: 'ink' as const,
			candidates: aroundPoint(edge, 4, 'Jupiter', ['E', 'W'])
		};
		const [p] = placeCaptions([req], empty);
		expect(p.box.x + p.box.w).toBeLessThan(990);
		expect(p.box.w).toBe(textWidth('Jupiter'));
	});
});
