import { expect, test } from '@playwright/test';
import { collectErrors, playLesson } from './learnHelpers';

test('chords: intro and the major yes/no lesson open lesson 2', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await page.goto('/learn');
  await page.locator('[data-path="chords"]').click();
  await page.getByRole('dialog').getByRole('link', { name: /Học/ }).click();
  await expect(page.getByTestId('path-count')).toHaveText('0 / 26');
  await page.goto('/learn/chords/ch-intro');
  await playLesson(page);
  await page.goto('/learn/chords/ch-1');
  await playLesson(page);
  await expect(page.getByTestId('lesson-results').locator('[data-stars]')).toHaveAttribute('data-stars', '3');
  await page.getByRole('link', { name: 'Về lộ trình' }).click();
  await expect(page.getByTestId('path-count')).toHaveText('2 / 26');
  await expect(page.locator('[data-lesson="ch-2"] [data-status]')).toHaveAttribute('data-status', 'current');
  expect(errors).toEqual([]);
});

test('chords: checkpoint 1 skips ahead, then the diminished lesson is answered with buttons', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = collectErrors(page);
  await page.goto('/learn/chords/ch-cp1');
  await playLesson(page);
  await expect(page.getByTestId('lesson-results')).toContainText('Đã bỏ qua 4 bài phía trước');
  await page.getByRole('link', { name: 'Bài tiếp →' }).click();
  await expect(page.getByRole('heading', { name: 'Hợp âm giảm' })).toBeVisible();
  await playLesson(page);
  await expect(page.getByTestId('lesson-results').locator('[data-stars]')).toHaveAttribute('data-stars', '3');
  await page.getByRole('link', { name: 'Về lộ trình' }).click();
  await expect(page.getByTestId('path-count')).toHaveText('6 / 26');
  expect(errors).toEqual([]);
});
