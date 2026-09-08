import { describe, expect, it } from 'vitest';
import { panCamera, zoomCamera } from './camera';
import { sx, sy, type View } from './view';

const view: View = { w: 1000, h: 800, mpp: 100, cx: 5000, cy: -2000 };
const cam = { frame: 80_000, cx: 5000, cy: -2000, follow: false };

describe('camera', () => {
	it('zooms about the pointer so the world point under it stays put', () => {
		const next = zoomCamera(cam, view, 1, 1.6, 200, 650);
		const nextView = { ...view, mpp: next.frame / 800, cx: next.cx, cy: next.cy };
		const worldX = view.cx + (200 - 500) * view.mpp;
		const worldY = view.cy - (650 - 400) * view.mpp;
		expect(next.frame).toBeCloseTo(128_000);
		expect(sx(nextView, worldX)).toBeCloseTo(200);
		expect(sy(nextView, worldY)).toBeCloseTo(650);
		expect(next.follow).toBe(false);
	});

	it('clamps the frame and keeps following when the camera follows the ship', () => {
		const following = { ...cam, follow: true };
		expect(zoomCamera(following, view, 1000, 1e-9, 0, 0)).toEqual({ ...following, frame: 1000 });
		expect(zoomCamera(cam, view, 1, 1e30, 500, 400).frame).toBe(1e22);
	});

	it('pans by pixels from the shown centre and stops following', () => {
		const next = panCamera({ ...cam, follow: true, cx: 0, cy: 0 }, view, 40, -10);
		expect(next).toEqual({ frame: cam.frame, cx: 5000 - 4000, cy: -2000 - 1000, follow: false });
	});
});
