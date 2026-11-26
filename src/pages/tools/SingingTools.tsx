import { useEffect, useRef, useState } from 'react';
import { audio } from '../../audio/engine';
import { fitToRange, VOICE_RANGES, type VoiceType } from '../../audio/pitchMath';
import { useProfile } from '../../app/ProfileContext';
import { useL } from '../../app/useL';
import { SingInput, type SingResult } from '../../components/SingInput';
import { Staff } from '../../components/Staff';
import { createRng, degreeToMidi, displayNoteName, generateMelody, midiToName } from '../../theory';
import { ToolShell } from './ToolsPage';

const LEVELS = [
  { vi: 'Cơ bản', en: 'Beginner', length: 4, degrees: [0, 1, 2, 3, 4], leap: 2, tolerance: 50 },
  { vi: 'Trung bình', en: 'Intermediate', length: 6, degrees: [0, 1, 2, 3, 4, 5, 6, 7], leap: 3, tolerance: 40 },
  { vi: 'Nâng cao', en: 'Advanced', length: 8, degrees: [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8], leap: 4, tolerance: 35 },
  { vi: 'Étude', en: 'Étude', length: 12, degrees: [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9], leap: 5, tolerance: 30 },
];

const VOICES: { id: VoiceType | 'mine'; vi: string; en: string }[] = [
  { id: 'mine', vi: 'Tầm giọng của tôi', en: 'My range' },
  { id: 'bass', vi: 'Bass', en: 'Bass' },
  { id: 'baritone', vi: 'Baritone', en: 'Baritone' },
  { id: 'tenor', vi: 'Tenor', en: 'Tenor' },
  { id: 'alto', vi: 'Alto', en: 'Alto' },
  { id: 'mezzo', vi: 'Mezzo', en: 'Mezzo' },
  { id: 'soprano', vi: 'Soprano', en: 'Soprano' },
];

export function SightSingingTool() {
  const l = useL();
  const profile = useProfile();
  const rng = useRef(createRng(Date.now() & 0xffffffff));
  const [voice, setVoice] = useState<VoiceType | 'mine'>('mine');
  const [level, setLevel] = useState(0);
  const [melody, setMelody] = useState<number[] | null>(null);
  const [result, setResult] = useState<SingResult | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0 });

  const range = voice === 'mine' ? profile.settings.vocalRange : { low: VOICE_RANGES[voice][0] + 3, high: VOICE_RANGES[voice][1] - 3 };

  const next = async () => {
    const cfg = LEVELS[level]!;
    const tonic = rng.current.int(range.low + 3, Math.max(range.low + 4, range.high - 9));
    const raw = generateMelody(rng.current, tonic, { length: cfg.length, scale: 'major', degrees: cfg.degrees, maxLeap: cfg.leap });
    const notes = fitToRange(raw, range.low, range.high);
    setMelody(notes);
    setResult(null);
    await audio.start();
    audio.stop();
    // Tonic triad then the first note, so the key is clear.
    const shift = notes[0]! - raw[0]!;
    const t = tonic + shift;
    await audio.playSequence([
      { notes: [t, degreeToMidi(t, 'major', 2), degreeToMidi(t, 'major', 4)], at: 0, duration: 1.2 },
      { notes: [notes[0]!], at: 1.4, duration: 1 },
    ]);
  };

  const clef = (range.low + range.high) / 2 < 57 ? 'bass' : 'treble';

  return (
    <ToolShell id="sight-singing">
      <div className="flex flex-wrap items-start gap-6">
        <section className="card flex flex-[1_1_280px] flex-col gap-4">
          <label><span className="label">{l('Loại giọng', 'Voice')}</span>
            <select className="field" value={voice} onChange={(e) => setVoice(e.target.value as VoiceType | 'mine')}>
              {VOICES.map((v) => <option key={v.id} value={v.id}>{l(v.vi, v.en)}</option>)}
            </select>
          </label>
          <label><span className="label">{l('Cấp độ', 'Level')}</span>
            <select className="field" value={level} onChange={(e) => setLevel(Number(e.target.value))}>
              {LEVELS.map((lv, i) => <option key={i} value={i}>{l(lv.vi, lv.en)} · {lv.length} {l('nốt', 'notes')}</option>)}
            </select>
          </label>
          <div className="rounded-xl bg-surface-2 p-3 text-center">
            <div className="label !mb-0">{l('Đúng / đã hát', 'Right / sung')}</div>
            <div className="h-display text-2xl font-bold">{score.right} / {score.total}</div>
          </div>
        </section>
        <section className="card flex min-w-0 flex-[999_1_520px] flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary" onClick={() => void next()}>{melody ? l('Bài mới', 'New exercise') : l('Bắt đầu', 'Start')}</button>
            {melody && <button type="button" className="btn" onClick={() => void audio.start().then(() => audio.playNotes([melody[0]!], 1.2))}>{l('Nốt đầu', 'First note')}</button>}
            {melody && result && <button type="button" className="btn" onClick={() => void audio.start().then(() => audio.playMelodic(melody, 0.7))}>▶ {l('Nghe đáp án', 'Hear it')}</button>}
          </div>
          {melody && (
            <>
              <div className="rounded-xl bg-surface-2 py-2">
                <Staff spec={{ clef, stacks: melody.map((n) => [midiToName(n, profile.settings.accidentals)]) }} theme={profile.settings.theme} />
              </div>
              <SingInput
                key={melody.join(',')}
                targets={melody}
                toleranceCents={LEVELS[level]!.tolerance}
                octaveFree
                showNames={false}
                naming={profile.settings.noteNaming}
                accidentals={profile.settings.accidentals}
                disabled={!!result}
                onDone={(r) => {
                  setResult(r);
                  setScore((s) => ({ right: s.right + (r.passed ? 1 : 0), total: s.total + 1 }));
                }}
              />
              {result && (
                <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${result.passed ? 'bg-good/10 text-good-ink' : 'bg-bad/10 text-bad-ink'}`}>
                  {result.passed ? l('Hát chuẩn cả bài!', 'Every note in tune!') : l(`${result.notes.filter((n) => n.ok).length}/${result.notes.length} nốt đúng`, `${result.notes.filter((n) => n.ok).length}/${result.notes.length} notes right`)}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </ToolShell>
  );
}

interface Warmup {
  id: string;
  name: { vi: string; en: string };
  /** Semitones above the key note. */
  pattern: number[];
  bpm: number;
  vowel: string;
  custom?: boolean;
}

/** Common, generic warm-up shapes (scale fragments and arpeggios). */
const PRESETS: Warmup[] = [
  { id: 'hum5', name: { vi: 'Ngân 5 nốt (hum)', en: 'Five-note hum' }, pattern: [0, 2, 4, 5, 7, 5, 4, 2, 0], bpm: 100, vowel: 'mm' },
  { id: 'lip', name: { vi: 'Rung môi 1-3-5', en: 'Lip trill 1-3-5' }, pattern: [0, 4, 7, 4, 0], bpm: 90, vowel: 'brr' },
  { id: 'arp8', name: { vi: 'Rải hợp âm lên quãng tám', en: 'Octave arpeggio' }, pattern: [0, 4, 7, 12, 7, 4, 0], bpm: 96, vowel: 'a' },
  { id: 'scale9', name: { vi: 'Âm giai 9 nốt', en: 'Nine-note scale' }, pattern: [0, 2, 4, 5, 7, 9, 11, 12, 14, 12, 11, 9, 7, 5, 4, 2, 0], bpm: 120, vowel: 'i' },
  { id: 'thirds', name: { vi: 'Quãng ba nối nhau', en: 'Linked thirds' }, pattern: [0, 4, 2, 5, 4, 7, 5, 2, 0], bpm: 104, vowel: 'o' },
  { id: 'sustain', name: { vi: 'Ngân dài một nốt', en: 'Long tone' }, pattern: [0, 0, 0, 0], bpm: 60, vowel: 'u' },
  { id: 'octave-jump', name: { vi: 'Nhảy quãng tám', en: 'Octave jump' }, pattern: [0, 12, 11, 9, 7, 5, 4, 2, 0], bpm: 100, vowel: 'e' },
  { id: 'ng', name: { vi: 'Âm "ng" lên xuống', en: '"Ng" slide' }, pattern: [0, 7, 0], bpm: 72, vowel: 'ng' },
];

const loadCustom = (): Warmup[] => {
  try {
    return JSON.parse(localStorage.getItem('earlab.warmups') ?? '[]') as Warmup[];
  } catch {
    return [];
  }
};

export function WarmupTool() {
  const l = useL();
  const profile = useProfile();
  const [custom, setCustom] = useState<Warmup[]>(loadCustom);
  const [selected, setSelected] = useState<Warmup>(PRESETS[0]!);
  const [steps, setSteps] = useState(6);
  const [current, setCurrent] = useState<{ key: number; rep: number } | null>(null);
  const [draft, setDraft] = useState({ name: '', pattern: '0 2 4 2 0', bpm: 100, vowel: 'a' });
  const playing = useRef(false);
  const name = (m: number) => displayNoteName(midiToName(m, profile.settings.accidentals), profile.settings.noteNaming);

  useEffect(() => {
    try {
      localStorage.setItem('earlab.warmups', JSON.stringify(custom));
    } catch {
      /* storage blocked */
    }
  }, [custom]);
  useEffect(() => () => {
    playing.current = false;
    audio.stop();
  }, []);

  const run = async (w: Warmup) => {
    await audio.start();
    audio.stop();
    playing.current = true;
    const span = Math.max(...w.pattern);
    const low = profile.settings.vocalRange.low;
    const top = profile.settings.vocalRange.high - span;
    const beat = 60 / w.bpm;
    for (let i = 0; i < steps && playing.current; i++) {
      const key = Math.min(top, low + i);
      setCurrent({ key, rep: i + 1 });
      // Cue chord, then the pattern with a soft accompaniment on the key note.
      await audio.playSequence([
        { notes: [key - 12, key, key + 4, key + 7], at: 0, duration: beat * 1.6, velocity: 0.5 },
        ...w.pattern.map((s, k) => ({ notes: [key + s], at: beat * 2 + k * beat, duration: beat * 0.95 })),
      ]);
      if (key >= top) break;
    }
    playing.current = false;
    setCurrent(null);
  };

  const all = [...PRESETS, ...custom];
  const saveDraft = () => {
    const pattern = draft.pattern.split(/[\s,]+/).map(Number).filter((n) => Number.isFinite(n) && n >= -12 && n <= 24);
    if (pattern.length < 2 || !draft.name.trim()) return;
    const w: Warmup = { id: `c${Date.now()}`, name: { vi: draft.name.trim(), en: draft.name.trim() }, pattern, bpm: draft.bpm, vowel: draft.vowel, custom: true };
    setCustom((c) => [...c, w]);
    setSelected(w);
  };

  return (
    <ToolShell id="warmup">
      <div className="flex flex-wrap items-start gap-6">
        <section className="card flex flex-[1_1_320px] flex-col gap-3">
          <span className="label">{l('Bài khởi động', 'Warm-ups')}</span>
          {all.map((w) => (
            <div key={w.id} className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${selected.id === w.id ? 'border-accent bg-accent/10' : 'border-line bg-surface-2'}`}>
              <button type="button" className="flex-1 text-left" onClick={() => setSelected(w)}>
                <div className="font-semibold">{l(w.name)}</div>
                <div className="text-xs text-muted">{w.bpm} bpm · “{w.vowel}” · {w.pattern.length} {l('nốt', 'notes')}</div>
              </button>
              {w.custom && <button type="button" className="btn btn-sm" onClick={() => setCustom((c) => c.filter((x) => x.id !== w.id))}>{l('Xóa', 'Delete')}</button>}
            </div>
          ))}
        </section>
        <section className="card flex min-w-0 flex-[999_1_480px] flex-col gap-4">
          <h2 className="h-display text-2xl font-bold">{l(selected.name)}</h2>
          <p className="text-muted">
            {l(`Hát nguyên âm “${selected.vowel}”. Mỗi lượt bắt đầu bằng hợp âm gợi ý rồi nâng lên nửa cung, trong tầm giọng của bạn (${name(profile.settings.vocalRange.low)}–${name(profile.settings.vocalRange.high)}).`, `Sing on “${selected.vowel}”. Each round starts with a cue chord and moves up a semitone, inside your range (${name(profile.settings.vocalRange.low)}–${name(profile.settings.vocalRange.high)}).`)}
          </p>
          <label className="flex items-center gap-3 text-sm"><span className="label !mb-0">{l('Số lượt', 'Rounds')}</span>
            <input type="range" min={1} max={12} value={steps} onChange={(e) => setSteps(Number(e.target.value))} className="flex-1 accent-[#f4b740]" /> {steps}
          </label>
          <div className="flex flex-wrap items-center gap-3">
            {current ? (
              <button type="button" className="btn" onClick={() => { playing.current = false; audio.stop(); setCurrent(null); }}>■ {l('Dừng', 'Stop')}</button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => void run(selected)}>▶ {l('Bắt đầu', 'Start')}</button>
            )}
            {current && <span className="font-semibold" aria-live="polite">{l(`Lượt ${current.rep}: giọng ${name(current.key)}`, `Round ${current.rep}: key ${name(current.key)}`)}</span>}
          </div>
          <div className="rounded-xl border border-line bg-surface-2 p-4">
            <span className="label">{l('Tự tạo bài', 'Make your own')}</span>
            <div className="grid gap-3 sm:grid-cols-2">
              <label><span className="label">{l('Tên', 'Name')}</span><input className="field" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} maxLength={40} /></label>
              <label><span className="label">{l('Nguyên âm', 'Vowel')}</span><input className="field" value={draft.vowel} onChange={(e) => setDraft({ ...draft, vowel: e.target.value })} maxLength={8} /></label>
              <label className="sm:col-span-2"><span className="label">{l('Mẫu (số nửa cung tính từ nốt gốc)', 'Pattern (semitones from the key note)')}</span><input className="field" value={draft.pattern} onChange={(e) => setDraft({ ...draft, pattern: e.target.value })} /></label>
              <label><span className="label">Tempo (bpm)</span><input type="number" className="field" min={40} max={200} value={draft.bpm} onChange={(e) => setDraft({ ...draft, bpm: Number(e.target.value) || 100 })} /></label>
            </div>
            <button type="button" className="btn mt-3" onClick={saveDraft} disabled={!draft.name.trim()}>{l('Lưu bài', 'Save')}</button>
          </div>
        </section>
      </div>
    </ToolShell>
  );
}
