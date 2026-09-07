import { expect, test } from '@playwright/test';

const DAY = 86_400;

function seconds(digits: string): number {
	const m = digits.match(/^(\d\d):(\d\d):(\d\d)\.(\d)$/);
	if (!m) throw new Error(`unexpected clock text: ${digits}`);
	const [, hh, mm, ss, tenth] = m.map(Number);
	return hh * 3600 + mm * 60 + ss + tenth / 10;
}

test('the Earth clock keeps wall time', async ({ page }) => {
	await page.goto('/');
	const earth = page.locator('.digits').nth(1);
	await expect(earth).toHaveText(/^\d\d:\d\d:\d\d\.\d$/);
	const before = seconds(await earth.innerText());
	await page.waitForTimeout(2000);
	const after = seconds(await earth.innerText());
	const elapsed = (after - before + DAY) % DAY;
	expect(elapsed).toBeGreaterThanOrEqual(1.7);
	expect(elapsed).toBeLessThanOrEqual(2.3);
});

test('frame pacing is measured', async ({ page }, testInfo) => {
	await page.goto('/');
	await expect(page.locator('.digits')).toHaveCount(2);
	const p95 = await page.evaluate(
		(ms) =>
			new Promise<number>((resolve) => {
				const stamps: number[] = [];
				const start = performance.now();
				const tick = (now: number) => {
					stamps.push(now);
					if (now - start < ms) requestAnimationFrame(tick);
					else {
						const gaps = stamps.slice(1).map((t, i) => t - stamps[i]);
						gaps.sort((a, b) => a - b);
						resolve(gaps[Math.min(gaps.length - 1, Math.floor(gaps.length * 0.95))]);
					}
				};
				requestAnimationFrame(tick);
			}),
		1500
	);
	console.log(`${testInfo.project.name} p95 frame gap: ${p95.toFixed(1)} ms`);
	await testInfo.attach('p95-frame-gap-ms', { body: p95.toFixed(1), contentType: 'text/plain' });
});
