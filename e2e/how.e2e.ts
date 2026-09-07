import { expect, test } from '@playwright/test';

test('explains the clocks with typeset formulas', async ({ page }) => {
	await page.goto('/how');
	await expect(page).toHaveTitle('How this works');
	expect(await page.locator('math').count()).toBeGreaterThanOrEqual(3);
	await expect(page.locator('main')).toContainText('38.6 µs');
	await expect(page.getByRole('link', { name: 'time', exact: true })).toHaveAttribute('href', '/');
});
