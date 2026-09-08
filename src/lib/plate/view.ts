import type { Box } from './captions';
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

/** Where the scale bar sits in plate pixels: top right on narrow layouts, bottom right otherwise. */
export function scaleBarBox(view: View, narrow: boolean): Box {
	const bar = 10 ** Math.floor(Math.log10(view.mpp * 160)) / view.mpp;
	const w = Math.max(bar, 130);
	const h = 44;
	return { x: view.w - 20 - w, y: narrow ? 44 : view.h - 16 - h, w, h };
}
