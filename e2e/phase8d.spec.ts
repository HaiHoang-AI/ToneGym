import { expect, test } from '@playwright/test';
import { collectErrors, playLesson } from './learnHelpers';

test('hub: all five paths are open', async ({ page }) => {
  await page.goto('/learn');
  await expect(page.locator('[data-path]:enabled')).toHaveCount(5);
  await expect(page.getByText('Sắp có')).toHaveCount(0);
});

test('scales: intro and the major yes/no lesson open lesson 2', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await page.goto('/learn/scales/sc-intro');
  await playLesson(page);
  await page.goto('/learn/scales/sc-1');
  await playLesson(page);
  await expect(page.getByTestId('lesson-results').locator('[data-stars]')).toHaveAttribute('data-stars', '3');
  await page.getByRole('link', { name: 'Về lộ trình' }).click();
  await expect(page.getByTestId('path-count')).toHaveText('2 / 30');
  await expect(page.locator('[data-lesson="sc-2"] [data-status]')).toHaveAttribute('data-status', 'current');
  expect(errors).toEqual([]);
});

test('progressions: checkpoint 1 skips ahead, then the I–IV–V–I lesson is answered with buttons', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = collectErrors(page);
  await page.goto('/learn/progressions/pr-cp1');
  await playLesson(page);
  await expect(page.getByTestId('lesson-results')).toContainText('Đã bỏ qua 5 bài phía trước');
  await page.getByRole('link', { name: 'Bài tiếp →' }).click();
  await expect(page.getByRole('heading', { name: 'I – IV – V – I' })).toBeVisible();
  await playLesson(page);
  await expect(page.getByTestId('lesson-results').locator('[data-stars]')).toHaveAttribute('data-stars', '3');
  await page.getByRole('link', { name: 'Về lộ trình' }).click();
  await expect(page.getByTestId('path-count')).toHaveText('7 / 30');
  expect(errors).toEqual([]);
});
