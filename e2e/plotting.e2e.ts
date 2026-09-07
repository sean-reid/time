import { expect, test } from '@playwright/test';

test('plot a course by tapping, then edit the waypoint', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Plot a course' }).click();
	const plate = page.getByRole('application');
	const box = (await plate.boundingBox())!;
	await page.mouse.click(box.x + box.width * 0.75, box.y + box.height * 0.3);
	const rows = page.locator('.wp');
	await expect(rows).toHaveCount(2);
	await expect(rows.nth(1)).toContainText('pass through');
	await page.getByLabel('At this point').selectOption('hover');
	await expect(rows.nth(1)).toContainText('hold 1 h');
	await page.getByRole('button', { name: 'Remove waypoint' }).click();
	await expect(rows).toHaveCount(1);
});

test('keyboard plotting needs no pointer', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Add a waypoint' }).click();
	await expect(page.locator('.wp')).toHaveCount(2);
	const distance = page.getByLabel(/Distance from centre/);
	await distance.fill('50000');
	await distance.press('Tab');
	await expect(page.locator('.wp').nth(1)).toContainText('43 629 km up');
});

test('a shared dive ends at the horizon', async ({ page }) => {
	const packed = [
		'sgr-a-star',
		29979245.8,
		86400,
		20000,
		[
			[6.35e10, -0.8],
			[5e9, -0.8]
		]
	];
	const s = Buffer.from(JSON.stringify(packed)).toString('base64url');
	await page.goto(`/?s=${s}`);
	await expect(page.locator('.note')).toContainText('crossed the horizon');
	await expect(page.getByText('past the horizon')).toBeVisible();
});
