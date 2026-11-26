import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { audio } from '../audio/engine';
import { useProfile } from '../app/ProfileContext';
import { useL } from '../app/useL';
import { Yumika } from '../components/art/Characters';
import { Staff } from '../components/Staff';
import { ENTRY_FEE, isoWeekKey, msUntilWeekEnd, SPRINT_SECONDS, themeFor, TO_JACKPOT } from '../contest/contest';
import { payEntry, recordEntry, settleFinishedWeeks, weekBoard } from '../contest/store';
import { getGame } from '../games/registry';
import type { Question } from '../games/types';
import { useStats } from '../progress/hooks';
import { createRng } from '../theory';

async function playQuestion(q: Question) {
  if (!q.sound.steps.length) return;
  await audio.start();
  audio.stop();
  void audio.playSequence(q.sound.steps);
}

export function ContestPage() {
  const l = useL();
  const profile = useProfile();
  const stats = useStats(profile.id!);
  const week = isoWeekKey(new Date());
  const theme = themeFor(week);
  const game = getGame(theme.gameId)!;
  const board = useLiveQuery(() => weekBoard(week), [week]);
  const [phase, setPhase] = useState<'lobby' | 'running' | 'done'>('lobby');
  const [q, setQ] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [endsAt, setEndsAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [notice, setNotice] = useState<string | null>(null);
  const rng = useRef(createRng(Date.now() & 0xffffffff));
  const ctx = useMemo(() => ({ lang: l.lang, accidentals: profile.settings.accidentals, naming: profile.settings.noteNaming }), [l.lang, profile.settings.accidentals, profile.settings.noteNaming]);

  useEffect(() => {
    void settleFinishedWeeks().then((weeks) => {
      if (weeks.length) setNotice(l(`Đã chia thưởng tuần ${weeks.join(', ')}.`, `Prizes paid for ${weeks.join(', ')}.`));
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const nextQuestion = useCallback(() => {
    const question = game.makeQuestion!(theme.level, rng.current, ctx);
    setQ(question);
    void playQuestion(question);
  }, [game, theme.level, ctx]);

  const start = async () => {
    if (!(await payEntry(profile.id!))) {
      setNotice(l(`Cần ${ENTRY_FEE} xu để vào thi. Hoàn thành workout để nhận xu.`, `You need ${ENTRY_FEE} coins. Finish a workout to earn some.`));
      return;
    }
    await audio.start();
    setScore(0);
    setEndsAt(Date.now() + SPRINT_SECONDS * 1000);
    setPhase('running');
    nextQuestion();
  };

  useEffect(() => {
    if (phase !== 'running') return;
    const t = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase === 'running' && now >= endsAt) {
      setPhase('done');
      audio.stop();
      void recordEntry(profile.id!, score);
    }
  }, [now, endsAt, phase, profile.id, score]);

  const answer = (id: string) => {
    if (!q || phase !== 'running') return;
    const ok = id === q.correctId;
    if (ok) setScore((s) => s + 1);
    setFlash(ok ? 'ok' : 'bad');
    window.setTimeout(() => setFlash(null), 250);
    nextQuestion();
  };

  useEffect(() => {
    if (phase !== 'running' || !q) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        void playQuestion(q);
      }
      if (/^[1-9]$/.test(e.key)) {
        const o = q.options[Number(e.key) - 1];
        if (o) answer(o.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const left = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const daysLeft = Math.ceil(msUntilWeekEnd(new Date()) / 86400000);
  const myBest = board?.ranking.find((r) => r.profileId === profile.id)?.best ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-wrap items-center gap-4 rounded-[20px] border border-line bg-surface px-5 py-4">
        <Yumika mood={phase === 'done' ? 'cheer' : 'wave'} size={96} outfit={profile.settings.mascotOutfit ?? 'casual'} />
        <div className="min-w-0 flex-[1_1_280px]">
          <div className="label !mb-0">{l(`Thử thách tuần ${week} · còn ${daysLeft} ngày`, `Weekly challenge ${week} · ${daysLeft} days left`)}</div>
          <h1 className="h-display mt-1 text-[30px] font-bold">{l(theme.name)}</h1>
          <p className="mt-1 text-muted">
            {l(`${SPRINT_SECONDS} giây với game ${l(game.name)} (level ${theme.level}): trả lời đúng càng nhiều càng tốt. Mỗi lượt ${ENTRY_FEE} xu, ${TO_JACKPOT} xu vào quỹ thưởng. Hết tuần, quỹ chia cho các hồ sơ trên máy theo thứ hạng, top 3 nhận huy chương.`, `${SPRINT_SECONDS} seconds of ${l(game.name)} (level ${theme.level}): as many right answers as you can. Each try costs ${ENTRY_FEE} coins, ${TO_JACKPOT} go to the jackpot. At the end of the week the jackpot is shared among local profiles by place; the top 3 get medals.`)}
          </p>
        </div>
      </section>
      {notice && <div className="rounded-xl border border-accent bg-accent/10 px-4 py-3 text-sm font-semibold">{notice}</div>}

      {phase === 'running' && q ? (
        <section className={`card flex flex-col gap-4 transition ${flash === 'ok' ? '!border-good' : flash === 'bad' ? '!border-bad' : ''}`}>
          <div className="flex items-center justify-between">
            <span className="h-display text-4xl font-bold" aria-live="polite">{score}</span>
            <span className={`h-display text-3xl font-bold ${left <= 10 ? 'text-bad-ink' : ''}`}>{left}s</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-accent" style={{ width: `${(left / SPRINT_SECONDS) * 100}%` }} /></div>
          <div className="text-center">
            <div className="text-sm text-muted">{l(q.prompt)}</div>
            <div className="h-display text-2xl font-bold">{l(q.title)}</div>
          </div>
          {q.staff && <div className="rounded-xl bg-surface-2 py-2"><Staff spec={q.staff} theme={profile.settings.theme} /></div>}
          {!q.staff && <button type="button" className="btn self-center" onClick={() => void playQuestion(q)}>▶ {l('Nghe lại (Space)', 'Replay (Space)')}</button>}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {q.options.map((o, i) => (
              <button key={o.id} type="button" data-option={o.id} onClick={() => answer(o.id)} className="flex min-h-14 items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 text-left hover:border-accent">
                <span className="kbd">{i + 1}</span>
                <span className="flex flex-col"><span className="h-display text-lg font-bold">{o.label}</span>{o.sublabel && <span className="text-xs text-muted">{o.sublabel}</span>}</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <div className="flex flex-wrap gap-6">
          <section className="card flex flex-[1_1_300px] flex-col gap-4">
            {phase === 'done' && (
              <div className="rounded-xl bg-good/10 px-4 py-3 text-center">
                <div className="h-display text-4xl font-bold">{score}</div>
                <div className="text-sm text-muted">{l('câu đúng trong 60 giây', 'right in 60 seconds')}</div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-surface-2 p-2"><div className="label !mb-0">{l('Quỹ thưởng', 'Jackpot')}</div><div className="h-display text-xl font-bold">{board?.jackpot ?? 0}</div></div>
              <div className="rounded-xl bg-surface-2 p-2"><div className="label !mb-0">{l('Kỷ lục tuần', 'Week best')}</div><div className="h-display text-xl font-bold">{myBest}</div></div>
              <div className="rounded-xl bg-surface-2 p-2"><div className="label !mb-0">{l('Xu của bạn', 'Your coins')}</div><div className="h-display text-xl font-bold">{stats.coins}</div></div>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => void start()}>{phase === 'done' ? l('Thi lại', 'Try again') : l('Vào thi', 'Enter')} · {ENTRY_FEE} {l('xu', 'coins')}</button>
          </section>
          <section className="card flex-[1_1_320px]">
            <h2 className="h-display mb-3 text-xl font-bold">{l('Bảng xếp hạng tuần', 'This week')}</h2>
            {!board?.ranking.length && <p className="text-sm text-muted">{l('Chưa ai thi tuần này.', 'Nobody has entered yet.')}</p>}
            <ol className="flex flex-col gap-2">
              {board?.ranking.map((r, i) => (
                <li key={r.profileId} className={`flex items-center gap-3 rounded-[10px] px-3 py-2 ${r.profileId === profile.id ? 'bg-surface-2' : ''}`}>
                  <span className="w-6 font-bold" style={{ color: ['#f4b740', '#c7cdd6', '#d08a5a'][i] ?? 'var(--muted)' }}>{i + 1}</span>
                  <span className="grid h-8 w-8 place-items-center rounded-full font-bold text-accent-ink" style={{ background: r.color }}>{r.name.charAt(0).toUpperCase()}</span>
                  <span className="flex-1 font-semibold">{r.name}</span>
                  <span className="text-xs text-muted">{l(`${r.tries} lượt`, `${r.tries} tries`)}</span>
                  <span className="h-display font-bold">{r.best}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </div>
  );
}
