import { expect, test } from '@playwright/test';

test('the cap keeps the integrator honest on Earth after an inward kick', async ({ page }) => {
	await page.goto('/');
	const faster = page.getByRole('button', { name: 'Speed time up' });
	const rate = page.locator('.stepper .rate');
	for (let i = 0; i < 8 && !(await faster.isDisabled()); i++) await faster.click();
	await page.getByRole('button', { name: '50%' }).click();
	await page.getByRole('button', { name: 'Inward', exact: true }).click();
	await page.waitForTimeout(3000);
	await expect(rate).not.toContainText('running at');
});

test('the cap stops far down the ladder on a millisecond orbit', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('combobox', { name: 'Near' }).click();
	await page.getByRole('option', { name: /Cygnus X-1/ }).click();
	const faster = page.getByRole('button', { name: 'Speed time up' });
	const rate = page.locator('.stepper .rate');
	for (let i = 0; i < 8 && !(await faster.isDisabled()); i++) await faster.click();
	await expect(faster).toBeDisabled();
	await expect(rate).toHaveText(/^(1|10|60)/);
});
