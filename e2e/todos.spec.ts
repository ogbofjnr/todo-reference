import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

const newTask = (page: Page) => page.getByRole('textbox', { name: 'New task' });
const tasks = (page: Page) => page.getByRole('list', { name: 'Tasks' }).getByRole('listitem');

test('manage tasks end to end: add, complete, filter, edit, delete, reload', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Nothing to do yet')).toBeVisible();

  for (const title of ['Buy milk', 'Write report', 'Call mom']) {
    await newTask(page).fill(title);
    await newTask(page).press('Enter');
  }
  await expect(tasks(page)).toHaveCount(3);
  await expect(page.getByText('3 items left')).toBeVisible();

  await page.getByRole('checkbox', { name: 'Buy milk' }).check();
  await expect(page.getByText('2 items left')).toBeVisible();

  // Filter state lives in the URL and survives a reload.
  await page.getByRole('link', { name: 'Completed' }).click();
  await expect(page).toHaveURL(/\?filter=completed$/);
  await expect(tasks(page)).toHaveText([/Buy milk/]);
  await page.reload();
  await expect(tasks(page)).toHaveText([/Buy milk/]);
  await page.goBack();
  await expect(tasks(page)).toHaveCount(3);

  // Inline edit, keyboard only.
  await page.getByRole('button', { name: 'Edit “Write report”' }).click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('Write final report');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('checkbox', { name: 'Write final report' })).toBeVisible();

  await page.getByRole('button', { name: 'Delete “Call mom”' }).click();
  await expect(newTask(page)).toBeFocused();

  await page.getByRole('button', { name: 'Clear completed' }).click();
  await expect(tasks(page)).toHaveText([/Write final report/]);

  // Data comes back from storage after a full reload.
  await page.reload();
  await expect(tasks(page)).toHaveText([/Write final report/]);
  await expect(page.getByText('1 item left')).toBeVisible();
});

test('has no detectable accessibility violations', async ({ page }) => {
  await page.goto('/');
  await newTask(page).fill('Check contrast');
  await newTask(page).press('Enter');
  await page.getByRole('checkbox', { name: 'Check contrast' }).check();
  await newTask(page).press('Enter'); // shows the validation error state too

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
