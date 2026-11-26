import { useEffect, useMemo, useRef, useState } from 'react';
import { audio } from '../../audio/engine';
import { useProfile } from '../../app/ProfileContext';
import { useL } from '../../app/useL';
import { MidiButton } from '../../components/MidiButton';
import { PianoKeyboard, type KeyMark } from '../../components/PianoKeyboard';
import {
  buildChord, buildScale, CHORDS, getChord, getScale, invert, localName, midiToName, parseProgression, pitchClass,
  PROGRESSIONS, realizeProgression, SCALES, scalesContaining, spellChord,
} from '../../theory';
import { useToolData } from '../../tools/useToolData';
import { ToolShell } from './ToolsPage';

const TONICS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const tonicMidi = (name: string) => 60 + ({ C: 0, 'C#': 1, Db: 1, D: 2, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 } as Record<string, number>)[name]!;

function useNaming() {
  const profile = useProfile();
  return { naming: profile.settings.noteNaming, accidentals: profile.settings.accidentals };
}

const highlight = (notes: readonly number[], mark: KeyMark = 'active') => Object.fromEntries(notes.map((n) => [n, mark])) as Record<number, KeyMark>;

// ── Progression generator ────────────────────────────────────────────────────────────
type PlayStyle = 'block' | 'up' | 'down';

export function ProgressionTool() {
  const l = useL();
  const naming = useNaming();
  const [tonic, setTonic] = useState('C');
  const [bpm, setBpm] = useState(90);
  const [style, setStyle] = useState<PlayStyle>('block');
  const [numerals, setNumerals] = useState('I-V-vi-IV');
  const [active, setActive] = useState<number | null>(null);
  const [loop, setLoop] = useState(false);
  const [saved, setSaved] = useToolData<{ name: string; numerals: string }[]>('progressions', []);
  const [name, setName] = useState('');
  const looping = useRef(false);

  const parsed = useMemo(() => {
    try {
      return realizeProgression(parseProgression(numerals), tonicMidi(tonic));
    } catch {
      return null;
    }
  }, [numerals, tonic]);

  const play = async () => {
    if (!parsed) return;
    await audio.start();
    audio.stop();
    const beat = 60 / bpm;
    looping.current = loop;
    do {
      const steps = parsed.flatMap((c, i) => {
        const at = i * beat * 2;
        if (style === 'block') return [{ notes: c.notes, at, duration: beat * 2 }];
        const ordered = style === 'up' ? c.notes : [...c.notes].reverse();
        return ordered.map((n, k) => ({ notes: [n], at: at + (k * beat * 2) / ordered.length, duration: beat * 1.5 }));
      });
      await audio.playSequence(steps, (i) => {
        const chordIndex = style === 'block' ? i : Math.floor(i / parsed[0]!.notes.length);
        setActive(chordIndex);
      });
    } while (looping.current);
    setActive(null);
  };

  const stop = () => {
    looping.current = false;
    audio.stop();
    setActive(null);
  };
  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const chordName = (c: NonNullable<typeof parsed>[number]) =>
    `${midiToName(tonicMidi(tonic) + c.roman.offset, naming.accidentals, false)}${c.roman.chord.symbol}`;
  const NUMERALS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°', 'V7', 'ii7', 'Imaj7', 'i', 'iv', 'v', 'bIII', 'bVI', 'bVII', 'V6', 'I6/4'];

  return (
    <ToolShell id="progressions">
      <section className="card flex flex-col gap-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1"><span className="label !mb-0">{l('Chủ âm', 'Tonic')}</span>
            <select className="field !w-auto" value={tonic} onChange={(e) => setTonic(e.target.value)}>{TONICS.map((t) => <option key={t}>{t}</option>)}</select>
          </label>
          <label className="flex flex-col gap-1"><span className="label !mb-0">Tempo</span>
            <select className="field !w-auto" value={bpm} onChange={(e) => setBpm(Number(e.target.value))}>{[60, 70, 80, 90, 100, 110, 120, 130, 140].map((b) => <option key={b} value={b}>{b} bpm</option>)}</select>
          </label>
          <label className="flex flex-col gap-1"><span className="label !mb-0">{l('Kiểu phát', 'Style')}</span>
            <select className="field !w-auto" value={style} onChange={(e) => setStyle(e.target.value as PlayStyle)}>
              <option value="block">{l('Cùng lúc', 'Block')}</option>
              <option value="up">{l('Rải lên', 'Arpeggio up')}</option>
              <option value="down">{l('Rải xuống', 'Arpeggio down')}</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5 accent-[#f4b740]" checked={loop} onChange={(e) => setLoop(e.target.checked)} /> {l('Lặp lại', 'Loop')}</label>
        </div>
        <label><span className="label">{l('Vòng hợp âm (ký hiệu La Mã)', 'Progression (Roman numerals)')}</span>
          <input className="field" value={numerals} onChange={(e) => setNumerals(e.target.value)} />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {NUMERALS.map((n) => <button key={n} type="button" className="btn btn-sm" onClick={() => setNumerals((v) => (v.trim() ? `${v}-${n}` : n))}>{n}</button>)}
          <button type="button" className="btn btn-sm" onClick={() => setNumerals((v) => v.split('-').slice(0, -1).join('-'))}>⌫</button>
        </div>
        {parsed ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {parsed.map((c, i) => (
              <button key={i} type="button" onClick={() => void audio.start().then(() => audio.playNotes(c.notes, 1.6))} className={`flex min-h-[76px] flex-col items-start gap-0.5 rounded-xl border-2 px-4 py-3 text-left ${active === i ? 'border-accent bg-accent/15' : 'border-line bg-surface-2'}`}>
                <span className="text-[13px] text-muted">{c.roman.text}</span>
                <span className="h-display text-2xl font-bold">{chordName(c)}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-bad-ink">{l('Ký hiệu chưa hợp lệ. Ví dụ: I-IV-V-I, ii7-V7-Imaj7, i-bVI-bIII-bVII.', 'Invalid numerals. Example: I-IV-V-I, ii7-V7-Imaj7, i-bVI-bIII-bVII.')}</p>
        )}
        <PianoKeyboard from={36} to={84} marks={active !== null && parsed ? highlight(parsed[active]!.notes) : {}} {...naming} />
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-primary" disabled={!parsed} onClick={() => void play()}>▶ {l('Phát vòng', 'Play')}</button>
          <button type="button" className="btn" onClick={stop}>■ {l('Dừng', 'Stop')}</button>
          <input className="field !w-48" placeholder={l('Tên vòng', 'Name')} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
          <button type="button" className="btn" disabled={!parsed || !name.trim()} onClick={() => void setSaved([...saved, { name: name.trim(), numerals }]).then(() => setName(''))}>{l('Lưu vào "Vòng của tôi"', 'Save to "My progressions"')}</button>
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <span className="label">{l('Vòng mẫu', 'Presets')}</span>
          <div className="flex flex-col gap-1.5">
            {PROGRESSIONS.map((p) => (
              <button key={p.id} type="button" onClick={() => setNumerals(p.numerals)} className="flex justify-between rounded-lg border border-line bg-surface-2 px-3 py-2 text-left text-sm hover:border-accent">
                <span className="font-semibold">{l(p.name)}</span><span className="text-muted">{p.numerals.split('-').join(' – ')}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="card">
          <span className="label">{l('Vòng của tôi', 'My progressions')}</span>
          {saved.length === 0 && <p className="text-sm text-muted">{l('Chưa lưu vòng nào.', 'Nothing saved yet.')}</p>}
          <div className="flex flex-col gap-1.5">
            {saved.map((p, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm">
                <button type="button" className="flex flex-1 justify-between text-left" onClick={() => setNumerals(p.numerals)}>
                  <span className="font-semibold">{p.name}</span><span className="text-muted">{p.numerals}</span>
                </button>
                <button type="button" className="btn btn-sm" onClick={() => void setSaved(saved.filter((_, k) => k !== i))}>{l('Xóa', 'Delete')}</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </ToolShell>
  );
}

// ── Circle of fifths ─────────────────────────────────────────────────────────────────
const CIRCLE = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
const ENHARMONIC: Record<string, string> = { 'F#': 'Gb', Db: 'C#', B: 'Cb' };
const MODES = [
  { id: 'major', vi: 'Ionian (trưởng)', en: 'Ionian (major)', shift: 0 },
  { id: 'dorian', vi: 'Dorian', en: 'Dorian', shift: 2 },
  { id: 'phrygian', vi: 'Phrygian', en: 'Phrygian', shift: 4 },
  { id: 'lydian', vi: 'Lydian', en: 'Lydian', shift: -1 },
  { id: 'mixolydian', vi: 'Mixolydian', en: 'Mixolydian', shift: 1 },
  { id: 'naturalMinor', vi: 'Aeolian (thứ)', en: 'Aeolian (minor)', shift: 3 },
  { id: 'locrian', vi: 'Locrian', en: 'Locrian', shift: 5 },
];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

/** Triad and seventh quality on each degree of a 7-note scale, by stacking thirds. */
function diatonicChords(rootMidi: number, scaleId: string) {
  const f = getScale(scaleId).formula;
  const at = (d: number) => rootMidi + f[d % 7]! + 12 * Math.floor(d / 7);
  return f.map((_, d) => {
    const triad = [at(d), at(d + 2), at(d + 4)];
    const seventh = [...triad, at(d + 6)];
    const iv = (n: number[]) => n.map((x) => x - n[0]!);
    const tri = CHORDS.find((c) => c.formula.length === 3 && c.formula.every((s, i) => s === iv(triad)[i]));
    const sev = CHORDS.find((c) => c.formula.length === 4 && c.formula.every((s, i) => s === iv(seventh)[i]));
    return { degree: d, triad, seventh, tri, sev };
  });
}

export function CircleTool() {
  const l = useL();
  const naming = useNaming();
  const [tonic, setTonic] = useState('C');
  const [mode, setMode] = useState('major');
  const [layout, setLayout] = useState<'scale' | 'intervals'>('scale');
  const [lit, setLit] = useState<number[]>([]);
  const m = MODES.find((x) => x.id === mode)!;
  const root = tonicMidi(tonic.length > 1 && !TONICS.includes(tonic) ? ENHARMONIC[tonic]! : tonic) - 12;
  const chords = diatonicChords(root, mode);
  // Key signature: position of the parent major key on the circle (sharps clockwise, flats anticlockwise).
  const parentIndex = (CIRCLE.indexOf(CIRCLE.find((c) => pitchClass(tonicMidi(c) ) === pitchClass(root))!) - m.shift + 12) % 12;
  const signature = parentIndex <= 6 ? `${parentIndex} ♯` : `${12 - parentIndex} ♭`;
  const play = async (notes: number[]) => {
    setLit(notes);
    await audio.start();
    audio.playNotes(notes, 1.6);
  };

  const size = 420;
  const c = size / 2;
  return (
    <ToolShell id="circle">
      <div className="flex flex-wrap items-start gap-6">
        <section className="card flex flex-[1_1_440px] flex-col items-center gap-4">
          <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size }} role="group" aria-label={l('Vòng quãng năm', 'Circle of fifths')}>
            <circle cx={c} cy={c} r={c - 6} fill="none" style={{ stroke: 'var(--line)' }} strokeWidth="2" />
            <circle cx={c} cy={c} r={c * 0.42} fill="none" style={{ stroke: 'var(--line)' }} strokeWidth="2" />
            {CIRCLE.map((k, i) => {
              const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
              const x = c + Math.cos(a) * c * 0.78;
              const y = c + Math.sin(a) * c * 0.78;
              const xi = c + Math.cos(a) * c * 0.56;
              const yi = c + Math.sin(a) * c * 0.56;
              const kMidi = tonicMidi(k) - 12;
              const degree = chords.findIndex((ch) => pitchClass(ch.triad[0]!) === pitchClass(kMidi));
              const isTonic = pitchClass(kMidi) === pitchClass(root);
              const rel = midiToName(kMidi + 9, 'flat', false);
              const label = layout === 'scale'
                ? degree >= 0 ? `${ROMAN[degree]}` : ''
                : `${(((kMidi - root) % 12) + 12) % 12}`;
              return (
                <g key={k}>
                  <circle
                    cx={x} cy={y} r={30}
                    fill={isTonic ? '#f4b740' : degree >= 0 ? '#39d0c033' : 'var(--surface2)'}
                    style={{ stroke: isTonic ? '#f4b740' : 'var(--line)', cursor: 'pointer' }}
                    strokeWidth="2"
                    role="button"
                    aria-label={`${k}${ENHARMONIC[k] ? ` / ${ENHARMONIC[k]}` : ''}`}
                    tabIndex={0}
                    onClick={(e) => {
                      if (e.ctrlKey || e.metaKey) setTonic(k);
                      else void play(e.altKey ? buildChord(kMidi + 12, getChord('maj7')) : buildChord(kMidi + 12, getChord('maj')));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void play(buildChord(kMidi + 12, getChord('maj')));
                    }}
                  />
                  <text x={x} y={y + 6} textAnchor="middle" fontSize="18" fontWeight="700" fontFamily="Space Grotesk, sans-serif" style={{ fill: isTonic ? '#1a1405' : 'var(--ink)', pointerEvents: 'none' }}>{k}</text>
                  <text x={xi} y={yi + 4} textAnchor="middle" fontSize="12" style={{ fill: 'var(--muted)', pointerEvents: 'none' }}>{rel}m</text>
                  {label && <text x={x} y={y - 34} textAnchor="middle" fontSize="12" fontWeight="700" style={{ fill: '#39d0c0', pointerEvents: 'none' }}>{label}</text>}
                </g>
              );
            })}
            <text x={c} y={c - 4} textAnchor="middle" fontSize="28" fontWeight="700" fontFamily="Space Grotesk, sans-serif" style={{ fill: 'var(--ink)' }}>{tonic}</text>
            <text x={c} y={c + 22} textAnchor="middle" fontSize="14" style={{ fill: 'var(--muted)' }}>{signature}</text>
          </svg>
          <p className="text-center text-xs text-muted">{l('Bấm: hợp âm 3 nốt · Alt+bấm: hợp âm 7 · Ctrl+bấm: đặt làm chủ âm', 'Click: triad · Alt+click: seventh · Ctrl+click: make it the tonic')}</p>
        </section>
        <section className="card flex min-w-0 flex-[1_1_360px] flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <label><span className="label">{l('Chủ âm', 'Tonic')}</span><select className="field" value={tonic} onChange={(e) => setTonic(e.target.value)}>{CIRCLE.map((k) => <option key={k}>{k}</option>)}</select></label>
            <label><span className="label">{l('Điệu thức', 'Mode')}</span><select className="field" value={mode} onChange={(e) => setMode(e.target.value)}>{MODES.map((x) => <option key={x.id} value={x.id}>{l(x.vi, x.en)}</option>)}</select></label>
          </div>
          <div className="flex gap-1.5">
            {(['scale', 'intervals'] as const).map((v) => <button key={v} type="button" className={`btn btn-sm ${layout === v ? '!border-teal' : ''}`} onClick={() => setLayout(v)}>{v === 'scale' ? l('Bậc (số La Mã)', 'Degrees') : l('Nửa cung', 'Semitones')}</button>)}
          </div>
          <span className="label !mb-0">{l('Hợp âm thuận giọng', 'Diatonic chords')}</span>
          <div className="grid grid-cols-2 gap-2">
            {chords.map((ch) => (
              <div key={ch.degree} className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-sm">
                <span className="w-8 font-bold text-teal">{ROMAN[ch.degree]}</span>
                <button type="button" className="btn btn-sm flex-1" onClick={() => void play(ch.triad.map((n) => n + 12))}>{midiToName(ch.triad[0]!, naming.accidentals, false)}{ch.tri?.symbol ?? '?'}</button>
                <button type="button" className="btn btn-sm flex-1" onClick={() => void play(ch.seventh.map((n) => n + 12))}>{midiToName(ch.seventh[0]!, naming.accidentals, false)}{ch.sev?.symbol ?? '7'}</button>
              </div>
            ))}
          </div>
          <PianoKeyboard from={48} to={84} marks={highlight(lit)} {...naming} />
        </section>
      </div>
    </ToolShell>
  );
}

// ── Scale explorer ───────────────────────────────────────────────────────────────────
export function ScaleTool() {
  const l = useL();
  const naming = useNaming();
  const [tonic, setTonic] = useState('C');
  const [bpm, setBpm] = useState(80);
  const [dir, setDir] = useState<'ascending' | 'descending'>('ascending');
  const [scaleId, setScaleId] = useState('major');
  const [lit, setLit] = useState<number | null>(null);
  const [finder, setFinder] = useState<number[]>([]);
  const root = tonicMidi(tonic);
  const notes = buildScale(root, getScale(scaleId), 'ascending');
  const seven = getScale(scaleId).formula.length === 7;
  const chords = seven ? diatonicChords(root, scaleId) : [];

  const play = async (id: string) => {
    setScaleId(id);
    await audio.start();
    audio.stop();
    const seq = buildScale(root, getScale(id), dir);
    await audio.playMelodic(seq, 60 / bpm, (i) => setLit(seq[i]!));
    setLit(null);
  };

  const found = finder.length ? TONICS.filter((t) => !t.includes('b') || t === 'Bb' || t === 'Eb' || t === 'Ab').flatMap((t) => scalesContaining(finder, pitchClass(tonicMidi(t))).map((s) => ({ t, s }))) : [];
  const marks: Record<number, KeyMark> = { ...highlight(notes, 'hint'), ...highlight(finder.map((p) => 48 + p), 'selected') };
  if (lit !== null) marks[lit] = 'active';

  return (
    <ToolShell id="scales">
      <section className="card flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1"><span className="label !mb-0">{l('Chủ âm', 'Tonic')}</span><select className="field !w-auto" value={tonic} onChange={(e) => setTonic(e.target.value)}>{TONICS.map((t) => <option key={t}>{t}</option>)}</select></label>
          <label className="flex flex-col gap-1"><span className="label !mb-0">Tempo · {bpm}</span><input type="range" min={40} max={120} step={10} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="accent-[#f4b740]" /></label>
          <div className="flex gap-1.5">
            <button type="button" className={`btn btn-sm ${dir === 'ascending' ? '!border-teal' : ''}`} onClick={() => setDir('ascending')}>{l('Đi lên', 'Up')}</button>
            <button type="button" className={`btn btn-sm ${dir === 'descending' ? '!border-teal' : ''}`} onClick={() => setDir('descending')}>{l('Đi xuống', 'Down')}</button>
          </div>
        </div>
        <PianoKeyboard from={48} to={84} marks={marks} onNote={(m) => setFinder((f) => (f.includes(pitchClass(m)) ? f.filter((x) => x !== pitchClass(m)) : [...f, pitchClass(m)]))} {...naming} />
        <p className="text-xs text-muted">{l('Bấm phím đàn để chọn nốt cho bộ tìm âm giai.', 'Click keys to pick notes for the scale finder.')}</p>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <span className="label">{l('Âm giai', 'Scales')}</span>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {SCALES.map((s) => (
              <button key={s.id} type="button" onClick={() => void play(s.id)} className={`flex justify-between rounded-lg border px-3 py-2 text-left text-sm ${scaleId === s.id ? 'border-accent bg-accent/10' : 'border-line bg-surface-2'}`}>
                <span className="font-semibold">{localName(s.name, l.lang)}</span><span>▶</span>
              </button>
            ))}
          </div>
        </section>
        <section className="card flex flex-col gap-3">
          <span className="label !mb-0">{l(`Hợp âm theo bậc · ${tonic} ${localName(getScale(scaleId).name, 'vi')}`, `Chords per degree · ${tonic} ${localName(getScale(scaleId).name, 'en')}`)}</span>
          {seven ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {chords.map((ch) => (
                    <tr key={ch.degree} className="border-b border-surface-2">
                      <td className="py-1.5 font-bold text-teal">{ROMAN[ch.degree]}</td>
                      <td><button type="button" className="btn btn-sm" onClick={() => void audio.start().then(() => audio.playNotes(ch.triad, 1.4))}>{midiToName(ch.triad[0]!, naming.accidentals, false)}{ch.tri?.symbol ?? ''}</button></td>
                      <td><button type="button" className="btn btn-sm" onClick={() => void audio.start().then(() => audio.playNotes(ch.seventh, 1.4))}>{midiToName(ch.seventh[0]!, naming.accidentals, false)}{ch.sev?.symbol ?? '7'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted">{l('Bảng hợp âm theo bậc dành cho âm giai 7 nốt.', 'Degree chords are shown for seven-note scales.')}</p>
          )}
          <span className="label !mb-0">{l('Tìm âm giai', 'Scale finder')}</span>
          {finder.length === 0 ? <p className="text-sm text-muted">{l('Chọn vài nốt trên phím đàn.', 'Pick some notes on the keyboard.')}</p> : (
            <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto">
              {found.slice(0, 60).map(({ t, s }) => <button key={`${t}${s.id}`} type="button" className="btn btn-sm" onClick={() => { setTonic(t); void play(s.id); }}>{t} {localName(s.name, l.lang)}</button>)}
              <button type="button" className="btn btn-sm" onClick={() => setFinder([])}>{l('Xóa chọn', 'Clear')}</button>
            </div>
          )}
        </section>
      </div>
    </ToolShell>
  );
}

// ── Chord player ─────────────────────────────────────────────────────────────────────
export function ChordTool() {
  const l = useL();
  const naming = useNaming();
  const [root, setRoot] = useState('C');
  const [chordId, setChordId] = useState('maj7');
  const [inversion, setInversion] = useState(0);
  const [mode, setMode] = useState<'harmonic' | 'up' | 'down'>('harmonic');
  const def = getChord(chordId);
  const rootMidi = tonicMidi(root) - 12;
  const notes = invert(buildChord(rootMidi, def), Math.min(inversion, def.formula.length - 1));
  const spelled = spellChord(`${root}3`, def);
  const roles = def.formula.map((s, i) => ({
    name: spelled[i]!.replace(/\d/, ''),
    role: s === 0 ? l('Gốc', 'Root') : [3, 4].includes(s) ? l('Quãng 3', '3rd') : [6, 7, 8].includes(s) ? l('Quãng 5', '5th') : [2, 5].includes(s) ? 'sus' : l('Màu', 'Colour'),
  }));
  const play = async () => {
    await audio.start();
    audio.stop();
    if (mode === 'harmonic') audio.playNotes(notes, 1.8);
    else await audio.playMelodic(mode === 'up' ? notes : [...notes].reverse(), 0.35);
  };
  return (
    <ToolShell id="chords">
      <section className="card flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1"><span className="label !mb-0">{l('Nốt gốc', 'Root')}</span><select className="field !w-auto" value={root} onChange={(e) => setRoot(e.target.value)}>{TONICS.map((t) => <option key={t}>{t}</option>)}</select></label>
          <label className="flex flex-col gap-1"><span className="label !mb-0">{l('Loại hợp âm', 'Chord type')}</span>
            <select className="field !w-auto" value={chordId} onChange={(e) => { setChordId(e.target.value); setInversion(0); }}>
              {[3, 4, 5, 6].map((n) => (
                <optgroup key={n} label={l(`${n} nốt`, `${n} notes`)}>
                  {CHORDS.filter((c) => c.formula.length === n).map((c) => <option key={c.id} value={c.id}>{root}{c.symbol} · {localName(c.name, l.lang)}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1"><span className="label !mb-0">{l('Thế đảo', 'Inversion')}</span>
            <select className="field !w-auto" value={inversion} onChange={(e) => setInversion(Number(e.target.value))}>
              {def.formula.map((_, i) => <option key={i} value={i}>{i === 0 ? l('Thế gốc', 'Root position') : l(`Đảo ${i}`, `Inversion ${i}`)}</option>)}
            </select>
          </label>
          <div className="flex gap-1.5">
            {(['harmonic', 'up', 'down'] as const).map((m) => <button key={m} type="button" className={`btn btn-sm ${mode === m ? '!border-teal' : ''}`} onClick={() => setMode(m)}>{{ harmonic: l('Cùng lúc', 'Together'), up: l('Rải lên', 'Up'), down: l('Rải xuống', 'Down') }[m]}</button>)}
          </div>
          <button type="button" className="btn btn-primary" onClick={() => void play()}>▶ {l('Phát', 'Play')}</button>
        </div>
        <PianoKeyboard from={36} to={84} marks={highlight(notes, 'hint')} {...naming} />
      </section>
      <section className="card grid gap-4 sm:grid-cols-3">
        <div><span className="label">{l('Các nốt', 'Notes')}</span><div className="h-display text-2xl font-bold">{spelled.map((s) => s.replace(/\d/, '')).join(' · ')}</div></div>
        <div><span className="label">{l('Cấu tạo', 'Chord DNA')}</span>
          <ul className="space-y-1 text-sm">{roles.map((r, i) => <li key={i}><strong>{r.name}</strong> — {r.role}</li>)}</ul>
        </div>
        <div><span className="label">{l('Nốt bass', 'Bass')}</span><div className="h-display text-2xl font-bold">{midiToName(notes[0]!, naming.accidentals)}</div><div className="mt-1 text-sm text-muted">{l('Công thức (nửa cung)', 'Formula (semitones)')}: {def.formula.join(' ')}</div></div>
      </section>
    </ToolShell>
  );
}

export { MidiButton };
