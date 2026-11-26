import { expect, test } from '@playwright/test';
import { collectErrors, playLesson } from './learnHelpers';

test('intervals: intro and the octave yes/no lesson open lesson 2', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await page.goto('/learn');
  await page.locator('[data-path="intervals"]').click();
  await page.getByRole('dialog').getByRole('link', { name: /Học/ }).click();
  await expect(page.getByTestId('path-count')).toHaveText('0 / 42');
  await page.goto('/learn/intervals/iv-intro');
  await playLesson(page);
  await page.goto('/learn/intervals/iv-1');
  await playLesson(page);
  await expect(page.getByTestId('lesson-results').locator('[data-stars]')).toHaveAttribute('data-stars', '3');
  await page.getByRole('link', { name: 'Về lộ trình' }).click();
  await expect(page.getByTestId('path-count')).toHaveText('2 / 42');
  await expect(page.locator('[data-lesson="iv-2"] [data-status]')).toHaveAttribute('data-status', 'current');
  expect(errors).toEqual([]);
});

test('intervals: checkpoint 1 skips ahead, then the major-third lesson is answered with buttons', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = collectErrors(page);
  await page.goto('/learn/intervals/iv-cp1');
  await playLesson(page);
  await expect(page.getByTestId('lesson-results')).toContainText('Đã bỏ qua 7 bài phía trước');
  await page.getByRole('link', { name: 'Bài tiếp →' }).click();
  await expect(page.getByRole('heading', { name: 'Quãng 3 trưởng (M3)' })).toBeVisible();
  await playLesson(page);
  await expect(page.getByTestId('lesson-results').locator('[data-stars]')).toHaveAttribute('data-stars', '3');
  await page.getByRole('link', { name: 'Về lộ trình' }).click();
  await expect(page.getByTestId('path-count')).toHaveText('9 / 42');
  await expect(page.locator('[data-lesson="iv-8"] [data-status]')).toHaveAttribute('data-status', 'current');
  expect(errors).toEqual([]);
});
