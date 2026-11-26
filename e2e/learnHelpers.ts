import type { Page } from '@playwright/test';

export function collectErrors(page: Page): string[] {
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
export async function playLesson(page: Page, opts: { wrongMain?: boolean } = {}) {
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

