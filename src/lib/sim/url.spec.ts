import { describe, expect, it } from 'vitest';
import { decodeScene, encodeScene, type SceneSnapshot } from './url';

const scene: SceneSnapshot = {
	body: 'earth',
	course: {
		cruiseSpeed: 3e6,
		waypoints: [
			{ r: 2.656e7, phi: -0.785398, dwell: { kind: 'orbit', revolutions: 2, direction: 1 } },
			{ r: 7e6, phi: 1.2 },
			{ r: 6.8e6, phi: 1.5, dwell: { kind: 'hover', duration: 3600 } }
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
		expect(encodeScene(scene).length).toBeLessThan(220);
	});

	it('rejects garbage without throwing', () => {
		expect(decodeScene('not base64!!')).toBeNull();
		expect(decodeScene(btoa('{"a":1}'))).toBeNull();
	});
});
