import { expect, test, type CDPSession, type Page } from '@playwright/test';

type Point = { x: number; y: number };

async function touch(
	cdp: CDPSession,
	type: 'touchStart' | 'touchMove' | 'touchEnd',
	points: Point[]
) {
	await cdp.send('Input.dispatchTouchEvent', {
		type,
		touchPoints: points.map((p, id) => ({ ...p, id, radiusX: 2, radiusY: 2, force: 1 }))
	});
}

async function plateCentre(page: Page): Promise<Point> {
	const box = await page.getByRole('application').boundingBox();
	if (!box) throw new Error('plate not laid out');
	return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

test.describe('the plate under touch', () => {
	test.skip(({ hasTouch }) => !hasTouch, 'touch only');

	test('a one-finger drag pans the map', async ({ page }) => {
		await page.goto('/');
		const body = page.locator('svg circle.central');
		await expect(body).toBeVisible();
		const before = Number(await body.getAttribute('cx'));
		const cdp = await page.context().newCDPSession(page);
		const c = await plateCentre(page);
		await touch(cdp, 'touchStart', [c]);
		for (let i = 1; i <= 5; i++) await touch(cdp, 'touchMove', [{ x: c.x + i * 20, y: c.y }]);
		await touch(cdp, 'touchEnd', []);
		await expect
			.poll(async () => Number(await body.getAttribute('cx')))
			.toBeGreaterThan(before + 90);
		await expect(page.getByRole('button', { name: 'Follow' })).toHaveAttribute(
			'aria-pressed',
			'false'
		);
	});

	test('a two-finger pinch zooms the map', async ({ page }) => {
		await page.goto('/');
		const body = page.locator('svg circle.central');
		const scale = page.locator('.scale .tag').first();
		await expect(body).toBeVisible();
		const before = Number(await body.getAttribute('r'));
		const bar = await scale.innerText();
		const cdp = await page.context().newCDPSession(page);
		const c = await plateCentre(page);
		await touch(cdp, 'touchStart', [
			{ x: c.x - 20, y: c.y },
			{ x: c.x + 20, y: c.y }
		]);
		for (let i = 1; i <= 6; i++) {
			await touch(cdp, 'touchMove', [
				{ x: c.x - 20 - i * 15, y: c.y },
				{ x: c.x + 20 + i * 15, y: c.y }
			]);
		}
		await touch(cdp, 'touchEnd', []);
		await expect.poll(async () => Number(await body.getAttribute('r'))).toBeGreaterThan(before * 2);
		await expect(scale).not.toHaveText(bar);
	});
});
