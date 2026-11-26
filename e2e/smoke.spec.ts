import { expect, test, type Page } from '@playwright/test';

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  return errors;
}

test.describe('pages', () => {
  for (const [path, text] of [
    ['/', 'Workout hôm nay'],
    ['/games', 'Thư viện game'],
    ['/exercises', 'Nghe và chọn đáp án'],
    ['/stats', 'Thống kê & hạng'],
    ['/profiles', 'Hồ sơ trên máy này'],
    ['/sound', 'Kiểm tra âm thanh'],
    ['/tools', 'sắp có'],
  ] as const) {
    test(`${path} renders without errors`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.goto(path);
      await expect(page.getByText(text).first()).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
});

test('plays and passes a level, then shows it on the games page', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/play/chord-id');
  await page.getByRole('button', { name: /Bắt đầu level/ }).click();
  for (let i = 0; i < 8; i++) {
    await page.waitForFunction(() => window.__earlab?.phase === 'question');
    const id = await page.evaluate(() => window.__earlab!.correctId!);
    await page.locator(`[data-option="${id}"]`).click();
    await page.getByRole('button', { name: /Chặng tiếp/ }).click();
  }
  await expect(page.getByText('Qua level 1!')).toBeVisible();
  await page.goto('/games');
  await expect(page.locator('article', { hasText: 'Nhận hợp âm' }).getByText('Lv 2')).toBeVisible();
  expect(errors).toEqual([]);
});

test('finishing the workout pays coins', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Chơi tiếp:/ })).toBeVisible();
  for (let g = 0; g < 5; g++) {
    await page.goto('/');
    const next = page.getByRole('link', { name: /Chơi tiếp:/ });
    await expect(next).toBeVisible();
    await next.click();
    await page.getByRole('button', { name: /Bắt đầu level/ }).click();
    // Lose quickly: three wrong answers end the level, which still counts for the workout.
    for (let i = 0; i < 3; i++) {
      await page.waitForFunction(() => window.__earlab?.phase === 'question');
      const wrong = await page.evaluate(() => {
        const ids = [...document.querySelectorAll<HTMLElement>('[data-option]')].map((b) => b.dataset.option!);
        return ids.find((id) => id !== window.__earlab!.correctId)!;
      });
      const picker = page.getByRole('button', { name: /^Chọn / });
      if ((await picker.count()) > 0) await page.locator(`[data-option="${wrong}"] + button`).click();
      else await page.locator(`[data-option="${wrong}"]`).click();
      await page.getByRole('button', { name: /Chặng tiếp/ }).click();
    }
    await expect(page.getByText('Hết mạng rồi…')).toBeVisible();
  }
  await expect(page.getByText(/Xong workout hôm nay/)).toBeVisible();
  await page.goto('/');
  await expect(page.getByTitle('Xu')).toContainText('30');
});
