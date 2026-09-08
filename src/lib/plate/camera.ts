import type { Camera } from '$lib/sim/defaults';
import type { Point } from './trail';
import type { View } from './view';

const MAX_FRAME = 1e22;

/** Scale the frame by `factor`, keeping the world point under pixel (atX, atY) where it is. */
export function zoomCamera(
	cam: Camera,
	view: View,
	minFrame: number,
	factor: number,
	atX: number,
	atY: number
): Camera {
	const worldX = view.cx + (atX - view.w / 2) * view.mpp;
	const worldY = view.cy - (atY - view.h / 2) * view.mpp;
	const frame = Math.min(MAX_FRAME, Math.max(minFrame, cam.frame * factor));
	const nextMpp = frame / Math.min(view.w, view.h);
	if (cam.follow) return { ...cam, frame };
	return {
		frame,
		cx: worldX - (atX - view.w / 2) * nextMpp,
		cy: worldY + (atY - view.h / 2) * nextMpp,
		follow: false
	};
}

/** Drag the view by a pixel delta; the camera stops following the ship. */
export function panCamera(cam: Camera, view: View, dx: number, dy: number): Camera {
	return {
		frame: cam.frame,
		cx: view.cx - dx * view.mpp,
		cy: view.cy + dy * view.mpp,
		follow: false
	};
}

export interface GestureTarget {
	zoom(factor: number, atX: number, atY: number): void;
	pan(dx: number, dy: number): void;
}

/** Wheel zoom, one-finger drag, and two-finger pinch on the plate. */
export class Gestures {
	private pointers = new Map<number, Point>();
	private lastPinch = 0;

	constructor(private target: GestureTarget) {}

	onWheel = (e: WheelEvent) => {
		e.preventDefault();
		this.target.zoom(Math.exp(e.deltaY * 0.0015), e.offsetX, e.offsetY);
	};

	onPointerDown = (e: PointerEvent) => {
		if ((e.target as HTMLElement).closest('button')) return;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		this.pointers.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
		if (this.pointers.size === 2) this.lastPinch = this.pinchDistance();
	};

	onPointerMove = (e: PointerEvent) => {
		const prev = this.pointers.get(e.pointerId);
		if (!prev) return;
		const cur = { x: e.offsetX, y: e.offsetY };
		this.pointers.set(e.pointerId, cur);
		if (this.pointers.size === 2) {
			const d = this.pinchDistance();
			if (this.lastPinch > 0) {
				const [a, b] = [...this.pointers.values()];
				this.target.zoom(this.lastPinch / d, (a.x + b.x) / 2, (a.y + b.y) / 2);
			}
			this.lastPinch = d;
			return;
		}
		if (e.buttons === 0) return;
		this.target.pan(cur.x - prev.x, cur.y - prev.y);
	};

	onPointerUp = (e: PointerEvent) => {
		this.pointers.delete(e.pointerId);
		if (this.pointers.size < 2) this.lastPinch = 0;
	};

	private pinchDistance(): number {
		const [a, b] = [...this.pointers.values()];
		return Math.hypot(a.x - b.x, a.y - b.y);
	}
}
