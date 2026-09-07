import { expect, test } from '@playwright/test';

test('the plate zooms and pans from the keyboard', async ({ page }) => {
	await page.goto('/');
	const plate = page.getByRole('application');
	const body = page.locator('svg circle.body');
	const before = Number(await body.getAttribute('r'));
	await plate.focus();
	await page.keyboard.press('+');
	await page.keyboard.press('+');
	await expect.poll(async () => Number(await body.getAttribute('r'))).toBeGreaterThan(before * 2);
	await page.keyboard.press('ArrowRight');
	await expect(page.getByRole('button', { name: 'Follow' })).toHaveAttribute(
		'aria-pressed',
		'false'
	);
});

test('a screen reader gets a summary that is not chatty', async ({ page }) => {
	await page.goto('/');
	const live = page.locator('p.visually-hidden[aria-live="polite"]');
	await expect(live).toContainText('Near Earth');
	await expect(live).toContainText('Your clock');
	const first = await live.innerText();
	await page.waitForTimeout(1500);
	expect(await live.innerText()).toBe(first);
});

test('reduced motion keeps the clocks running', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/');
	const digits = page.locator('.digits').first();
	const before = await digits.innerText();
	await expect.poll(() => digits.innerText(), { timeout: 3000 }).not.toBe(before);
	await expect(page.getByText('You', { exact: true }).first()).toBeVisible();
});
