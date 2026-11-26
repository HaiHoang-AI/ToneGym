import { useCallback, useEffect, useRef, useState } from 'react';
import { audio } from '../audio/engine';
import { useProfile } from '../app/ProfileContext';
import { useL } from '../app/useL';
import { PianoKeyboard, type KeyMark } from '../components/PianoKeyboard';
import { RhythmInput } from '../components/RhythmInput';
import { db } from '../db/schema';
import {
  checkPlayed, makeExercise, MODES_BY_TOPIC, RHYTHM_BPM, type Direction, type ExerciseQuestion, type ExerciseSettings, type Mode,
  type RootChoice, type Speed, type Topic,
} from '../exercises/exercise';
import { CHORD_ORDER } from '../games/defs/chords';
import { SCALE_ORDER } from '../games/defs/scalesProgressions';
import type { Sound } from '../games/types';
import { CHORDS, createRng, getChord, getScale, INTERVALS, localName, type IntervalId } from '../theory';

const TOPICS: { id: Topic; vi: string; en: string }[] = [
  { id: 'intervals', vi: 'Quãng', en: 'Intervals' },
  { id: 'chords', vi: 'Hợp âm', en: 'Chords' },
  { id: 'scales', vi: 'Âm giai', en: 'Scales' },
  { id: 'progressions', vi: 'Vòng hợp âm', en: 'Progressions' },
  { id: 'pitch', vi: 'Cao độ', en: 'Pitch' },
  { id: 'rhythm', vi: 'Tiết tấu', en: 'Rhythm' },
];
const MODE_NAMES: Record<Mode, [string, string]> = {
  listen: ['Nghe', 'Listen'],
  compare: ['So sánh', 'Compare'],
  play: ['Chơi trên piano', 'Play on piano'],
  tap: ['Đọc và gõ', 'Read and tap'],
};
const GOAL = 10;

async function play(sound?: Sound) {
  if (!sound) return;
  audio.stop();
  await audio.start();
  await audio.playSequence(sound.steps);
}

const DEFAULTS: ExerciseSettings = {
  topic: 'intervals',
  mode: 'listen',
  intervals: ['m3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'P8'],
  chords: ['maj', 'min', 'dim', 'aug'],
  scales: ['major', 'naturalMinor', 'harmonicMinor', 'majorPentatonic'],
  progressionKey: 'major',
  progressionLength: 4,
  pitchDifficulty: 'medium',
  rhythmBeats: 4,
  rhythmDifficulty: 'easy',
  direction: 'ascending',
  root: 'natural',
  speed: 'moderate',
};

function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`min-h-10 rounded-[10px] border px-4 text-sm font-semibold ${on ? 'border-teal bg-teal/15 text-ink' : 'border-line bg-surface-2 text-ink'}`}
    >
      {children}
    </button>
  );
}

export function ExercisesPage() {
  const profile = useProfile();
  const l = useL();
  const [s, setS] = useState<ExerciseSettings>(() => {
    try {
      const raw = localStorage.getItem('earlab.exercise');
      return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<ExerciseSettings>) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });
  const rng = useRef(createRng(Date.now() & 0xffffffff));
  const [q, setQ] = useState<ExerciseQuestion | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [played, setPlayed] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState<{ ok: boolean; label: string }[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem('earlab.exercise', JSON.stringify(s));
    } catch {
      /* storage blocked: settings just reset next time */
    }
  }, [s]);

  const set = (patch: Partial<ExerciseSettings>) => {
    setS((prev) => {
      const nextS = { ...prev, ...patch };
      if (!MODES_BY_TOPIC[nextS.topic].includes(nextS.mode)) nextS.mode = MODES_BY_TOPIC[nextS.topic][0]!;
      return nextS;
    });
    setQ(null);
    setPicked(null);
    setPlayed([]);
    setStreak(0);
  };

  const newQuestion = useCallback(async () => {
    const question = makeExercise(s, rng.current);
    setQ(question);
    setPicked(null);
    setPlayed([]);
    if (s.topic === 'rhythm') return;
    if (s.mode === 'play' && question.given) {
      await play({ steps: [{ notes: question.given, at: 0, duration: 1 }] });
      await play(question.sound);
    } else await play(question.sound);
  }, [s]);

  const record = async (ok: boolean, label: string) => {
    const nextStreak = ok ? streak + 1 : 0;
    setStreak(nextStreak);
    setHistory((h) => [{ ok, label }, ...h].slice(0, 10));
    const exerciseId = `${s.topic}:${s.mode}`;
    const prev = await db.exerciseBests.get([profile.id!, exerciseId]);
    await db.exerciseBests.put({
      profileId: profile.id!,
      exerciseId,
      bestStreak: Math.max(prev?.bestStreak ?? 0, nextStreak),
      answered: (prev?.answered ?? 0) + 1,
      correct: (prev?.correct ?? 0) + (ok ? 1 : 0),
    });
  };

  const choose = (id: string) => {
    if (!q || picked) return;
    setPicked(id);
    void record(id === q.answerId, q.options.find((o) => o.id === q.answerId)?.label ?? '');
  };

  const onNote = (midi: number) => {
    if (!q?.target || picked || s.mode !== 'play') return;
    const notes = [...played, midi];
    setPlayed(notes);
    if (q.target.ordered && notes.length >= q.target.notes.length) {
      const ok = checkPlayed(notes, q.target);
      setPicked(ok ? q.answerId : '__wrong');
      void record(ok, q.answerId);
    }
  };
  const onChord = (notes: number[]) => {
    if (!q?.target || picked || s.mode !== 'play' || q.target.ordered) return;
    setPlayed(notes);
    const ok = checkPlayed(notes, q.target);
    setPicked(ok ? q.answerId : '__wrong');
    void record(ok, q.answerId);
  };

  const marks: Record<number, KeyMark> = {};
  if (q && s.mode === 'play') {
    for (const n of q.given ?? []) marks[n] = 'hint';
    for (const n of played) marks[n] = picked ? (picked === q.answerId ? 'correct' : 'wrong') : 'selected';
  }

  const selectionChips = () => {
    if (s.topic === 'intervals') {
      return (
        <div>
          <span className="label">{l(`Quãng (${s.intervals.length} đã chọn, tối thiểu 3)`, `Intervals (${s.intervals.length} selected, min 3)`)}</span>
          <div className="grid grid-cols-6 gap-1.5">
            {INTERVALS.map((iv) => {
              const on = s.intervals.includes(iv.id);
              return (
                <button
                  key={iv.id}
                  type="button"
                  aria-pressed={on}
                  title={localName(iv.name, l.lang)}
                  onClick={() => set({ intervals: on ? (s.intervals.length > 3 ? s.intervals.filter((x) => x !== iv.id) : s.intervals) : [...s.intervals, iv.id as IntervalId] })}
                  className={`min-h-11 rounded-[10px] border text-sm font-semibold ${on ? 'border-accent bg-accent/15 text-ink' : 'border-line bg-bg text-muted'}`}
                >
                  {iv.id}
                </button>
              );
            })}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button type="button" className="btn btn-sm" onClick={() => set({ intervals: INTERVALS.slice(1, 13).map((i) => i.id) })}>{l('Quãng đơn', 'Simple')}</button>
            <button type="button" className="btn btn-sm" onClick={() => set({ intervals: INTERVALS.slice(12).map((i) => i.id) })}>{l('Quãng kép', 'Compound')}</button>
            <button type="button" className="btn btn-sm" onClick={() => set({ intervals: INTERVALS.map((i) => i.id) })}>{l('Tất cả', 'All')}</button>
          </div>
        </div>
      );
    }
    if (s.topic === 'chords') {
      return (
        <div>
          <span className="label">{l(`Hợp âm (${s.chords.length} đã chọn)`, `Chords (${s.chords.length} selected)`)}</span>
          <div className="flex max-h-56 flex-wrap gap-1.5 overflow-y-auto">
            {CHORD_ORDER.map((id) => {
              const on = s.chords.includes(id);
              const def = getChord(id);
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  title={localName(def.name, l.lang)}
                  onClick={() => set({ chords: on ? (s.chords.length > 2 ? s.chords.filter((x) => x !== id) : s.chords) : [...s.chords, id] })}
                  className={`min-h-9 rounded-lg border px-2.5 text-[13px] font-semibold ${on ? 'border-accent bg-accent/15 text-ink' : 'border-line bg-bg text-muted'}`}
                >
                  {def.symbol || 'M'}
                </button>
              );
            })}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {[3, 4, 5, 6].map((n) => (
              <button key={n} type="button" className="btn btn-sm" onClick={() => set({ chords: CHORDS.filter((c) => c.formula.length === n).map((c) => c.id) })}>
                {l(`${n} nốt`, `${n} notes`)}
              </button>
            ))}
          </div>
        </div>
      );
    }
    if (s.topic === 'scales') {
      return (
        <div>
          <span className="label">{l('Âm giai', 'Scales')}</span>
          <div className="flex flex-wrap gap-1.5">
            {SCALE_ORDER.map((id) => {
              const on = s.scales.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set({ scales: on ? (s.scales.length > 2 ? s.scales.filter((x) => x !== id) : s.scales) : [...s.scales, id] })}
                  className={`min-h-9 rounded-lg border px-2.5 text-[13px] font-semibold ${on ? 'border-accent bg-accent/15 text-ink' : 'border-line bg-bg text-muted'}`}
                >
                  {localName(getScale(id).name, l.lang)}
                </button>
              );
            })}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button type="button" className="btn btn-sm" onClick={() => set({ scales: SCALE_ORDER.filter((id) => getScale(id).group === 'primary') })}>{l('Chính', 'Primary')}</button>
            <button type="button" className="btn btn-sm" onClick={() => set({ scales: SCALE_ORDER.filter((id) => getScale(id).group === 'secondary') })}>{l('Phụ', 'Secondary')}</button>
          </div>
        </div>
      );
    }
    if (s.topic === 'progressions') {
      return (
        <div className="grid grid-cols-2 gap-4">
          <label><span className="label">{l('Giọng', 'Key')}</span>
            <select className="field" value={s.progressionKey} onChange={(e) => set({ progressionKey: e.target.value as 'major' | 'minor' })}>
              <option value="major">{l('Trưởng', 'Major')}</option>
              <option value="minor">{l('Thứ', 'Minor')}</option>
            </select>
          </label>
          <label><span className="label">{l('Độ dài', 'Length')}</span>
            <select className="field" value={s.progressionLength} onChange={(e) => set({ progressionLength: Number(e.target.value) })}>
              {[3, 4, 5, 6].map((n) => <option key={n} value={n}>{l(`${n} hợp âm`, `${n} chords`)}</option>)}
            </select>
          </label>
        </div>
      );
    }
    if (s.topic === 'rhythm') {
      return (
        <div className="grid grid-cols-2 gap-4">
          <label><span className="label">{l('Số chỉ nhịp', 'Time signature')}</span>
            <select className="field" value={s.rhythmBeats} onChange={(e) => set({ rhythmBeats: Number(e.target.value) })}>
              {[4, 3, 5].map((b) => <option key={b} value={b}>{b}/4</option>)}
            </select>
          </label>
          <label><span className="label">{l('Độ khó', 'Difficulty')}</span>
            <select className="field" value={s.rhythmDifficulty} onChange={(e) => set({ rhythmDifficulty: e.target.value as ExerciseSettings['rhythmDifficulty'] })}>
              <option value="easy">{l('Dễ: đen, móc đơn', 'Easy: quarters, eighths')}</option>
              <option value="medium">{l('Vừa: dấu lặng, nghịch phách', 'Medium: rests, syncopation')}</option>
              <option value="hard">{l('Khó: chấm dôi, móc kép', 'Hard: dotted notes, sixteenths')}</option>
            </select>
          </label>
        </div>
      );
    }
    return (
      <label><span className="label">{l('Độ khó', 'Difficulty')}</span>
        <select className="field" value={s.pitchDifficulty} onChange={(e) => set({ pitchDifficulty: e.target.value as ExerciseSettings['pitchDifficulty'] })}>
          <option value="easy">{l('Dễ (cách xa)', 'Easy (far apart)')}</option>
          <option value="medium">{l('Vừa', 'Medium')}</option>
          <option value="hard">{l('Khó (nửa cung)', 'Hard (a semitone)')}</option>
        </select>
      </label>
    );
  };

  const showDirection = s.topic === 'intervals' || s.topic === 'chords' || s.topic === 'scales';
  const answered = picked !== null;
  const ok = answered && picked === q?.answerId;
  const circumference = 2 * Math.PI * 27;

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label={l('Loại bài tập', 'Exercise type')} className="flex flex-wrap gap-2">
        {TOPICS.map((t) => {
          const on = s.topic === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => set({ topic: t.id })}
              className={`min-h-11 rounded-full border px-[18px] text-sm font-semibold ${on ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-surface text-ink-2'}`}
            >
              {l(t.vi, t.en)}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <section className="card flex flex-[1_1_380px] flex-col gap-5" aria-label={l('Cài đặt bài tập', 'Exercise settings')}>
          <div>
            <span className="label">{l('Chế độ', 'Mode')}</span>
            <div className="flex flex-wrap gap-1.5">
              {MODES_BY_TOPIC[s.topic].map((m) => (
                <Pill key={m} on={s.mode === m} onClick={() => set({ mode: m })}>{l(MODE_NAMES[m][0], MODE_NAMES[m][1])}</Pill>
              ))}
            </div>
          </div>
          {selectionChips()}
          {showDirection && s.mode !== 'compare' && (
            <div>
              <span className="label">{l('Hướng', 'Direction')}</span>
              <div className="flex flex-wrap gap-1.5">
                {(['ascending', 'descending', 'harmonic', 'mix'] as Direction[])
                  .filter((d) => !(s.topic === 'scales' && d === 'harmonic'))
                  .map((d) => (
                    <Pill key={d} on={s.direction === d} onClick={() => set({ direction: d })}>
                      {{ ascending: l('Đi lên', 'Up'), descending: l('Đi xuống', 'Down'), harmonic: l('Cùng lúc', 'Together'), mix: l('Trộn', 'Mix') }[d]}
                    </Pill>
                  ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <label><span className="label">{l('Nốt gốc', 'Root')}</span>
              <select className="field" value={s.root} onChange={(e) => set({ root: e.target.value as RootChoice })}>
                <option value="natural">{l('Nốt tự nhiên', 'Naturals')}</option>
                <option value="sharp">{l('Có thăng', 'Sharps')}</option>
                <option value="flat">{l('Có giáng', 'Flats')}</option>
                <option value="fixed">{l('Cố định C4', 'Fixed C4')}</option>
              </select>
            </label>
            <label><span className="label">{l('Tốc độ', 'Speed')}</span>
              <select className="field" value={s.speed} onChange={(e) => set({ speed: e.target.value as Speed })}>
                <option value="slow">{l('Chậm', 'Slow')}</option>
                <option value="moderate">{l('Vừa', 'Moderate')}</option>
                <option value="fast">{l('Nhanh', 'Fast')}</option>
              </select>
            </label>
          </div>
        </section>

        <section className="card flex min-w-0 flex-[999_1_520px] flex-col gap-5" aria-label={l('Luyện tập', 'Practice')}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="label !mb-0">{l(MODE_NAMES[s.mode][0], MODE_NAMES[s.mode][1])} · {l(TOPICS.find((t) => t.id === s.topic)!.vi, TOPICS.find((t) => t.id === s.topic)!.en).toLowerCase()}</div>
              <h1 className="h-display mt-1.5 text-[26px] font-bold">
                {s.mode === 'tap'
                  ? l('Đọc tiết tấu, gõ đúng nhịp', 'Read the rhythm, tap it in time')
                  : s.mode === 'play'
                  ? l('Nghe rồi chơi lại trên piano', 'Listen, then play it on the piano')
                  : s.mode === 'compare'
                    ? s.topic === 'pitch' ? l('Nốt nào cao hơn?', 'Which note is higher?') : l('Quãng nào rộng hơn?', 'Which interval is wider?')
                    : l('Nghe và chọn đáp án', 'Listen and choose')}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <svg width="64" height="64" viewBox="0 0 64 64" role="img" aria-label={l(`Chuỗi đúng ${streak} trên mục tiêu ${GOAL}`, `Streak ${streak} of ${GOAL}`)}>
                <circle cx="32" cy="32" r="27" fill="none" style={{ stroke: 'var(--surface2)' }} strokeWidth="6" />
                <circle cx="32" cy="32" r="27" fill="none" stroke="#34d399" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${Math.min(1, streak / GOAL) * circumference} ${circumference}`} transform="rotate(-90 32 32)" />
                <text x="32" y="38" textAnchor="middle" style={{ fill: 'var(--ink)' }} fontFamily="Space Grotesk, sans-serif" fontSize="18" fontWeight="700">{streak}</text>
              </svg>
              <div className="text-[13px] leading-snug text-muted">{l('Chuỗi đúng', 'Streak')}<br /><strong className="text-ink">{l(`mục tiêu ${GOAL}`, `goal ${GOAL}`)}</strong></div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn !border-teal" onClick={() => (q ? void play(q.sound) : void newQuestion())}>▶ {q ? l('Nghe lại', 'Replay') : l('Bắt đầu', 'Start')}</button>
            {q?.given && <button type="button" className="btn" onClick={() => void play({ steps: [{ notes: q.given!, at: 0, duration: 1 }] })}>{l('Nốt gốc', 'Root note')}</button>}
            <button type="button" className={`btn ${answered ? 'btn-primary' : ''}`} onClick={() => void newQuestion()}>{l('Câu mới', 'New question')}</button>
          </div>

          {q?.rhythm && (
            <RhythmInput
              key={JSON.stringify(q.rhythm)}
              pattern={q.rhythm}
              bpm={RHYTHM_BPM[s.speed]}
              playFirst={false}
              showNotation
              toleranceMs={s.speed === 'fast' ? 90 : 120}
              latencyMs={profile.settings.tapLatencyMs ?? 0}
              theme={profile.settings.theme}
              onDone={(g) => {
                if (picked) return;
                setPicked(g.passed ? 'ok' : '__wrong');
                void record(g.passed, `${g.expected.filter((e) => e.hit).length}/${g.expected.length}`);
              }}
            />
          )}

          {q && !q.rhythm && s.mode !== 'play' && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {q.options.map((o) => {
                const style = answered
                  ? o.id === q.answerId ? 'border-good bg-good/10' : o.id === picked ? 'border-bad bg-bad/10' : 'border-line bg-surface-2'
                  : 'border-line bg-surface-2 hover:border-accent';
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => (answered ? void play(o.sound) : choose(o.id))}
                    className={`h-display min-h-14 rounded-xl border px-2 text-[17px] font-bold text-ink ${style}`}
                  >
                    {s.topic === 'scales' ? localName(getScale(o.id).name, l.lang) : o.label}
                  </button>
                );
              })}
            </div>
          )}

          {q && s.mode === 'play' && (
            <div className="space-y-2">
              <p className="text-sm text-muted">
                {s.topic === 'chords'
                  ? l('Giữ Ctrl và bấm các nốt của hợp âm, thả Ctrl để nộp. Nốt vàng là nốt gốc.', 'Hold Ctrl, click the chord notes, release Ctrl to submit. The yellow key is the root.')
                  : s.topic === 'scales'
                    ? l('Chơi lần lượt các nốt của âm giai đi lên, bắt đầu từ nốt vàng.', 'Play the scale going up, starting on the yellow key.')
                    : l('Nốt vàng là nốt đầu. Bấm nốt thứ hai.', 'The yellow key is the first note. Play the second one.')}
              </p>
              <PianoKeyboard from={36} to={84} marks={marks} onNote={onNote} onChord={onChord} naming={profile.settings.noteNaming} accidentals={profile.settings.accidentals} />
            </div>
          )}

          {answered && (
            <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${ok ? 'bg-good/10 text-good-ink' : 'bg-bad/10 text-bad-ink'}`}>
              {ok ? l('Chính xác!', 'Correct!') : l(`Chưa đúng. Đáp án: ${q?.options.find((o) => o.id === q.answerId)?.label ?? q?.answerId}`, `Not quite. Answer: ${q?.options.find((o) => o.id === q.answerId)?.label ?? q?.answerId}`)}
              {!ok && s.mode !== 'play' && <span className="ml-2 font-normal text-muted">{l('(bấm các phương án để nghe so sánh)', '(tap options to compare)')}</span>}
            </div>
          )}

          <div>
            <span className="label">{l('10 câu gần nhất', 'Last 10')}</span>
            <div className="flex flex-wrap gap-1.5">
              {history.length === 0 && <span className="text-sm text-muted">—</span>}
              {history.map((h, i) => (
                <span key={i} className={`inline-grid h-8 min-w-11 place-items-center rounded-lg px-2 text-xs font-semibold ${h.ok ? 'bg-good/15 text-good-ink' : 'bg-bad/15 text-bad-ink'}`}>
                  {h.label.length > 10 ? `${h.label.slice(0, 9)}…` : h.label}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
