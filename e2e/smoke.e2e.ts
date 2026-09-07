import { expect, test } from '@playwright/test';

test('both clocks tick from the same wall time', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('You', { exact: true }).first()).toBeVisible();
	await expect(page.getByText('Earth, sea level')).toBeVisible();
	const digits = page.locator('.digits');
	await expect(digits).toHaveCount(2);
	const before = await digits.first().innerText();
	expect(before).toMatch(/^\d\d:\d\d:\d\d\.\d$/);
	await expect.poll(async () => digits.first().innerText(), { timeout: 3000 }).not.toBe(before);
	await expect(page.getByText('Drift since you left')).toBeVisible();
});

test('the flown path grows behind the ship', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Speed time up' }).click();
	await page.getByRole('button', { name: 'Speed time up' }).click();
	await page.getByRole('button', { name: 'Speed time up' }).click();
	const trail = page.locator('svg path.course');
	await expect
		.poll(async () => ((await trail.getAttribute('d')) ?? '').split('L').length, { timeout: 5000 })
		.toBeGreaterThan(20);
});
