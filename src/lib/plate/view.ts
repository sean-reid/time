import type { Point } from './trail';

/** Plate size in CSS pixels, metres per pixel, and the world point at its centre. */
export interface View {
	w: number;
	h: number;
	mpp: number;
	cx: number;
	cy: number;
}

export function polarXY(p: { r: number; phi: number }): Point {
	return { x: p.r * Math.cos(p.phi), y: p.r * Math.sin(p.phi) };
}

export function sx(v: View, x: number): number {
	return v.w / 2 + (x - v.cx) / v.mpp;
}

export function sy(v: View, y: number): number {
	return v.h / 2 - (y - v.cy) / v.mpp;
}

export function px(v: View, metres: number): number {
	return metres / v.mpp;
}

export function visibleRing(v: View, r: number): boolean {
	const p = px(v, r);
	return p > 6 && p < 40_000;
}
