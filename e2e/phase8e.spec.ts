import { expect, test } from '@playwright/test';
import { collectErrors, playLesson } from './learnHelpers';

test('daily session: a new player learns C and G, the hub marks today done, stats chart appears', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await page.goto('/learn');
  await expect(page.getByTestId('daily-card')).toContainText('+2 mới');
  await page.getByTestId('daily-card').click();
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await playLesson(page);
  await expect(page.getByTestId('daily-results')).toContainText('Xong buổi hôm nay');
  await page.getByRole('link', { name: 'Về trang Học' }).click();
  await expect(page.getByTestId('daily-card')).toContainText('Đã xong hôm nay');
  await expect(page.getByTestId('daily-card')).not.toContainText('Thành thạo chung0%');
  await page.goto('/stats');
  const stats = page.getByTestId('learn-stats');
  await expect(stats).toContainText('Cao độ');
  await expect(stats.getByTestId('mastery-chart')).toBeVisible();
  await stats.getByRole('button', { name: 'C', exact: true }).click();
  await expect(stats.getByTestId('mastery-chart')).toContainText('Cao độ · C');
  expect(errors).toEqual([]);
});

test('practice: 60-second quiz from the sheet, results and best score', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await page.clock.install();
  await page.goto('/learn');
  await page.locator('[data-path="intervals"]').click();
  await page.getByRole('dialog').getByRole('link', { name: /Luyện/ }).click();
  await expect(page.getByText('P8 · Quãng 8 đúng')).toBeVisible();
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  for (let i = 0; i < 5; i++) {
    const h = await page.evaluate(() => (window as unknown as { __earlabLearn: { answerId: string; index: number } }).__earlabLearn);
    await page.locator(`[data-answer="${h.answerId}"]`).click();
    await page.waitForFunction((prev) => (window as unknown as { __earlabLearn: { index: number } }).__earlabLearn.index !== prev, h.index);
  }
  await page.clock.fastForward(61_000);
  await expect(page.getByTestId('practice-results')).toContainText('câu đúng trong 60 giây');
  await expect(page.getByTestId('practice-results')).toContainText('Kỷ lục mới');
  await expect(page.getByTestId('practice-results').locator('.h-display')).toHaveText('5');
  expect(errors).toEqual([]);
});

test('pinned lessons show up in the path sheet', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/learn/pitch');
  await page.locator('[data-lesson="pitch-intro"] a').click();
  await playLesson(page);
  await page.getByRole('link', { name: 'Về lộ trình' }).click();
  const pin = page.locator('[data-lesson="pitch-1"]').getByRole('button', { name: '📌' });
  await pin.click();
  await expect(pin).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/learn');
  await page.locator('[data-path="pitch"]').click();
  await expect(page.getByRole('dialog')).toContainText('1 bài đã ghim để ôn');
  await page.getByRole('dialog').getByRole('link', { name: /Đô giữa/ }).click();
  await expect(page.getByRole('heading', { name: 'Đô giữa — ngôi nhà' })).toBeVisible();
  expect(errors).toEqual([]);
});
