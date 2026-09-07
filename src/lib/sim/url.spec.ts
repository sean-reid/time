import { describe, expect, it } from 'vitest';
import { decodeScene, encodeScene, type SceneSnapshot } from './url';

const scene: SceneSnapshot = {
	body: 'earth',
	plan: {
		start: { r: 2.656e7, phi: -0.785398, kind: 'orbit', direction: 1 },
		manoeuvres: [
			{ at: 120, kind: 'kick', dv: 1500, heading: 'retrograde' },
			{ at: 4000.5, kind: 'hold', duration: 3600 }
		]
	},
	warp: 60,
	t: 1234.5,
	camera: { frame: 6.4e7, cx: 0, cy: 0, follow: true }
};

describe('scene url', () => {
	it('round-trips a scene through a URL-safe string', () => {
		const s = encodeScene(scene);
		expect(s).toMatch(/^[A-Za-z0-9_-]+$/);
		expect(decodeScene(s)).toEqual(scene);
	});

	it('stays short enough to share', () => {
		expect(encodeScene(scene).length).toBeLessThan(200);
	});

	it('rejects garbage without throwing', () => {
		expect(decodeScene('not base64!!')).toBeNull();
		expect(decodeScene(btoa('{"a":1}'))).toBeNull();
	});
});
