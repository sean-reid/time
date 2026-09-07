import { expect, test, type APIRequestContext } from '@playwright/test';
import { encodeScene } from '../src/lib/sim/url';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

async function expectCard(request: APIRequestContext, path: string, cacheControl: string) {
	const response = await request.get(path);
	expect(response.status()).toBe(200);
	expect(response.headers()['content-type']).toBe('image/png');
	expect(response.headers()['cache-control']).toBe(cacheControl);
	const body = await response.body();
	expect(body.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
	expect(body.length).toBeGreaterThan(10_000);
	return body;
}

test('renders the default card as a PNG', async ({ request }) => {
	await expectCard(request, '/og', 'public, max-age=86400');
});

test('renders a shared scene as an immutable PNG', async ({ request }) => {
	const s = encodeScene({
		body: 'sgr-a-star',
		course: {
			cruiseSpeed: 3e7,
			waypoints: [
				{ r: 1e11, phi: -0.785398, dwell: { kind: 'orbit', revolutions: 1, direction: 1 } }
			]
		},
		warp: 60,
		t: 0
	});
	const shared = await expectCard(request, `/og?s=${s}`, 'public, max-age=31536000, immutable');
	const fallback = await expectCard(
		request,
		'/og?s=not-a-scene',
		'public, max-age=31536000, immutable'
	);
	expect(shared.equals(fallback)).toBe(false);
});

test('points crawlers at the card for the current scene', async ({ page, baseURL }) => {
	await page.goto('/');
	await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
		'content',
		`${baseURL}/og`
	);
	await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
		'content',
		'summary_large_image'
	);
	await page.goto('/?s=WyJlYXJ0aCIsMzg3MCwxLDAsW1syLjY1NzFlNywtMC43ODUzOTgsIm8iLDEsMV1dXQ');
	await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
		'content',
		`${baseURL}/og?s=WyJlYXJ0aCIsMzg3MCwxLDAsW1syLjY1NzFlNywtMC43ODUzOTgsIm8iLDEsMV1dXQ`
	);
});
