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

	const enc = (v: unknown) => btoa(JSON.stringify(v)).replaceAll('+', '-').replaceAll('/', '_');

	it('rejects unknown bodies, wrong types, and absurd numbers', () => {
		expect(decodeScene(enc(['planet-x', [1e7, 0, 'o', 1], [], 1, 0]))).toBeNull();
		expect(decodeScene(enc(['earth', [], [], 'x', null]))).toBeNull();
		expect(decodeScene(enc(['earth', [1e7, 0, 'o', 1], [[5, 'k']], 1, 0]))).toBeNull();
		expect(decodeScene(enc(['earth', [1e7, 0, 'o', 1], [[1e30, 'k', 1, 0]], 1, 0]))).toBeNull();
		expect(decodeScene(enc(['earth', [1e7, 0, 'o', 1], [], 1, 1e300]))).toBeNull();
		expect(decodeScene(enc(['earth', [1e7, 0, 'o', 1], [], 1e300, 0]))).toBeNull();
	});

	it('keeps an open-ended hold through the link and snaps odd warps to the table', () => {
		const s = encodeScene({
			body: 'earth',
			plan: {
				start: { r: 1e7, phi: 0, kind: 'orbit', direction: 1 },
				manoeuvres: [{ at: 5, kind: 'hold', duration: Infinity }]
			},
			warp: 1,
			t: 0
		});
		expect(decodeScene(s)?.plan.manoeuvres[0]).toEqual({ at: 5, kind: 'hold', duration: Infinity });
		expect(decodeScene(enc(['earth', [1e7, 0, 'o', 1], [], 700, 0]))?.warp).toBe(600);
	});
});
