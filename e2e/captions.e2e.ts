import { expect, test, type Page } from '@playwright/test';

interface Box {
	text: string;
	x: number;
	y: number;
	w: number;
	h: number;
}

function captionBoxes(page: Page): Promise<Box[]> {
	return page.evaluate(() =>
		[...document.querySelectorAll('.plate svg text')].map((t) => {
			const r = t.getBoundingClientRect();
			return { text: t.textContent?.trim() ?? '', x: r.x, y: r.y, w: r.width, h: r.height };
		})
	);
}

function overlapping(boxes: Box[]): string[] {
	const out: string[] = [];
	for (let i = 0; i < boxes.length; i++) {
		for (let j = i + 1; j < boxes.length; j++) {
			const a = boxes[i];
			const b = boxes[j];
			if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h)
				out.push(`${a.text} / ${b.text}`);
		}
	}
	return out;
}

test('captions stay apart at the end of the Sagittarius A* tour', async ({ page }) => {
	await page.goto('/?tour=sgr-a-star');
	await page.getByRole('button', { name: 'Pause' }).click();
	const next = page.getByRole('button', { name: 'Next stop' });
	for (let i = 0; i < 4; i++) await next.click();
	await expect(page.locator('.tour .text')).toContainText(/crossed the horizon/, {
		timeout: 15_000
	});
	await page.waitForTimeout(300);
	const boxes = await captionBoxes(page);
	expect(boxes.map((b) => b.text)).toEqual(
		expect.arrayContaining(['You', 'Sagittarius A*', 'photon sphere'])
	);
	expect(overlapping(boxes)).toEqual([]);
});

test('captions stay apart around the Sun zoomed out', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('combobox', { name: 'Near' }).click();
	await page.getByRole('option', { name: /^Sun/ }).click();
	await expect(page.locator('.plate svg text', { hasText: /^Sun$/ })).toBeVisible();
	const out = page.getByRole('button', { name: 'Zoom out' });
	for (let i = 0; i < 12; i++) await out.click();
	await expect(page.locator('.plate svg text', { hasText: /^Mars$/ })).toBeVisible();
	const boxes = await captionBoxes(page);
	expect(boxes.map((b) => b.text)).toEqual(expect.arrayContaining(['Sun', 'You', 'Earth']));
	expect(overlapping(boxes)).toEqual([]);
});
