import { useCallback, useEffect, useRef, useState } from 'react';
import { audio } from '../../audio/engine';
import { midi } from '../../audio/midi';
import { useProfile } from '../../app/ProfileContext';
import { useL } from '../../app/useL';
import { MidiButton } from '../../components/MidiButton';
import { PianoKeyboard, useComputerKeyboard, type KeyMark } from '../../components/PianoKeyboard';
import { getInterval, INTERVALS, localName, midiToName, type IntervalId } from '../../theory';
import { encodeMidi, type RecordedNote } from '../../tools/midiFile';
import { useToolData } from '../../tools/useToolData';
import { ToolShell } from './ToolsPage';

const ROOTS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// ── Interval memorizer ───────────────────────────────────────────────────────────────
type Dir = 'up' | 'down' | 'harmonic';

/**
 * Pick an interval, hear it, and write down a song you know that starts with it.
 * The song list is the player's own; nothing is pre-filled.
 */
export function IntervalMemorizerTool() {
  const l = useL();
  const profile = useProfile();
  const [root, setRoot] = useState(0);
  const [dir, setDir] = useState<Dir>('up');
  const [id, setId] = useState<IntervalId>('P5');
  const [songs, setSongs] = useToolData<Record<string, string>>('interval-songs', {});
  const [draft, setDraft] = useState('');
  const key = `${id}:${dir}`;
  useEffect(() => setDraft(songs[key] ?? ''), [key, songs]);

  const start = 60 + root;
  const iv = getInterval(id);
  const second = dir === 'down' ? start - iv.semitones : start + iv.semitones;
  const play = async () => {
    await audio.start();
    audio.stop();
    if (dir === 'harmonic') audio.playNotes([start, second], 1.6);
    else await audio.playMelodic([start, second], 0.7);
  };
  const marks: Record<number, KeyMark> = { [start]: 'hint', [second]: 'active' };

  return (
    <ToolShell id="interval-memorizer">
      <section className="card flex flex-col gap-4">
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7 lg:grid-cols-13">
          {INTERVALS.slice(1, 13).map((x) => (
            <button key={x.id} type="button" onClick={() => setId(x.id)} title={localName(x.name, l.lang)} className={`min-h-11 rounded-[10px] border text-sm font-semibold ${id === x.id ? 'border-accent bg-accent/15' : 'border-line bg-surface-2'}`}>
              {x.id}
              {songs[`${x.id}:${dir}`] && <span className="ml-1 text-good-ink">♪</span>}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1"><span className="label !mb-0">{l('Nốt gốc', 'Root')}</span>
            <select className="field !w-auto" value={root} onChange={(e) => setRoot(Number(e.target.value))}>{ROOTS.map((r, i) => <option key={r} value={i}>{r}</option>)}</select>
          </label>
          {(['up', 'down', 'harmonic'] as const).map((d) => (
            <button key={d} type="button" className={`btn btn-sm ${dir === d ? '!border-teal' : ''}`} onClick={() => setDir(d)}>
              {{ up: l('Đi lên', 'Up'), down: l('Đi xuống', 'Down'), harmonic: l('Cùng lúc', 'Together') }[d]}
            </button>
          ))}
          <button type="button" className="btn btn-primary" onClick={() => void play()}>▶ {l('Nghe', 'Play')}</button>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-surface-2 p-3"><div className="label !mb-0">{l('Quãng', 'Interval')}</div><div className="h-display text-xl font-bold">{localName(iv.name, l.lang)}</div></div>
          <div className="rounded-xl bg-surface-2 p-3"><div className="label !mb-0">{l('Ký hiệu', 'Symbol')}</div><div className="h-display text-xl font-bold">{iv.id}</div></div>
          <div className="rounded-xl bg-surface-2 p-3"><div className="label !mb-0">{l('Nửa cung', 'Semitones')}</div><div className="h-display text-xl font-bold">{iv.semitones}</div></div>
          <div className="rounded-xl bg-surface-2 p-3"><div className="label !mb-0">{l('Nốt', 'Notes')}</div><div className="h-display text-xl font-bold">{midiToName(start, profile.settings.accidentals)} → {midiToName(second, profile.settings.accidentals)}</div></div>
        </div>
        <PianoKeyboard from={48} to={84} marks={marks} naming={profile.settings.noteNaming} accidentals={profile.settings.accidentals} />
      </section>
      <section className="card flex flex-col gap-3">
        <span className="label !mb-0">{l(`Bài hát bạn liên tưởng (${iv.id}, ${dir === 'up' ? 'đi lên' : dir === 'down' ? 'đi xuống' : 'cùng lúc'})`, `Your reference song (${iv.id}, ${dir})`)}</span>
        <p className="text-sm text-muted">{l('Nghĩ đến một bài bạn thuộc mà hai nốt đầu tạo đúng quãng này, rồi ghi tên lại để nhớ lâu.', 'Think of a song you know whose first two notes make this interval, and note it down.')}</p>
        <div className="flex flex-wrap gap-2">
          <input className="field flex-1" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={l('Tên bài hát của bạn', 'Your song')} maxLength={80} />
          <button type="button" className="btn btn-primary" onClick={() => void setSongs({ ...songs, [key]: draft.trim() })}>{l('Lưu', 'Save')}</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead><tr className="text-left text-xs uppercase text-muted"><th className="py-2">{l('Quãng', 'Interval')}</th><th>{l('Đi lên', 'Up')}</th><th>{l('Đi xuống', 'Down')}</th><th>{l('Cùng lúc', 'Together')}</th></tr></thead>
            <tbody>
              {INTERVALS.slice(1, 13).map((x) => (
                <tr key={x.id} className="border-t border-surface-2">
                  <td className="py-1.5 font-semibold">{x.id}</td>
                  {(['up', 'down', 'harmonic'] as const).map((d) => <td key={d} className="text-muted">{songs[`${x.id}:${d}`] || '—'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </ToolShell>
  );
}

// ── Piano recorder ───────────────────────────────────────────────────────────────────
interface Recording {
  id: string;
  name: string;
  notes: RecordedNote[];
  createdAt: number;
}

export function PianoRecorderTool() {
  const l = useL();
  const profile = useProfile();
  const [recording, setRecording] = useState(false);
  const [notes, setNotes] = useState<RecordedNote[]>([]);
  const [saved, setSaved] = useToolData<Recording[]>('recordings', []);
  const [name, setName] = useState('');
  const [marks, setMarks] = useState<Record<number, KeyMark>>({});
  const startAt = useRef(0);
  const rec = useRef(false);
  rec.current = recording;

  const capture = useCallback((m: number, velocity = 0.8) => {
    if (!rec.current) return;
    const t = (performance.now() - startAt.current) / 1000;
    setNotes((n) => [...n, { midi: m, start: t, duration: 0.5, velocity }]);
  }, []);

  useEffect(() => midi.onNote((n, v, on) => on && capture(n, v)), [capture]);

  const onComputerKey = useCallback(async (m: number) => {
    await audio.start();
    audio.playNotes([m], 1);
    setMarks({ [m]: 'active' });
    window.setTimeout(() => setMarks({}), 180);
    capture(m);
  }, [capture]);
  const base = useComputerKeyboard(onComputerKey, 60);

  const toggle = () => {
    if (!recording) {
      setNotes([]);
      startAt.current = performance.now();
    }
    setRecording(!recording);
  };

  const playBack = async (list: RecordedNote[]) => {
    await audio.start();
    audio.stop();
    await audio.playSequence(list.map((n) => ({ notes: [n.midi], at: n.start, duration: n.duration, velocity: n.velocity })), (i) => {
      const m = list[i]!.midi;
      setMarks({ [m]: 'active' });
    });
    setMarks({});
  };

  const download = (list: RecordedNote[], fileName: string) => {
    const blob = new Blob([encodeMidi(list, 120)], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace(/[^\p{L}\p{N} _-]/gu, '') || 'earlab'}.mid`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolShell id="piano">
      <section className="card flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={`btn ${recording ? '!border-bad !text-bad-ink' : 'btn-primary'}`} onClick={toggle}>
            {recording ? `■ ${l('Dừng ghi', 'Stop')}` : `● ${l('Ghi âm', 'Record')}`}
          </button>
          <button type="button" className="btn" disabled={!notes.length || recording} onClick={() => void playBack(notes)}>▶ {l('Nghe lại', 'Play back')}</button>
          <button type="button" className="btn" disabled={!notes.length || recording} onClick={() => download(notes, name || 'earlab')}>⬇ {l('Xuất MIDI', 'Export MIDI')}</button>
          <span className="text-sm text-muted">{l(`${notes.length} nốt`, `${notes.length} notes`)} · {l('Bàn phím máy tính', 'Computer keys')}: A–K, Z/X ({l('quãng tám', 'octave')} {Math.floor(base / 12) - 1})</span>
          <MidiButton />
        </div>
        <PianoKeyboard from={36} to={96} marks={marks} onNote={(m) => capture(m)} naming={profile.settings.noteNaming} accidentals={profile.settings.accidentals} />
        <div className="flex flex-wrap gap-2">
          <input className="field !w-64" placeholder={l('Tên bản ghi', 'Recording name')} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
          <button type="button" className="btn" disabled={!notes.length || recording || !name.trim()} onClick={() => void setSaved([{ id: String(Date.now()), name: name.trim(), notes, createdAt: Date.now() }, ...saved]).then(() => setName(''))}>{l('Lưu bản ghi', 'Save recording')}</button>
        </div>
      </section>
      <section className="card">
        <span className="label">{l('Bản ghi của tôi', 'My recordings')}</span>
        {saved.length === 0 && <p className="text-sm text-muted">{l('Chưa có bản ghi nào.', 'No recordings yet.')}</p>}
        <div className="flex flex-col gap-2">
          {saved.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm">
              <span className="flex-1 font-semibold">{r.name}</span>
              <span className="text-muted">{l(`${r.notes.length} nốt`, `${r.notes.length} notes`)} · {new Date(r.createdAt).toLocaleDateString()}</span>
              <button type="button" className="btn btn-sm" onClick={() => void playBack(r.notes)}>▶</button>
              <button type="button" className="btn btn-sm" onClick={() => download(r.notes, r.name)}>⬇ MIDI</button>
              <button type="button" className="btn btn-sm" onClick={() => void setSaved(saved.filter((x) => x.id !== r.id))}>{l('Xóa', 'Delete')}</button>
            </div>
          ))}
        </div>
      </section>
    </ToolShell>
  );
}

// ── Metronome ────────────────────────────────────────────────────────────────────────
export function MetronomeTool() {
  const l = useL();
  const [bpm, setBpm] = useState(90);
  const [beats, setBeats] = useState(4);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(-1);
  const taps = useRef<number[]>([]);

  useEffect(() => () => audio.stopMetronome(), []);
  useEffect(() => {
    if (running) audio.setMetronomeBpm(bpm);
  }, [bpm, running]);

  const toggle = async () => {
    if (running) {
      audio.stopMetronome();
      setRunning(false);
      setBeat(-1);
    } else {
      await audio.startMetronome(bpm, beats, setBeat);
      setRunning(true);
    }
  };

  const restartWithBeats = async (b: number) => {
    setBeats(b);
    if (running) await audio.startMetronome(bpm, b, setBeat);
  };

  const tap = () => {
    const now = performance.now();
    taps.current = [...taps.current.filter((t) => now - t < 3000), now];
    if (taps.current.length >= 2) {
      const gaps = taps.current.slice(1).map((t, i) => t - taps.current[i]!);
      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      setBpm(Math.max(30, Math.min(240, Math.round(60_000 / avg))));
    }
  };

  return (
    <ToolShell id="metronome">
      <section className="card mx-auto flex w-full max-w-xl flex-col items-center gap-5 text-center">
        <div className="h-display text-7xl font-bold leading-none">{bpm}</div>
        <div className="text-muted">bpm</div>
        <input type="range" min={30} max={240} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="w-full accent-[#f4b740]" aria-label="Tempo" />
        <div className="flex gap-2" aria-hidden="true">
          {Array.from({ length: beats }, (_, i) => (
            <span key={i} className="h-5 w-5 rounded-full border-2 border-line" style={{ background: beat === i ? (i === 0 ? '#f4b740' : '#39d0c0') : 'transparent' }} />
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {[2, 3, 4, 5, 6, 7].map((b) => <button key={b} type="button" className={`btn btn-sm ${beats === b ? '!border-teal' : ''}`} onClick={() => void restartWithBeats(b)}>{b}/4</button>)}
        </div>
        <div className="flex gap-3">
          <button type="button" className="btn btn-primary" onClick={() => void toggle()}>{running ? `■ ${l('Dừng', 'Stop')}` : `▶ ${l('Bắt đầu', 'Start')}`}</button>
          <button type="button" className="btn" onClick={tap}>{l('Gõ để đặt tempo', 'Tap tempo')}</button>
        </div>
      </section>
    </ToolShell>
  );
}
