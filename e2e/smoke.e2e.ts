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
