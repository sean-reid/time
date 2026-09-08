import { expect, test } from '@playwright/test';

test('kicking outward from the Moon until the Sun should take over gets a note', async ({
	page
}) => {
	await page.goto('/');
	await page.getByRole('combobox', { name: 'Near' }).click();
	await page.getByRole('option', { name: /^Moon/ }).click();
	await page.getByRole('button', { name: '50%' }).click();
	const outward = page.getByRole('button', { name: 'Outward', exact: true });
	for (let i = 0; i < 4; i++) await outward.click();
	await expect(page.locator('.manoeuvres li')).toHaveCount(4);
	const faster = page.getByRole('button', { name: 'Speed time up' });
	for (let i = 0; i < 8 && !(await faster.isDisabled()); i++) await faster.click();
	const note = page.locator('p.note');
	await expect(note).toContainText(
		/left Earth.s sphere of influence, about 1\u2009500\u2009000 km out/,
		{
			timeout: 15_000
		}
	);
	await expect(note).toContainText('the Sun');
	await expect(note).toContainText('illustrative only');
});
