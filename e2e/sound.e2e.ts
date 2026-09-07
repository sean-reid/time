import { expect, test } from '@playwright/test';

test('tick toggles on a tap and off again without errors', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto('/');
	const tick = page.getByRole('button', { name: /Tick/ });
	await expect(tick).toHaveAttribute('aria-pressed', 'false');
	await tick.click();
	await expect(tick).toHaveAttribute('aria-pressed', 'true');
	await page.getByRole('button', { name: 'Speed time up' }).click();
	await page.getByRole('button', { name: 'Speed time up' }).click();
	await page.waitForTimeout(700);
	await tick.click();
	await expect(tick).toHaveAttribute('aria-pressed', 'false');
	expect(errors).toEqual([]);
});
