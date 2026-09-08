import { expect, test } from '@playwright/test';

test('a kick bends the running flight without replaying it', async ({ page }) => {
	await page.goto('/');
	const faster = page.getByRole('button', { name: 'Speed time up' });
	for (let i = 0; i < 4; i++) await faster.click();
	const clock = page.locator('.timeline input');
	await expect.poll(async () => Number(await clock.inputValue())).toBeGreaterThan(300);
	const course = page.locator('path.course');
	const origin = (await course.getAttribute('d'))?.match(/^M\s*(-?\d+)\S*\s+(-?\d+)/);
	expect(origin).not.toBeNull();
	const before = Number(await clock.inputValue());
	await page.getByRole('button', { name: 'Prograde', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Undo all' })).toBeEnabled();
	expect(Number(await clock.inputValue())).toBeGreaterThanOrEqual(before);
	const after = (await course.getAttribute('d'))?.match(/^M\s*(-?\d+)\S*\s+(-?\d+)/);
	expect(after?.slice(1)).toEqual(origin?.slice(1));
});
