import { expect, test, type Page } from '@playwright/test';

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  return errors;
}

async function seedCoins(page: Page, coins: number) {
  // Wait until the app has created the first profile.
  await page.waitForFunction(async () => {
    const db = (window as unknown as { __earlabDb?: { meta: { get: (k: string) => Promise<unknown> } } }).__earlabDb;
    return !!db && !!(await db.meta.get('activeProfileId'));
  });
  await page.evaluate(async (c) => {
    const db = (window as unknown as { __earlabDb: { stats: { put: (v: unknown) => Promise<unknown> }; meta: { get: (k: string) => Promise<{ value: number } | undefined> } } }).__earlabDb;
    const active = await db.meta.get('activeProfileId');
    await db.stats.put({ profileId: active!.value, coins: c, streak: 0, bestStreak: 0, lastWorkoutDate: null, workoutsDone: 0, earIndexHistory: [], awards: [], learningPoints: 0, ownedInstruments: ['piano', 'synth'] });
  }, coins);
}

test('course: a lesson quiz passed gives learning points and marks progress', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/learn');
  await expect(page.getByRole('heading', { name: 'Học cùng thầy nhạc' })).toBeVisible();
  await page.getByRole('link', { name: 'Bảy tên nốt và quãng tám' }).click();
  await page.getByRole('button', { name: 'C', exact: true }).click();
  await page.getByRole('button', { name: 'cao hơn một quãng tám' }).click();
  await page.getByRole('button', { name: 'Kiểm tra' }).click();
  await expect(page.getByText(/Đúng hết! \+100 điểm học tập/)).toBeVisible();
  await page.goto('/learn');
  await expect(page.getByText('Đã xong 1/21 bài')).toBeVisible();
  expect(errors).toEqual([]);
});

test('weekly contest: entry fee, 60-second sprint, leaderboard', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await page.goto('/contest');
  await page.getByRole('button', { name: /Vào thi/ }).click();
  await expect(page.getByText(/Cần 4 xu/)).toBeVisible();
  await seedCoins(page, 10);
  await page.getByRole('button', { name: /Vào thi/ }).click();
  await page.clock?.install?.();
  for (let i = 0; i < 5; i++) {
    const option = page.locator('[data-option]').first();
    await option.click();
  }
  await expect(page.getByText('câu đúng trong 60 giây')).toBeVisible({ timeout: 70_000 });
  await expect(page.getByRole('heading', { name: 'Bảng xếp hạng tuần' })).toBeVisible();
  await expect(page.locator('ol li')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('shop: buying and using an instrument; awards and backup render', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/shop');
  await seedCoins(page, 100);
  await page.reload();
  const box = page.locator('article', { hasText: 'Hộp nhạc' });
  await box.getByRole('button', { name: 'Mua' }).click();
  await box.getByRole('button', { name: 'Dùng' }).click();
  await expect(box.getByRole('button', { name: 'Đang dùng' })).toBeVisible();
  await expect(page.getByText('90 xu')).toBeVisible();
  await page.goto('/awards');
  await expect(page.getByRole('heading', { name: 'Giải thưởng & chứng chỉ' })).toBeVisible();
  await page.goto('/profiles');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Tải file sao lưu/ }).click();
  expect((await download).suggestedFilename()).toMatch(/^earlab-backup-.*\.json$/);
  expect(errors).toEqual([]);
});

test('production build works offline after the first visit', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://localhost:4173' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByText('Workout hôm nay')).toBeVisible();
  await page.waitForFunction(async () => (await navigator.serviceWorker.ready).active?.state === 'activated');
  await page.reload();
  await context.setOffline(true);
  await page.goto('/games');
  await expect(page.getByRole('heading', { name: 'Thư viện game' })).toBeVisible();
  await page.goto('/play/chord-id');
  await expect(page.getByRole('button', { name: /Bắt đầu level/ })).toBeVisible();
  await context.close();
});
