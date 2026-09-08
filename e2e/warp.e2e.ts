import { expect, test } from '@playwright/test';

test('the readout admits when the integrator cannot keep up after an inward kick', async ({
	page
}) => {
	await page.goto('/');
	const faster = page.getByRole('button', { name: 'Speed time up' });
	const rate = page.locator('.stepper .rate');
	for (let i = 0; i < 8 && !(await faster.isDisabled()); i++) await faster.click();
	const setting = (await rate.innerText()).split(',')[0];
	await page.getByRole('button', { name: '50%' }).click();
	await page.getByRole('button', { name: 'Inward', exact: true }).click();
	await expect
		.poll(
			async () => {
				const text = await rate.innerText();
				return text.startsWith(`${setting}, running at`) || !text.startsWith(setting);
			},
			{ timeout: 10_000 }
		)
		.toBe(true);
});
