import { expect, test } from '@playwright/test';

test('explains the clocks with typeset formulas', async ({ page }) => {
	await page.goto('/how');
	await expect(page).toHaveTitle('How this works');
	expect(await page.locator('math').count()).toBeGreaterThanOrEqual(3);
	await expect(page.locator('main')).toContainText('38.6 µs');
	await expect(page.getByRole('link', { name: 'time', exact: true })).toHaveAttribute('href', '/');
});

test('lists the sources the catalogue cites', async ({ page }) => {
	await page.goto('/how');
	const catalogue = page.locator('main ul').last().locator('a');
	expect(await catalogue.count()).toBeGreaterThan(20);
	await expect(catalogue.first()).toHaveAttribute('href', 'https://arxiv.org/abs/1605.09788');
	await expect(page.locator('main')).toContainText('NASA NSSDCA Earth fact sheet');
});
