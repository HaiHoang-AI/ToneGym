import { expect, test, type Page } from '@playwright/test';

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  return errors;
}

type Hook = { phase: string; answerId?: string; key?: string; index: number };
const hook = (page: Page) => page.evaluate(() => (window as unknown as { __earlabLearn?: Hook }).__earlabLearn);

/** Plays a lesson to the results. `wrongMain`: answer the graded questions wrongly (yes/no lessons only). */
async function playLesson(page: Page, opts: { wrongMain?: boolean } = {}) {
  for (let guard = 0; guard < 200; guard++) {
    const phase = await page.locator('[data-phase]').getAttribute('data-phase');
    if (phase === 'results') return;
    if (phase === 'slides') {
      await page.locator('[data-slide] .btn-primary').click();
      continue;
    }
    if (phase === 'anchor') {
      await page.getByRole('button', { name: /Tiếp: nghe mẫu/ }).click();
      continue;
    }
    if (phase === 'start') {
      await page.getByRole('button', { name: 'Bắt đầu thi' }).click();
      continue;
    }
    const h = await hook(page);
    if (!h?.answerId) {
      await page.waitForTimeout(50);
      continue;
    }
    const wrong = opts.wrongMain && h.phase === 'main';
    if (h.key === undefined) {
      const id = wrong ? (h.answerId === 'yes' ? 'no' : 'yes') : h.answerId;
      await page.locator(`[data-answer="${id}"]`).click();
    } else {
      await page.getByRole('button', { name: h.key, exact: true }).click();
    }
    if (wrong) await page.getByRole('button', { name: 'Tiếp →' }).click();
    await page.waitForFunction(
      (prev) => {
        const now = (window as unknown as { __earlabLearn?: Hook }).__earlabLearn;
        return !now || now.phase !== prev.phase || now.index !== prev.index;
      },
      { phase: h.phase, index: h.index },
    );
  }
  throw new Error('lesson did not finish');
}

test('learn hub: path cards, sheet and the theory course', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/learn');
  await expect(page.getByRole('heading', { name: 'Học từng bước, luyện thật nhiều' })).toBeVisible();
  await expect(page.locator('[data-path]')).toHaveCount(5);
  await page.locator('[data-path="pitch"]').click();
  await page.getByRole('dialog').getByRole('link', { name: /Học/ }).click();
  await expect(page.getByTestId('path-count')).toHaveText('0 / 32');
  await page.goto('/learn');
  await page.getByRole('link', { name: /Nhạc lý cơ bản/ }).click();
  await expect(page.getByRole('heading', { name: 'Học cùng thầy nhạc' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('pitch: intro and lesson 1 at 3★ open lesson 2', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await page.goto('/learn/pitch/pitch-intro');
  await playLesson(page);
  await expect(page.getByTestId('lesson-results')).toContainText('Xong phần làm quen');
  await page.getByRole('link', { name: 'Bài tiếp →' }).click();
  await expect(page.locator('[data-phase]')).toHaveAttribute('data-phase', 'slides');
  await playLesson(page);
  const results = page.getByTestId('lesson-results');
  await expect(results.locator('[data-stars]')).toHaveAttribute('data-stars', '3');
  await expect(results).toContainText('100%');
  await page.getByRole('link', { name: 'Về lộ trình' }).click();
  await expect(page.getByTestId('path-count')).toHaveText('2 / 32');
  await expect(page.locator('[data-lesson="pitch-2"] [data-status]')).toHaveAttribute('data-status', 'current');
  expect(errors).toEqual([]);
});

test('pitch: 1★ on lesson 1 shows TRY AGAIN and keeps lesson 2 locked', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await page.goto('/learn/pitch/pitch-intro');
  await playLesson(page);
  await page.goto('/learn/pitch/pitch-1');
  await playLesson(page, { wrongMain: true });
  await expect(page.getByTestId('lesson-results').locator('[data-stars]')).toHaveAttribute('data-stars', '1');
  await page.getByRole('link', { name: 'Về lộ trình' }).click();
  await expect(page.locator('[data-lesson="pitch-1"] [data-status]')).toHaveText('THỬ LẠI');
  await expect(page.locator('[data-lesson="pitch-2"] [data-status]')).toHaveAttribute('data-status', 'locked');
  expect(errors).toEqual([]);
});

test('pitch: passing checkpoint 1 skips lessons 1–5', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await page.goto('/learn/pitch');
  await page.locator('[data-lesson="pitch-cp1"] a').click();
  await playLesson(page);
  await expect(page.getByTestId('lesson-results')).toContainText('Đã bỏ qua 6 bài phía trước');
  await page.getByRole('link', { name: 'Về lộ trình' }).click();
  for (const id of ['pitch-intro', 'pitch-1', 'pitch-2', 'pitch-3', 'pitch-4', 'pitch-5']) {
    await expect(page.locator(`[data-lesson="${id}"] [data-status]`)).toHaveAttribute('data-status', 'skipped');
  }
  await expect(page.getByTestId('path-count')).toHaveText('7 / 32');
  await expect(page.locator('[data-lesson="pitch-6"] [data-status]')).toHaveAttribute('data-status', 'current');
  expect(errors).toEqual([]);
});
