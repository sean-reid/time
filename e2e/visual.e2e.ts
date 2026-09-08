// Snapshots are Linux renders from the CI Chromium; refresh them with `pnpm test:visual:update`.
import { expect, test, type Page } from '@playwright/test';
import { bodies, type Body } from '../src/lib/catalogue';
import { defaultCamera, defaultPlan, fieldFor } from '../src/lib/sim/defaults';
import { encodeScene } from '../src/lib/sim/url';
import { tours } from '../src/lib/tours';

const DEPARTURE = new Date('2026-03-01T12:00:00Z');
const SHOT = { fullPage: true, maxDiffPixelRatio: 0.02 } as const;

const all: readonly Body[] = bodies;
const scenes = all.filter(
	(b) => b.companions !== undefined || !all.some((p) => p.companions?.some((c) => c.body === b.id))
);

/** Freeze the wall clock before the page loads so no frame runs and every run draws the same state. */
async function settle(page: Page, path: string) {
	await page.clock.install({ time: DEPARTURE });
	await page.clock.pauseAt(DEPARTURE.getTime() + 1);
	await page.goto(path);
	await page.evaluate(() => document.fonts.ready);
	await expect(page.getByText('You', { exact: true }).first()).toBeVisible();
}

for (const body of scenes) {
	test(`scene ${body.id}`, async ({ page }) => {
		const plan = defaultPlan(body, fieldFor(body));
		const s = encodeScene({ body: body.id, plan, warp: 1, t: 0, camera: defaultCamera(plan) });
		await settle(page, `/?s=${s}`);
		await expect(page.getByRole('combobox', { name: 'Near' })).toContainText(body.name);
		await expect(page).toHaveScreenshot(`scene-${body.id}.png`, SHOT);
	});
}

for (const tour of tours) {
	for (const [i] of tour.stops.entries()) {
		test(`tour ${tour.id} stop ${i + 1}`, async ({ page }) => {
			await settle(page, `/?tour=${tour.id}`);
			for (let n = 0; n < i; n++) {
				await page.getByRole('button', { name: 'Next stop' }).click();
				await expect(page.getByText(`stop ${n + 2} of ${tour.stops.length}`)).toBeVisible({
					timeout: 20_000
				});
			}
			await expect(page).toHaveScreenshot(`tour-${tour.id}-stop-${i + 1}.png`, SHOT);
		});
	}
}
