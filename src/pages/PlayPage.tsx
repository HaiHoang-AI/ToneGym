import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { audio } from '../audio/engine';
import { useProfile } from '../app/ProfileContext';
import { useL } from '../app/useL';
import { GameArt } from '../components/art/GameArt';
import { Yumika } from '../components/art/Characters';
import { NoteInput } from '../components/NoteInput';
import { RhythmInput } from '../components/RhythmInput';
import { melodic } from '../games/sound';
import { getGame } from '../games/registry';
import { CHANGE_LEVEL_FROM, HINTS_PER_LEVEL, LIVES_PER_LEVEL, STAGES_PER_LEVEL } from '../games/levels';
import { answer, next, startSession, useHint, type SessionState } from '../games/session';
import type { Sound } from '../games/types';
import { SKILL_COLORS, SKILL_NAMES } from '../games/types';
import { completeWorkoutGame, getProgress, minSelectableLevel, recordLevelResult, setCurrentLevel, type WorkoutCompletion } from '../progress/store';
import { createRng } from '../theory';
import type { GameProgress } from '../db/schema';

declare global {
  interface Window {
    /** Exposed for automated tests only (see e2e/). */
    __earlab?: { correctId?: string; phase?: string; target?: number[]; answer?: (id: string) => void };
  }
}

async function play(sound: Sound | undefined) {
  if (!sound || sound.steps.length === 0) return;
  audio.stop();
  await audio.start();
  await audio.playSequence(sound.steps);
}

function Heart({ full }: { full: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill={full ? '#f87171' : 'none'} stroke={full ? 'none' : 'var(--line2)'} strokeWidth="2">
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
    </svg>
  );
}

export function PlayPage() {
  const { gameId = '' } = useParams();
  const [params] = useSearchParams();
  const inWorkout = params.get('workout') === '1';
  const game = getGame(gameId);
  const profile = useProfile();
  const l = useL();
  const navigate = useNavigate();
  const ctx = useMemo(
    () => ({ lang: profile.settings.language, accidentals: profile.settings.accidentals, naming: profile.settings.noteNaming }),
    [profile.settings.language, profile.settings.accidentals, profile.settings.noteNaming],
  );
  const rng = useRef(createRng(Date.now() & 0xffffffff));
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [level, setLevel] = useState(1);
  const [session, setSession] = useState<SessionState | null>(null);
  const [workoutResult, setWorkoutResult] = useState<WorkoutCompletion | null>(null);
  const [deadline, setDeadline] = useState<number | null>(null);
  /** What the player entered for a notes question (for compare). */
  const [entered, setEntered] = useState<number[] | null>(null);
  const [now, setNow] = useState(Date.now());
  const saved = useRef(false);
  /** True once the finished level (and workout progress) has been written. */
  const [persisted, setPersisted] = useState(false);

  useEffect(() => {
    if (!game) return;
    void getProgress(profile.id!, game.id).then((p) => {
      setProgress(p);
      setLevel(p.level);
    });
  }, [game, profile.id]);

  const q = session?.question;

  // Expose the expected answer to the e2e tests.
  useEffect(() => {
    window.__earlab = {
      correctId: q?.correctId,
      phase: session?.phase,
      target: q?.input?.kind === 'notes' ? q.input.target : undefined,
      answer: (id: string) => setSession((s) => (s ? answer(s, id) : s)),
    };
  }, [q, session?.phase]);

  // New question: play it and start the timer.
  useEffect(() => {
    if (!session || session.phase !== 'question') return;
    setEntered(null);
    // Rhythm questions play inside their own input (count-in + recording).
    if (session.question.input?.kind !== 'rhythm') void play(session.question.sound);
    setDeadline(session.question.timeLimitMs ? Date.now() + session.question.timeLimitMs : null);
  }, [session?.question]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!deadline || session?.phase !== 'question') return;
    const t = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(t);
  }, [deadline, session?.phase]);

  useEffect(() => {
    if (deadline && session?.phase === 'question' && now >= deadline) {
      setSession((s) => (s ? answer(s, null) : s));
      setDeadline(null);
    }
  }, [now, deadline, session?.phase]);

  // Level finished: save it once.
  useEffect(() => {
    if (!session || !game || (session.phase !== 'passed' && session.phase !== 'failed') || saved.current) return;
    saved.current = true;
    void (async () => {
      const p = await recordLevelResult({
        profileId: profile.id!,
        gameId: game.id,
        level: session.level,
        passed: session.phase === 'passed',
        score: session.score,
        correct: session.correct,
        answered: session.answered,
        context: inWorkout ? 'workout' : 'free',
      });
      setProgress(p);
      if (inWorkout) setWorkoutResult(await completeWorkoutGame(profile.id!, game.id));
      setPersisted(true);
    })();
  }, [session, game, profile.id, inWorkout]);

  useEffect(() => () => audio.stop(), []);

  const begin = useCallback(
    async (lv: number) => {
      if (!game) return;
      await audio.start();
      saved.current = false;
      setPersisted(false);
      setWorkoutResult(null);
      setLevel(lv);
      setSession(startSession(game, lv, rng.current, ctx));
    },
    [game, ctx],
  );

  const choose = useCallback((id: string | null) => {
    audio.stop();
    setDeadline(null);
    setSession((s) => (s ? answer(s, id) : s));
  }, []);

  const goNext = useCallback(() => {
    if (!game) return;
    setSession((s) => (s ? next(s, game, rng.current, ctx) : s));
  }, [game, ctx]);

  const hint = useCallback(() => {
    if (!session?.question.hint || session.hints <= 0 || session.phase !== 'question') return;
    void play(session.question.hint.sound);
    setSession((s) => (s ? useHint(s) : s));
  }, [session]);

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Escape') {
        audio.stop();
        navigate(inWorkout ? '/' : '/games');
        return;
      }
      if (!session) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          void begin(level);
        }
        return;
      }
      const s = session;
      // Space taps rhythms and digits are not answers when the question has its own input.
      if (s.question.input && s.phase === 'question' && (e.key === ' ' || /^[1-9]$/.test(e.key))) return;
      if (e.key === ' ') {
        e.preventDefault();
        void play(s.question.sound);
      } else if (e.key.toLowerCase() === 'r') void play(s.question.reference);
      else if (e.key.toLowerCase() === 'h') hint();
      else if (e.key.toLowerCase() === 'c' && s.phase === 'answered') {
        const mine = s.question.options.find((o) => o.id === s.picked);
        const right = s.question.options.find((o) => o.id === s.question.correctId);
        void (async () => {
          if (mine?.sound) await play(mine.sound);
          await play(right?.sound);
        })();
      } else if (e.key === 'Enter' && s.phase === 'answered') goNext();
      else if (/^[1-9]$/.test(e.key) && s.phase === 'question') {
        const opt = s.question.options[Number(e.key) - 1];
        if (opt) choose(opt.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [session, level, begin, hint, goNext, choose, navigate, inWorkout]);

  if (!game || !game.makeQuestion) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="text-muted">{l('Game này chưa có.', 'This game is not available yet.')}</p>
        <Link className="btn mt-4" to="/games">{l('Về thư viện game', 'Back to games')}</Link>
      </div>
    );
  }

  const color = SKILL_COLORS[game.skill];
  const timeLeft = deadline && q?.timeLimitMs ? Math.max(0, (deadline - now) / q.timeLimitMs) : null;
  const canChangeLevel = progress && progress.maxLevel > CHANGE_LEVEL_FROM;
  const exitTo = inWorkout ? '/' : '/games';

  const topBar = (
    <header className="flex flex-wrap items-center gap-4 border-b border-line bg-bg px-4 py-3 sm:px-6">
      <Link className="btn" to={exitTo} onClick={() => audio.stop()}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        {l('Thoát', 'Exit')}
      </Link>
      <div className="flex items-center gap-3">
        <div className="h-10 w-14 overflow-hidden rounded-[10px]">
          <GameArt skill={game.skill} variant={game.art.variant} mark={game.art.mark} height={40} />
        </div>
        <div>
          <div className="h-display text-[17px] font-bold">{l(game.name)}</div>
          <div className="text-[13px] text-muted">Level {session?.level ?? level}{inWorkout ? ' · Workout' : ''}</div>
        </div>
      </div>
      {session && (
        <>
          <div className="flex min-w-[220px] flex-1 justify-center gap-1.5" aria-label={l(`Chặng ${session.stage + 1} trên ${STAGES_PER_LEVEL}`, `Round ${session.stage + 1} of ${STAGES_PER_LEVEL}`)}>
            {Array.from({ length: STAGES_PER_LEVEL }, (_, i) => (
              <span key={i} className="h-2 w-7 rounded-full" style={{ background: i < session.stage ? color : i === session.stage ? '#f4b740' : 'var(--line)' }} />
            ))}
          </div>
          <div className="flex items-center gap-3.5">
            <div className="flex gap-1" aria-label={l(`Còn ${session.lives} mạng`, `${session.lives} lives left`)}>
              {Array.from({ length: LIVES_PER_LEVEL }, (_, i) => <Heart key={i} full={i < session.lives} />)}
            </div>
            <div className="text-sm text-muted">
              {l('Điểm', 'Score')} <strong className="h-display text-lg text-ink">{session.score.toLocaleString()}</strong>
            </div>
          </div>
        </>
      )}
    </header>
  );

  if (!session) {
    const min = progress ? minSelectableLevel(progress) : 1;
    return (
      <div className="flex min-h-screen flex-col bg-bg-deep">
        {topBar}
        <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col gap-6 px-4 py-8">
          <section className="overflow-hidden rounded-[20px] border border-line bg-surface">
            <GameArt skill={game.skill} variant={game.art.variant} mark={game.art.mark} height={220} />
            <div className="flex flex-col gap-3 p-6">
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>{l(SKILL_NAMES[game.skill])}</div>
              <h1 className="h-display text-3xl font-bold">{l(game.name)}</h1>
              <p className="text-muted">{l(game.desc)}</p>
              <div className="flex flex-wrap items-end gap-3 pt-2">
                <button type="button" className="btn btn-primary" onClick={() => void begin(level)}>
                  {l(`Bắt đầu level ${level}`, `Start level ${level}`)} <span className="kbd !border-accent-ink/30 !bg-transparent !text-accent-ink">Enter</span>
                </button>
                {canChangeLevel && (
                  <label className="flex flex-col gap-1 text-xs font-semibold uppercase text-muted">
                    {l('Đổi level', 'Change level')}
                    <select
                      className="field !w-auto"
                      value={level}
                      onChange={async (e) => {
                        const lv = Number(e.target.value);
                        setLevel(lv);
                        await setCurrentLevel(profile.id!, game.id, lv);
                      }}
                    >
                      {Array.from({ length: progress!.maxLevel - min + 1 }, (_, i) => min + i).map((lv) => (
                        <option key={lv} value={lv}>Level {lv}{lv === progress!.maxLevel ? ' ★' : ''}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            </div>
          </section>
          <section className="card text-sm text-muted">
            <div className="label">{l('Luật chơi', 'How it works')}</div>
            <ul className="list-disc space-y-1 pl-5">
              <li>{l(`Mỗi level có ${STAGES_PER_LEVEL} chặng. Sai ${LIVES_PER_LEVEL} lần là phải chơi lại level.`, `Each level has ${STAGES_PER_LEVEL} rounds. ${LIVES_PER_LEVEL} mistakes and you replay it.`)}</li>
              <li>{l(`Có ${HINTS_PER_LEVEL} phao gợi ý mỗi level.`, `You get ${HINTS_PER_LEVEL} hints per level.`)}</li>
              <li>{l('Sau khi trả lời, bấm C để nghe so sánh đáp án của bạn và đáp án đúng.', 'After answering, press C to compare your answer with the right one.')}</li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5"><span className="kbd">Space</span> {l('nghe lại', 'replay')}</span>
              <span className="inline-flex items-center gap-1.5"><span className="kbd">R</span> {l('nốt gốc', 'reference')}</span>
              <span className="inline-flex items-center gap-1.5"><span className="kbd">1</span>–<span className="kbd">9</span> {l('trả lời', 'answer')}</span>
              <span className="inline-flex items-center gap-1.5"><span className="kbd">H</span> {l('phao', 'hint')}</span>
              <span className="inline-flex items-center gap-1.5"><span className="kbd">C</span> {l('so sánh', 'compare')}</span>
              <span className="inline-flex items-center gap-1.5"><span className="kbd">Enter</span> {l('tiếp', 'next')}</span>
              <span className="inline-flex items-center gap-1.5"><span className="kbd">Esc</span> {l('thoát', 'exit')}</span>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if ((session.phase === 'passed' || session.phase === 'failed') && !persisted) {
    return (
      <div className="flex min-h-screen flex-col bg-bg-deep">
        {topBar}
        <main className="grid flex-1 place-items-center text-muted" aria-live="polite">{l('Đang lưu kết quả…', 'Saving…')}</main>
      </div>
    );
  }

  if (session.phase === 'passed' || session.phase === 'failed') {
    const passed = session.phase === 'passed';
    return (
      <div className="flex min-h-screen flex-col bg-bg-deep">
        {topBar}
        <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col items-center gap-5 px-4 py-10 text-center">
          <Yumika mood={passed ? 'cheer' : 'oops'} size={150} outfit={profile.settings.mascotOutfit ?? 'casual'} />
          <h1 className="h-display text-3xl font-bold">
            {passed ? l(`Qua level ${session.level}!`, `Level ${session.level} cleared!`) : l('Hết mạng rồi…', 'Out of lives…')}
          </h1>
          <p className="text-muted">
            {l(`${session.correct}/${session.answered} câu đúng · ${session.score.toLocaleString()} điểm`, `${session.correct}/${session.answered} correct · ${session.score.toLocaleString()} points`)}
          </p>
          {workoutResult?.finishedNow && (
            <div className="rounded-2xl border border-accent bg-accent/10 px-5 py-3 font-semibold">
              {l(`Xong workout hôm nay! +${workoutResult.coins} xu · chuỗi ${workoutResult.streak} ngày`, `Workout complete! +${workoutResult.coins} coins · ${workoutResult.streak}-day streak`)}
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            {passed ? (
              <button type="button" className="btn btn-primary" onClick={() => void begin(Math.min(session.level + 1, progress?.maxLevel ?? session.level + 1))}>
                {l(`Level ${session.level + 1}`, `Level ${session.level + 1}`)} →
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => void begin(session.level)}>{l('Chơi lại', 'Try again')}</button>
            )}
            <Link className="btn" to={exitTo}>{inWorkout ? l('Về workout', 'Back to workout') : l('Về thư viện game', 'Back to games')}</Link>
          </div>
        </main>
      </div>
    );
  }

  const answered = session.phase === 'answered';
  const picked = session.question.options.find((o) => o.id === session.picked);
  const correctOpt = session.question.options.find((o) => o.id === session.question.correctId) ?? {
    id: 'ok',
    label: session.question.input?.kind === 'notes'
      ? l('giai điệu bên trên', 'the melody above')
      : l('tiết tấu bên trên', 'the rhythm above'),
    sound: session.question.input?.kind === 'notes' ? melodic(session.question.input.target, 0.6) : session.question.sound,
  };
  const yours = picked ?? (entered ? { id: 'wrong', label: l('của bạn', 'yours'), sound: melodic(entered, 0.6) } : undefined);

  return (
    <div className="flex min-h-screen flex-col bg-bg-deep">
      {topBar}
      <main className="mx-auto flex w-full max-w-[980px] flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <section className="flex flex-col items-center gap-4 rounded-[20px] border border-line bg-surface p-8 text-center">
          <p className="text-[15px] text-muted">{l(session.question.prompt)}</p>
          <h1 className="h-display text-3xl font-bold">
            {l(session.question.title)}
            {session.question.display && <span className="ml-2 text-link">{session.question.display}</span>}
          </h1>
          {!session.question.soundChoice && (
            <button
              type="button"
              onClick={() => void play(session.question.sound)}
              aria-label={l('Nghe lại câu hỏi', 'Replay the question')}
              className="grid h-24 w-24 place-items-center rounded-full border-2"
              style={{ borderColor: color, background: `${color}14`, color }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" /></svg>
            </button>
          )}
          <div className="flex flex-wrap justify-center gap-4 text-[13px] text-muted">
            {!session.question.soundChoice && <span className="inline-flex items-center gap-1.5"><span className="kbd">Space</span> {l('nghe lại', 'replay')}</span>}
            {session.question.reference && (
              <button type="button" className="inline-flex items-center gap-1.5 hover:text-ink" onClick={() => void play(session.question.reference)}>
                <span className="kbd">R</span> {l('nghe nốt gốc', 'hear the reference')}
              </button>
            )}
          </div>
          {timeLeft !== null && !answered && (
            <div className="h-1.5 w-full max-w-[520px] overflow-hidden rounded-full bg-surface-2" aria-label={l('Thời gian còn lại', 'Time left')}>
              <div className="h-full transition-[width] duration-100" style={{ width: `${timeLeft * 100}%`, background: timeLeft < 0.25 ? '#f87171' : color }} />
            </div>
          )}
        </section>

        {session.question.input?.kind === 'notes' && (
          <section className="rounded-[20px] border border-line bg-surface p-5">
            <NoteInput
              length={session.question.input.target.length}
              palette={session.question.input.palette}
              style={session.question.input.style}
              naming={profile.settings.noteNaming}
              accidentals={profile.settings.accidentals}
              reveal={answered ? session.question.input.target : undefined}
              disabled={answered}
              onDone={(notes) => {
                setEntered(notes);
                const target = (session.question.input as { target: number[] }).target;
                choose(notes.every((n, i) => n === target[i]) ? 'ok' : 'wrong');
              }}
            />
          </section>
        )}
        {session.question.input?.kind === 'rhythm' && (
          <section className="rounded-[20px] border border-line bg-surface p-5">
            <RhythmInput
              key={session.stage + ':' + session.answered}
              pattern={session.question.input.pattern}
              bpm={session.question.input.bpm}
              playFirst={session.question.input.playFirst}
              showNotation={session.question.input.showNotation}
              toleranceMs={session.question.input.toleranceMs}
              latencyMs={profile.settings.tapLatencyMs ?? 0}
              theme={profile.settings.theme}
              disabled={answered}
              onDone={(g) => choose(g.passed ? 'ok' : 'wrong')}
            />
          </section>
        )}

        <section aria-label={l('Các phương án', 'Answers')} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {session.question.options.map((o, i) => {
            let border = 'var(--line)';
            let bg = 'var(--surface)';
            if (answered) {
              if (o.id === session.question.correctId) { border = '#34d399'; bg = '#34d3991a'; }
              else if (o.id === session.picked) { border = '#f87171'; bg = '#f871711a'; }
            }
            const onClick = () => {
              if (answered || session.question.soundChoice) void play(o.sound);
              else choose(o.id);
            };
            return (
              <div key={o.id} className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={onClick}
                  data-option={o.id}
                  className="flex min-h-[76px] items-center gap-3.5 rounded-[14px] border-2 px-4 py-3 text-left text-ink transition hover:brightness-110"
                  style={{ borderColor: border, background: bg }}
                >
                  <span className="kbd">{i + 1}</span>
                  <span className="flex min-w-0 flex-col">
                    <span className="h-display text-xl font-bold">{o.label}</span>
                    {o.sublabel && <span className="text-[13px] text-muted">{o.sublabel}</span>}
                  </span>
                  {(answered || session.question.soundChoice) && o.sound && (
                    <svg className="ml-auto shrink-0 text-muted" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" /></svg>
                  )}
                </button>
                {session.question.soundChoice && !answered && (
                  <button type="button" className="btn btn-sm" onClick={() => choose(o.id)}>{l(`Chọn ${o.label}`, `Pick ${o.label}`)}</button>
                )}
              </div>
            );
          })}
        </section>

        {answered && !session.lastCorrect && (
          <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-bad/40 bg-bad/5 p-5">
            <Yumika mood="oops" size={76} outfit={profile.settings.mascotOutfit ?? 'casual'} />
            <div className="min-w-0 flex-[1_1_300px]">
              <div className="h-display text-[17px] font-bold">
                {session.picked === null ? l('Hết giờ! ', "Time's up! ") : l('Chưa đúng — ', 'Not quite — ')}
                {l('đáp án là', 'the answer is')} {correctOpt.label}{correctOpt.sublabel && !session.question.soundChoice ? ` (${correctOpt.sublabel})` : ''}
              </div>
              <div className="mt-1 text-sm text-ink-2">{l('Chế độ so sánh: nghe lần lượt lựa chọn của bạn và đáp án để nhớ khác biệt.', 'Compare mode: hear your choice and the answer to learn the difference.')}</div>
            </div>
            {yours?.sound && <button type="button" className="btn" onClick={() => void play(yours.sound)}>▶ {l('Bạn chọn', 'Yours')}: {yours.label}</button>}
            {correctOpt.sound && <button type="button" className="btn !border-good" onClick={() => void play(correctOpt.sound)}>▶ {l('Đáp án', 'Answer')}: {correctOpt.label}</button>}
            <button type="button" className="btn btn-primary" onClick={goNext}>{l('Chặng tiếp', 'Next')} <span className="kbd">Enter</span></button>
          </section>
        )}
        {answered && session.lastCorrect && (
          <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-good/40 bg-good/5 p-5">
            <Yumika mood="cheer" size={76} outfit={profile.settings.mascotOutfit ?? 'casual'} />
            <div className="h-display flex-1 text-[17px] font-bold">
              {l('Chính xác!', 'Correct!')} {session.streak > 1 && <span className="text-link">×{session.streak}</span>}
            </div>
            <button type="button" className="btn btn-primary" onClick={goNext}>{l('Chặng tiếp', 'Next')} <span className="kbd">Enter</span></button>
          </section>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-surface-2 pt-2">
          <div className="flex flex-wrap gap-2.5">
            <button type="button" className="btn" disabled={!session.question.hint || session.hints <= 0 || answered} onClick={hint}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f4b740" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" />
                <path d="M6.3 6.3l3.2 3.2M14.5 14.5l3.2 3.2M17.7 6.3l-3.2 3.2M9.5 14.5l-3.2 3.2" />
              </svg>
              {session.question.hint ? l(session.question.hint.label) : l('Phao gợi ý', 'Hint')} · {session.hints} <span className="kbd">H</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-3.5 text-[13px] text-muted">
            <span className="inline-flex items-center gap-1.5"><span className="kbd">1</span>–<span className="kbd">{session.question.options.length}</span> {l('trả lời', 'answer')}</span>
            <span className="inline-flex items-center gap-1.5"><span className="kbd">C</span> {l('so sánh', 'compare')}</span>
            <span className="inline-flex items-center gap-1.5"><span className="kbd">Esc</span> {l('thoát', 'exit')}</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
