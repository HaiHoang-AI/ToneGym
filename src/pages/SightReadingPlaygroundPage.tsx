import { useCallback, useEffect, useRef, useState } from 'react';
import { audio } from '../audio/engine';
import { useProfile } from '../app/ProfileContext';
import { useL } from '../app/useL';
import { Yumika } from '../components/art/Characters';
import { Staff } from '../components/Staff';
import { readingRound, type ReadClef, type ReadContent } from '../games/defs/reading';
import type { Question } from '../games/types';
import { createRng } from '../theory';

const CLEFS: { id: ReadClef; vi: string; en: string }[] = [
  { id: 'treble', vi: 'Khóa Sol', en: 'Treble' },
  { id: 'alto', vi: 'Khóa Đô', en: 'Alto' },
  { id: 'bass', vi: 'Khóa Fa', en: 'Bass' },
];
const CONTENTS: { id: ReadContent; vi: string; en: string }[] = [
  { id: 'notes', vi: 'Nốt', en: 'Notes' },
  { id: 'intervals', vi: 'Quãng', en: 'Intervals' },
  { id: 'chords', vi: 'Hợp âm', en: 'Chords' },
  { id: 'inversions', vi: 'Thế đảo', en: 'Inversions' },
];

/** Sight-reading trainer: endless rounds with response-time and accuracy tracking. */
export function SightReadingPlaygroundPage() {
  const profile = useProfile();
  const l = useL();
  const rng = useRef(createRng(Date.now() & 0xffffffff));
  const [clef, setClef] = useState<ReadClef>('treble');
  const [content, setContent] = useState<ReadContent>('notes');
  const [ledger, setLedger] = useState(false);
  const [accidentals, setAccidentals] = useState(false);
  const [q, setQ] = useState<Question | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [shownAt, setShownAt] = useState(0);
  const [stats, setStats] = useState({ right: 0, total: 0, streak: 0, best: 0, times: [] as number[] });

  const next = useCallback(() => {
    setQ(readingRound({ clef, content, ledger, accidentals }, rng.current, l.lang));
    setPicked(null);
    setShownAt(performance.now());
  }, [clef, content, ledger, accidentals, l.lang]);

  useEffect(() => {
    if (q) next();
    // Settings changed: start a fresh round with them.
  }, [clef, content, ledger, accidentals]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (id: string) => {
    if (!q || picked) return;
    const ok = id === q.correctId;
    const ms = performance.now() - shownAt;
    setPicked(id);
    setStats((s) => {
      const streak = ok ? s.streak + 1 : 0;
      return { right: s.right + (ok ? 1 : 0), total: s.total + 1, streak, best: Math.max(s.best, streak), times: ok ? [...s.times, ms].slice(-20) : s.times };
    });
    const sound = q.options.find((o) => o.id === q.correctId)?.sound;
    if (sound) void audio.start().then(() => audio.playSequence(sound.steps));
    window.setTimeout(next, ok ? 450 : 1400);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!q || !/^[1-9]$/.test(e.key)) return;
      const o = q.options[Number(e.key) - 1];
      if (o) choose(o.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const avg = stats.times.length ? stats.times.reduce((a, b) => a + b, 0) / stats.times.length / 1000 : 0;
  const pill = (on: boolean) => `min-h-10 rounded-[10px] border px-4 text-sm font-semibold ${on ? 'border-teal bg-teal/15 text-ink' : 'border-line bg-surface-2 text-ink'}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <Yumika mood={picked ? (picked === q?.correctId ? 'cheer' : 'oops') : 'wave'} size={88} outfit={profile.settings.mascotOutfit ?? 'casual'} />
        <div>
          <div className="label !mb-0">Playground</div>
          <h1 className="h-display mt-1 text-[32px] font-bold">{l('Đọc nốt', 'Sight-reading')}</h1>
          <p className="mt-1 max-w-2xl text-muted">{l('Đọc càng nhanh càng tốt. Phím 1–9 để trả lời.', 'Read as fast as you can. Keys 1–9 answer.')}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <section className="card flex flex-[1_1_300px] flex-col gap-4">
          <div><span className="label">{l('Khóa', 'Clef')}</span>
            <div className="flex flex-wrap gap-1.5">{CLEFS.map((c) => <button key={c.id} type="button" className={pill(clef === c.id)} onClick={() => setClef(c.id)}>{l(c.vi, c.en)}</button>)}</div>
          </div>
          <div><span className="label">{l('Nội dung', 'Content')}</span>
            <div className="flex flex-wrap gap-1.5">{CONTENTS.map((c) => <button key={c.id} type="button" className={pill(content === c.id)} onClick={() => setContent(c.id)}>{l(c.vi, c.en)}</button>)}</div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={ledger} onChange={(e) => setLedger(e.target.checked)} className="h-5 w-5 accent-[#f4b740]" /> {l('Dòng kẻ phụ', 'Ledger lines')}</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={accidentals} onChange={(e) => setAccidentals(e.target.checked)} className="h-5 w-5 accent-[#f4b740]" /> {l('Dấu hóa (♯ ♭)', 'Accidentals (♯ ♭)')}</label>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-surface-2 p-2"><div className="label !mb-0">{l('Chính xác', 'Accuracy')}</div><div className="h-display text-xl font-bold">{stats.total ? Math.round((stats.right / stats.total) * 100) : 0}%</div></div>
            <div className="rounded-xl bg-surface-2 p-2"><div className="label !mb-0">{l('TB / câu', 'Avg / answer')}</div><div className="h-display text-xl font-bold">{avg ? `${avg.toFixed(1)}s` : '—'}</div></div>
            <div className="rounded-xl bg-surface-2 p-2"><div className="label !mb-0">{l('Chuỗi', 'Streak')}</div><div className="h-display text-xl font-bold">{stats.streak}</div></div>
            <div className="rounded-xl bg-surface-2 p-2"><div className="label !mb-0">{l('Kỷ lục', 'Best')}</div><div className="h-display text-xl font-bold">{stats.best}</div></div>
          </div>
        </section>

        <section className="card flex min-w-0 flex-[999_1_520px] flex-col gap-4">
          {!q ? (
            <button type="button" className="btn btn-primary self-start" onClick={next}>{l('Bắt đầu', 'Start')}</button>
          ) : (
            <>
              <div className="text-center">
                <div className="text-sm text-muted">{l(q.prompt)}</div>
                <h2 className="h-display mt-1 text-2xl font-bold">{l(q.title)}</h2>
              </div>
              <div className="rounded-xl bg-surface-2 py-2"><Staff spec={q.staff!} theme={profile.settings.theme} /></div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {q.options.map((o, i) => {
                  const state = picked ? (o.id === q.correctId ? 'border-good bg-good/10' : o.id === picked ? 'border-bad bg-bad/10' : 'border-line bg-surface-2') : 'border-line bg-surface-2 hover:border-accent';
                  return (
                    <button key={o.id} type="button" data-option={o.id} onClick={() => choose(o.id)} className={`flex min-h-14 items-center gap-2 rounded-xl border px-3 text-left ${state}`}>
                      <span className="kbd">{i + 1}</span>
                      <span className="flex flex-col"><span className="h-display text-[17px] font-bold">{o.label}</span>{o.sublabel && <span className="text-xs text-muted">{o.sublabel}</span>}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
