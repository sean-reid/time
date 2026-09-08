import { expect, test } from '@playwright/test';

test('the tours page lists four flights that open in the sim', async ({ page }) => {
	await page.goto('/tours');
	const links = page.locator('main li a');
	await expect(links).toHaveCount(4);
	await links.first().click();
	await expect(page).toHaveURL(/tour=gps/);
	await expect(page.getByText('Why GPS corrects its clocks, stop 1 of 4')).toBeVisible();
	await expect(page.locator('.tour .text')).toContainText(/GPS constellation's orbit/);
});

test('next stop advances the flight and leaving returns to a plain scene', async ({ page }) => {
	await page.goto('/?tour=sgr-a-star');
	await page.getByRole('button', { name: 'Pause' }).click();
	await page.getByRole('button', { name: 'Next stop' }).click();
	await expect(page.getByText(/stop 2 of 5/)).toBeVisible();
	await page.getByRole('button', { name: 'Next stop' }).click();
	await page.getByRole('button', { name: 'Next stop' }).click();
	await page.getByRole('button', { name: 'Next stop' }).click();
	await expect(page.locator('.tour .text')).toContainText(/crossed the horizon/, {
		timeout: 15_000
	});
	await page.getByRole('button', { name: 'Leave the tour' }).click();
	await expect(page).toHaveURL(/\?s=/);
});
