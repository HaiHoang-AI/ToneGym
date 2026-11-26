import { useRef, useState } from 'react';
import { audio } from '../audio/engine';
import { useProfile } from '../app/ProfileContext';
import { useL } from '../app/useL';
import { Yumika } from '../components/art/Characters';
import { NoteInput } from '../components/NoteInput';
import { melodic } from '../games/sound';
import { createRng, generateMelody, getScale, localName, scaleNotes } from '../theory';

const SCALES = ['major', 'naturalMinor', 'dorian', 'mixolydian', 'harmonicMinor', 'majorPentatonic', 'lydian', 'phrygian'];
const LEVELS = [
  { vi: 'Cấp 1: 4 nốt, 5 bậc đầu', en: 'Level 1: 4 notes, first 5 degrees', length: 4, from: 0, to: 4, leap: 2 },
  { vi: 'Cấp 2: 6 nốt, một quãng tám', en: 'Level 2: 6 notes, one octave', length: 6, from: 0, to: 7, leap: 3 },
  { vi: 'Cấp 3: 8 nốt, rộng hơn', en: 'Level 3: 8 notes, wider range', length: 8, from: -3, to: 9, leap: 4 },
  { vi: 'Cấp 4: 10 nốt, nhảy xa', en: 'Level 4: 10 notes, big leaps', length: 10, from: -4, to: 11, leap: 5 },
];
const TEMPI = { slow: 0.8, moderate: 0.6, fast: 0.42 } as const;

/** Melody transcription trainer: hear a melody in any mode and write it down on the keyboard. */
export function MelodyPlaygroundPage() {
  const profile = useProfile();
  const l = useL();
  const rng = useRef(createRng(Date.now() & 0xffffffff));
  const [scale, setScale] = useState('major');
  const [level, setLevel] = useState(0);
  const [tempo, setTempo] = useState<keyof typeof TEMPI>('moderate');
  const [melody, setMelody] = useState<{ notes: number[]; palette: number[]; tonic: number } | null>(null);
  const [result, setResult] = useState<'ok' | 'bad' | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0, streak: 0 });

  const play = async (notes: number[]) => {
    audio.stop();
    await audio.start();
    await audio.playMelodic(notes, TEMPI[tempo]);
  };

  const next = async () => {
    const cfg = LEVELS[level]!;
    const tonic = rng.current.int(55, 62);
    const degrees = Array.from({ length: cfg.to - cfg.from + 1 }, (_, i) => cfg.from + i);
    const notes = generateMelody(rng.current, tonic, { length: cfg.length, scale, degrees, maxLeap: cfg.leap });
    setMelody({ notes, palette: scaleNotes(tonic, scale, cfg.from, cfg.to), tonic });
    setResult(null);
    await audio.start();
    audio.stop();
    await audio.playSequence([{ notes: [tonic], at: 0, duration: 0.9 }, ...melodic(notes, TEMPI[tempo], 1.2).steps]);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <Yumika mood={result === 'ok' ? 'cheer' : result === 'bad' ? 'oops' : 'wave'} size={88} outfit={profile.settings.mascotOutfit ?? 'casual'} />
        <div>
          <div className="label !mb-0">Playground</div>
          <h1 className="h-display mt-1 text-[32px] font-bold">{l('Chép giai điệu', 'Melody dictation')}</h1>
          <p className="mt-1 max-w-2xl text-muted">
            {l('Nghe nốt chủ âm rồi giai điệu, sau đó ghi lại từng nốt trên phím đàn. Chọn điệu thức, cấp độ và tốc độ tùy ý.', 'Hear the tonic, then the melody, and write it down note by note on the keyboard. Pick any mode, level and tempo.')}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <section className="card flex flex-[1_1_300px] flex-col gap-4">
          <label><span className="label">{l('Điệu thức', 'Mode')}</span>
            <select className="field" value={scale} onChange={(e) => setScale(e.target.value)}>
              {SCALES.map((id) => <option key={id} value={id}>{localName(getScale(id).name, l.lang)}</option>)}
            </select>
          </label>
          <label><span className="label">{l('Cấp độ', 'Level')}</span>
            <select className="field" value={level} onChange={(e) => setLevel(Number(e.target.value))}>
              {LEVELS.map((lv, i) => <option key={i} value={i}>{l(lv.vi, lv.en)}</option>)}
            </select>
          </label>
          <label><span className="label">{l('Tốc độ', 'Tempo')}</span>
            <select className="field" value={tempo} onChange={(e) => setTempo(e.target.value as keyof typeof TEMPI)}>
              <option value="slow">{l('Chậm', 'Slow')}</option>
              <option value="moderate">{l('Vừa', 'Moderate')}</option>
              <option value="fast">{l('Nhanh', 'Fast')}</option>
            </select>
          </label>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-surface-2 p-2"><div className="label !mb-0">{l('Đúng', 'Right')}</div><div className="h-display text-xl font-bold">{score.right}</div></div>
            <div className="rounded-xl bg-surface-2 p-2"><div className="label !mb-0">{l('Đã làm', 'Done')}</div><div className="h-display text-xl font-bold">{score.total}</div></div>
            <div className="rounded-xl bg-surface-2 p-2"><div className="label !mb-0">{l('Chuỗi', 'Streak')}</div><div className="h-display text-xl font-bold">{score.streak}</div></div>
          </div>
        </section>

        <section className="card flex min-w-0 flex-[999_1_520px] flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary" onClick={() => void next()}>{melody ? l('Giai điệu mới', 'New melody') : l('Bắt đầu', 'Start')}</button>
            {melody && <button type="button" className="btn" onClick={() => void play(melody.notes)}>▶ {l('Nghe lại', 'Replay')}</button>}
            {melody && <button type="button" className="btn" onClick={() => void play([melody.tonic])}>{l('Chủ âm', 'Tonic')}</button>}
          </div>
          {melody && (
            <NoteInput
              key={melody.notes.join(',')}
              length={melody.notes.length}
              palette={melody.palette}
              style="keyboard"
              naming={profile.settings.noteNaming}
              accidentals={profile.settings.accidentals}
              reveal={result ? melody.notes : undefined}
              disabled={result !== null}
              onDone={(notes) => {
                const ok = notes.every((n, i) => n === melody.notes[i]);
                setResult(ok ? 'ok' : 'bad');
                setScore((s) => ({ right: s.right + (ok ? 1 : 0), total: s.total + 1, streak: ok ? s.streak + 1 : 0 }));
              }}
            />
          )}
          {result && (
            <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${result === 'ok' ? 'bg-good/10 text-good-ink' : 'bg-bad/10 text-bad-ink'}`}>
              {result === 'ok' ? l('Chép đúng toàn bộ!', 'All notes right!') : l('Có nốt sai — đáp án hiện dưới các ô đỏ.', 'Some notes are off — the answer is under the red slots.')}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
