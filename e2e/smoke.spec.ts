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
    ['/tools', 'Công cụ nhạc lý'],
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
      await page.evaluate(() => window.__earlab!.answer!('__wrong'));
      await page.getByRole('button', { name: /Chặng tiếp/ }).click();
    }
    await expect(page.getByText('Hết mạng rồi…')).toBeVisible();
  }
  await expect(page.getByText(/Xong workout hôm nay/)).toBeVisible();
  await page.goto('/');
  await expect(page.getByTitle('Xu')).toContainText('30');
});

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteName = (m: number) => `${NAMES[m % 12]}${Math.floor(m / 12) - 1}`;

test('melody hunt: entering the melody on the keyboard passes a round', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/play/melody-hunt');
  await page.getByRole('button', { name: /Bắt đầu level/ }).click();
  await page.waitForFunction(() => window.__earlab?.phase === 'question' && !!window.__earlab.target);
  const target = await page.evaluate(() => window.__earlab!.target!);
  for (const m of target) await page.getByRole('button', { name: noteName(m), exact: true }).click();
  await expect(page.getByText('Chính xác!')).toBeVisible();
  expect(errors).toEqual([]);
});

test('rhythm reading: tapping on the beat passes, tapping off it fails', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/play/rhythm-read');
  await page.getByRole('button', { name: /Bắt đầu level/ }).click();
  await expect(page.locator('[aria-label="Rhythm notation"] svg')).toBeVisible();

  const tapAlong = async (offsetMs: number) => {
    await page.getByRole('button', { name: /^Bắt đầu/ }).first().click();
    await page.waitForFunction(() => !!(window as unknown as { __earlabRhythm?: unknown }).__earlabRhythm);
    await page.evaluate((offset) => {
      const r = (window as unknown as { __earlabRhythm: { recordStart: number; expectedMs: number[]; latencyMs: number } }).__earlabRhythm;
      for (const at of r.expectedMs) {
        const when = r.recordStart + at + r.latencyMs + offset - performance.now();
        setTimeout(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' })), Math.max(0, when));
      }
      (window as unknown as { __earlabRhythm?: unknown }).__earlabRhythm = undefined;
    }, offsetMs);
  };

  await tapAlong(0);
  await expect(page.getByText('Chính xác!')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: /Chặng tiếp/ }).click();
  await tapAlong(400);
  await expect(page.getByText(/Chưa đúng/)).toBeVisible({ timeout: 20_000 });
  expect(errors).toEqual([]);
});

test('melody playground and rhythm exercise render', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/playground');
  await page.getByRole('link', { name: 'Vào luyện' }).first().click();
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await expect(page.getByLabel('Các nốt đã nhập')).toBeVisible();
  await page.goto('/exercises');
  await page.getByRole('tab', { name: 'Tiết tấu' }).click();
  await page.getByRole('button', { name: /Bắt đầu$/ }).first().click();
  await expect(page.locator('[aria-label="Rhythm notation"] svg')).toBeVisible();
  expect(errors).toEqual([]);
});

test('treble reading: notation renders and answering clears a level', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/play/treble-reading');
  await page.getByRole('button', { name: /Bắt đầu level/ }).click();
  for (let i = 0; i < 8; i++) {
    await page.waitForFunction(() => window.__earlab?.phase === 'question');
    await expect(page.locator('[data-staff] svg')).toBeVisible();
    const id = await page.evaluate(() => window.__earlab!.correctId!);
    await page.locator(`[data-option="${id}"]`).click();
    await page.getByRole('button', { name: /Chặng tiếp/ }).click();
  }
  await expect(page.getByText('Qua level 1!')).toBeVisible();
  expect(errors).toEqual([]);
});

test('sight-reading playground and read-mode exercises render notation', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/playground/sight-reading');
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await expect(page.locator('[data-staff] svg')).toBeVisible();
  await page.getByRole('button', { name: 'Khóa Fa' }).click();
  await expect(page.locator('[data-staff] svg')).toBeVisible();
  await page.goto('/exercises');
  await page.getByRole('button', { name: 'Đọc nốt' }).click();
  await page.getByRole('button', { name: /Bắt đầu$/ }).first().click();
  await expect(page.locator('[data-staff] svg')).toBeVisible();
  expect(errors).toEqual([]);
});

test('singing: holding the right pitch passes, a wrong pitch fails (simulated mic)', async ({ page }) => {
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    window.__earlabFakePitch = null;
  });
  await page.goto('/play/sing-interval');
  await page.getByRole('button', { name: /Bắt đầu level/ }).click();
  await page.waitForFunction(() => window.__earlab?.phase === 'question' && !!window.__earlab.target);
  await page.getByRole('button', { name: /Bật micro và hát/ }).click();
  const target = await page.evaluate(() => window.__earlab!.target![0]!);
  await page.evaluate((t) => { window.__earlabFakePitch = t + 0.1; }, target);
  await expect(page.getByText('Chính xác!')).toBeVisible();
  await page.evaluate(() => { window.__earlabFakePitch = null; });
  await page.getByRole('button', { name: /Chặng tiếp/ }).click();
  await page.waitForFunction(() => window.__earlab?.phase === 'question');
  await page.getByRole('button', { name: /Bật micro và hát/ }).click();
  const t2 = await page.evaluate(() => window.__earlab!.target![0]!);
  await page.evaluate((t) => { window.__earlabFakePitch = t + 2; }, t2);
  await expect(page.getByText(/Chưa đúng/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('mic tools render and the tuner shows a simulated note', async ({ page }) => {
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    window.__earlabFakePitch = 69;
  });
  await page.goto('/tools');
  await page.getByRole('link', { name: /Máy lên dây/ }).click();
  await page.getByRole('button', { name: /Bật micro/ }).click();
  await expect(page.getByText('440.0 Hz')).toBeVisible();
  for (const path of ['/tools/vocal-range', '/tools/perfect-pitch', '/tools/sight-singing', '/tools/warmup']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('theory tools render and the piano recorder exports MIDI', async ({ page }) => {
  const errors = collectErrors(page);
  for (const [path, heading] of [
    ['/tools/progressions', 'Tạo vòng hợp âm'],
    ['/tools/circle', 'Vòng quãng năm'],
    ['/tools/scales', 'Tra âm giai'],
    ['/tools/chords', 'Chơi hợp âm'],
    ['/tools/interval-memorizer', 'Ghi nhớ quãng'],
    ['/tools/metronome', 'Metronome'],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  }
  await page.goto('/tools/progressions');
  await page.getByRole('button', { name: 'Kết cơ bản' }).click();
  await expect(page.getByRole('textbox').first()).toHaveValue('I-IV-V-I');

  await page.goto('/tools/piano');
  await page.getByRole('button', { name: /Ghi âm/ }).click();
  for (const key of ['C4', 'E4', 'G4']) await page.getByRole('button', { name: key, exact: true }).click();
  await page.getByRole('button', { name: /Dừng ghi/ }).click();
  await expect(page.getByText('3 nốt').first()).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Xuất MIDI/ }).click();
  expect((await download).suggestedFilename()).toMatch(/\.mid$/);
  expect(errors).toEqual([]);
});

test('a MIDI keyboard can answer a chord in play mode', async ({ page }) => {
  await page.goto('/exercises');
  await page.getByRole('tab', { name: 'Hợp âm', exact: true }).click();
  await page.getByRole('button', { name: 'Chơi trên piano' }).click();
  await page.getByRole('button', { name: /Bắt đầu$/ }).first().click();
  await expect(page.getByText(/Giữ Ctrl và bấm các nốt/)).toBeVisible();
  // Any three-note chord from the MIDI keyboard is graded (right or wrong) like a mouse chord.
  await page.evaluate(() => {
    for (const n of [60, 64, 67]) window.__earlabMidi!.emit(n, 0.8, true);
  });
  await expect(page.getByText(/Chính xác!|Chưa đúng/)).toBeVisible();
});
