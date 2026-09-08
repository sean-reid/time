import { expect, test, type Locator, type Page } from '@playwright/test';

async function openWith(page: Page, button: Locator, key: 'Enter' | ' ') {
	await button.focus();
	await page.keyboard.press(key);
	const list = page.getByRole('listbox', { name: await button.getAttribute('aria-label') });
	await expect(list).toBeVisible();
	await expect(button).toHaveAttribute('aria-expanded', 'true');
	return list;
}

async function activeOption(button: Locator, list: Locator) {
	const id = await button.getAttribute('aria-activedescendant');
	expect(id).toMatch(/^picker-\w+-\d+$/);
	const option = list.locator(`[id="${id}"]`);
	await expect(option).toHaveAttribute('role', 'option');
	await expect(option).toHaveClass(/active/);
	return { id: id!, option };
}

test('the scene picker opens, moves, selects, and closes from the keyboard', async ({ page }) => {
	await page.goto('/');
	const button = page.getByRole('combobox', { name: 'Near' });
	await expect(button).toContainText('Earth');
	await expect(button).not.toHaveAttribute('aria-activedescendant');

	const list = await openWith(page, button, 'Enter');
	const start = await activeOption(button, list);
	await expect(start.option).toHaveAttribute('aria-selected', 'true');
	await expect(start.option).toContainText('Earth');

	await page.keyboard.press('ArrowDown');
	const next = await activeOption(button, list);
	expect(next.id).toBe(start.id.replace(/\d+$/, (n) => String(Number(n) + 1)));
	await expect(start.option).not.toHaveClass(/active/);
	const chosen = await next.option.locator('.name').innerText();

	await page.keyboard.press('Enter');
	await expect(list).toBeHidden();
	await expect(button).toHaveAttribute('aria-expanded', 'false');
	await expect(button).toContainText(chosen);
	await expect(button).toBeFocused();
	await expect(
		page.getByRole('img', { name: `${chosen} with your course and your ship` })
	).toBeVisible();

	await openWith(page, button, ' ');
	await page.keyboard.press('ArrowUp');
	await page.keyboard.press('Escape');
	await expect(list).toBeHidden();
	await expect(button).toContainText(chosen);
	await expect(button).not.toHaveAttribute('aria-activedescendant');
	await expect(button).toBeFocused();
});

test('the start orbit picker restarts the flight on the chosen orbit', async ({ page }) => {
	await page.goto('/');
	const button = page.getByRole('combobox', { name: 'Start on' });
	await expect(button).toContainText('GPS');
	await page.getByRole('button', { name: 'Prograde', exact: true }).click();
	await expect(page.locator('.manoeuvres li')).toHaveCount(1);
	await page.mouse.move(0, 0);

	const list = await openWith(page, button, ' ');
	const start = await activeOption(button, list);
	await expect(start.option).toContainText('GPS');
	await page.keyboard.press('Home');
	const first = await activeOption(button, list);
	expect(first.id).toMatch(/-0$/);
	const chosen = await first.option.locator('.name').innerText();
	expect(chosen).not.toBe('GPS');

	await page.keyboard.press('Enter');
	await expect(list).toBeHidden();
	await expect(button).toContainText(chosen);
	await expect(button).toBeFocused();
	await expect(page.locator('.manoeuvres')).toHaveCount(0);
	await expect(page.locator('dd').filter({ hasText: /per revolution/ })).toBeVisible();

	await openWith(page, button, 'Enter');
	await page.keyboard.press('End');
	await page.keyboard.press('Escape');
	await expect(list).toBeHidden();
	await expect(button).toContainText(chosen);
	await expect(button).toBeFocused();
});
