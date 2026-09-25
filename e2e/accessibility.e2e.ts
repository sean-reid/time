import { expect, test } from '@playwright/test';

test('the plate zooms and pans from the keyboard', async ({ page }) => {
	await page.goto('/');
	const plate = page.getByRole('application');
	const body = page.locator('svg circle.central');
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

test('the ship marker moves every frame and stays on the trail tip', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/');
	for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Speed time up' }).click();
	const frames = await page.evaluate(
		() =>
			new Promise<{ moved: number; apart: number }>((resolve) => {
				const read = () => {
					const g = document.querySelector('circle.ship')!.parentElement!;
					const m = g.getAttribute('transform')!.match(/translate\(([-\d.e]+) ([-\d.e]+)\)/)!;
					const path = document.querySelector('path.course')!;
					const d = path.getAttribute('d')!;
					const [tx, ty] = d
						.slice(d.lastIndexOf('L') + 1)
						.split(' ')
						.map(Number);
					const s = path.getAttribute('transform')!.match(/translate\(([-\d.e]+) ([-\d.e]+)\)/)!;
					return { x: +m[1], y: +m[2], tx: tx + +s[1], ty: ty + +s[2] };
				};
				const rows: ReturnType<typeof read>[] = [];
				const tick = () => {
					rows.push(read());
					if (rows.length < 40) requestAnimationFrame(tick);
					else {
						let moved = 0;
						let apart = 0;
						for (let i = 1; i < rows.length; i++) {
							const a = rows[i - 1];
							const b = rows[i];
							if (Math.hypot(b.x - a.x, b.y - a.y) > 0) moved++;
							apart = Math.max(apart, Math.hypot(b.x - b.tx, b.y - b.ty));
						}
						resolve({ moved, apart });
					}
				};
				requestAnimationFrame(tick);
			})
	);
	expect(frames.moved).toBeGreaterThan(30);
	expect(frames.apart).toBeLessThan(1);
});
