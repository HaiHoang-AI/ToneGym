import { useEffect, useRef, useState } from 'react';
import { audio } from '../../audio/engine';
import { classifyVoice, nearestNote, StabilityTracker, VOICE_RANGES, type VoiceType } from '../../audio/pitchMath';
import { useMicPitch } from '../../audio/useMicPitch';
import { useProfile } from '../../app/ProfileContext';
import { useL } from '../../app/useL';
import { Yumika } from '../../components/art/Characters';
import { CentsMeter } from '../../components/SingInput';
import { updateSettings } from '../../db/profiles';
import { createRng, displayNoteName, midiToName } from '../../theory';
import { ToolShell } from './ToolsPage';

function useNoteName() {
  const profile = useProfile();
  return (m: number) => displayNoteName(midiToName(m, profile.settings.accidentals), profile.settings.noteNaming);
}

const VOICE_NAMES: Record<VoiceType, [string, string]> = {
  bass: ['Bass (giọng nam trầm)', 'Bass'],
  baritone: ['Baritone (giọng nam trung)', 'Baritone'],
  tenor: ['Tenor (giọng nam cao)', 'Tenor'],
  alto: ['Alto (giọng nữ trầm)', 'Alto'],
  mezzo: ['Mezzo-soprano (giọng nữ trung)', 'Mezzo-soprano'],
  soprano: ['Soprano (giọng nữ cao)', 'Soprano'],
};

function MicButton({ on, setOn, state }: { on: boolean; setOn: (v: boolean) => void; state: string }) {
  const l = useL();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className={`btn ${on ? '' : 'btn-primary'}`} onClick={() => setOn(!on)}>
        🎤 {on ? l('Tắt micro', 'Mic off') : l('Bật micro', 'Mic on')}
      </button>
      {state === 'denied' && <span className="text-sm text-bad-ink">{l('Trình duyệt chặn micro. Cho phép micro cho localhost rồi thử lại.', 'Mic blocked. Allow it for localhost and retry.')}</span>}
      {state === 'unsupported' && <span className="text-sm text-bad-ink">{l('Trình duyệt này không hỗ trợ micro.', 'No microphone support in this browser.')}</span>}
    </div>
  );
}

export function TunerTool() {
  const l = useL();
  const name = useNoteName();
  const [on, setOn] = useState(false);
  const [a4, setA4] = useState(440);
  const { state, reading } = useMicPitch(on, undefined, a4);
  const near = reading.freq ? nearestNote(reading.freq, a4) : null;
  return (
    <ToolShell id="tuner">
      <section className="card mx-auto flex w-full max-w-xl flex-col items-center gap-5 text-center">
        <div className="h-display text-[88px] font-bold leading-none" aria-live="polite">{near ? name(near.midi) : '—'}</div>
        <div className="text-muted">{reading.freq ? `${reading.freq.toFixed(1)} Hz` : l('Chơi hoặc hát một nốt', 'Play or sing a note')}</div>
        <div className="w-full">
          <CentsMeter cents={near?.cents ?? null} active={on} />
          <div className="mt-2 flex justify-between text-xs text-muted">
            <span>{l('Chùng', 'Flat')} −50¢</span>
            <span className={near && Math.abs(near.cents) <= 5 ? 'font-bold text-good-ink' : ''}>{near ? `${near.cents > 0 ? '+' : ''}${near.cents}¢` : '0¢'}</span>
            <span>+50¢ {l('Căng', 'Sharp')}</span>
          </div>
        </div>
        <MicButton on={on} setOn={setOn} state={state} />
        <label className="flex items-center gap-2 text-sm text-muted">
          A4 =
          <input type="number" className="field !w-24" min={415} max={466} value={a4} onChange={(e) => setA4(Number(e.target.value) || 440)} /> Hz
        </label>
      </section>
    </ToolShell>
  );
}

type RangeStep = 'intro' | 'low' | 'high' | 'result';

export function VocalRangeTool() {
  const l = useL();
  const name = useNoteName();
  const profile = useProfile();
  const [step, setStep] = useState<RangeStep>('intro');
  const [low, setLow] = useState<number | null>(null);
  const [high, setHigh] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const tracker = useRef(new StabilityTracker(3000, 60));
  const listening = step === 'low' || step === 'high';
  const { state, reading } = useMicPitch(listening, (r, t) => {
    const held = tracker.current.push(r.midi, t);
    if (held === null) return;
    const m = Math.round(held);
    tracker.current.reset();
    if (step === 'low') {
      setLow(m);
      setStep('high');
    } else if (step === 'high') {
      setHigh(m);
      setStep('result');
    }
  });

  const begin = () => {
    tracker.current.reset();
    setLow(null);
    setHigh(null);
    setSaved(false);
    setStep('low');
  };

  const valid = low !== null && high !== null && high - low >= 5;
  const voice = valid ? classifyVoice(low!, high!) : null;
  const live = reading.freq ? nearestNote(reading.freq) : null;

  return (
    <ToolShell id="vocal-range">
      <section className="card mx-auto flex w-full max-w-2xl flex-col items-center gap-5 text-center">
        {step === 'intro' && (
          <>
            <p className="text-muted">{l('Hát và giữ nốt thấp nhất bạn hát thoải mái trong 3 giây, sau đó là nốt cao nhất. Ngồi gần micro, nơi yên tĩnh.', 'Sing and hold your lowest comfortable note for 3 seconds, then your highest. Sit near the mic somewhere quiet.')}</p>
            <button type="button" className="btn btn-primary" onClick={begin}>🎤 {l('Bắt đầu', 'Start')}</button>
          </>
        )}
        {listening && (
          <>
            <div className="text-lg font-semibold">{step === 'low' ? l('1. Hát nốt THẤP nhất, giữ 3 giây', '1. Sing your LOWEST note, hold 3 s') : l('2. Giờ hát nốt CAO nhất, giữ 3 giây', '2. Now your HIGHEST note, hold 3 s')}</div>
            <div className="h-display text-6xl font-bold">{live ? name(live.midi) : '…'}</div>
            <div className="text-sm text-muted">{reading.freq ? `${reading.freq.toFixed(0)} Hz` : l('Đang nghe…', 'Listening…')}</div>
            {low !== null && <div className="text-sm">{l('Thấp nhất', 'Lowest')}: <strong>{name(low)}</strong></div>}
            {state === 'denied' && <span className="text-sm text-bad-ink">{l('Trình duyệt chặn micro.', 'Mic blocked.')}</span>}
            <button type="button" className="btn" onClick={() => setStep('intro')}>{l('Hủy', 'Cancel')}</button>
          </>
        )}
        {step === 'result' && (
          <>
            <Yumika mood={valid ? 'cheer' : 'oops'} size={110} outfit={profile.settings.mascotOutfit ?? 'casual'} />
            {valid ? (
              <>
                <div className="h-display text-4xl font-bold">{name(low!)} – {name(high!)}</div>
                <div className="text-muted">{l(`${high! - low!} nửa cung`, `${high! - low!} semitones`)}</div>
                <div className="text-lg">{l('Loại giọng gần nhất', 'Closest voice type')}: <strong>{l(VOICE_NAMES[voice!][0], VOICE_NAMES[voice!][1])}</strong></div>
                <div className="text-sm text-muted">{l('Tầm điển hình', 'Typical range')}: {name(VOICE_RANGES[voice!][0])} – {name(VOICE_RANGES[voice!][1])}</div>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={saved}
                    onClick={() => void updateSettings(profile.id!, { vocalRange: { low: low! + 2, high: high! - 2 } }).then(() => setSaved(true))}
                  >
                    {saved ? l('Đã lưu vào hồ sơ', 'Saved to profile') : l('Lưu làm tầm giọng (bớt 1 cung mỗi đầu)', 'Save as my range (minus a tone each end)')}
                  </button>
                  <button type="button" className="btn" onClick={begin}>{l('Đo lại', 'Test again')}</button>
                </div>
              </>
            ) : (
              <>
                <p className="font-semibold">{l('Kết quả chưa đáng tin (tầm quá hẹp hoặc nốt cao thấp hơn nốt thấp).', 'The result looks unreliable (range too narrow or reversed).')}</p>
                <button type="button" className="btn btn-primary" onClick={begin}>{l('Thử lại', 'Try again')}</button>
              </>
            )}
          </>
        )}
      </section>
    </ToolShell>
  );
}

const PC_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function PerfectPitchTool() {
  const l = useL();
  const name = useNoteName();
  const profile = useProfile();
  const rng = useRef(createRng(Date.now() & 0xffffffff));
  const [part, setPart] = useState<'intro' | 'listen' | 'sing' | 'done'>('intro');
  const [notes, setNotes] = useState<number[]>([]);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [singTargets, setSingTargets] = useState<number[]>([]);
  const [singResults, setSingResults] = useState<number[]>([]);
  const tracker = useRef(new StabilityTracker(600, 40));

  const playNote = async (m: number) => {
    await audio.start();
    audio.stop();
    audio.playNotes([m], 1.4);
  };

  const begin = async () => {
    const list = Array.from({ length: 6 }, () => rng.current.int(48, 76));
    setNotes(list);
    setI(0);
    setAnswers([]);
    setPart('listen');
    await playNote(list[0]!);
  };

  const answer = async (pc: number) => {
    const ok = notes[i]! % 12 === pc;
    const next = [...answers, ok];
    setAnswers(next);
    // A burst of random notes between rounds wipes out the previous note as a reference.
    await audio.start();
    audio.playSequence(Array.from({ length: 6 }, (_, k) => ({ notes: [rng.current.int(40, 90)], at: k * 0.06, duration: 0.15, velocity: 0.3 })));
    if (i + 1 < notes.length) {
      setI(i + 1);
      window.setTimeout(() => void playNote(notes[i + 1]!), 900);
    } else {
      setSingTargets(Array.from({ length: 3 }, () => rng.current.int(profile.settings.vocalRange.low + 2, profile.settings.vocalRange.high - 2)));
      setSingResults([]);
      tracker.current.reset();
      setPart('sing');
    }
  };

  const { reading } = useMicPitch(part === 'sing', (r, t) => {
    const held = tracker.current.push(r.midi, t);
    if (held === null) return;
    tracker.current.reset();
    setSingResults((prev) => {
      if (prev.length >= singTargets.length) return prev;
      const target = singTargets[prev.length]!;
      let cents = (held - target) * 100;
      cents = ((((cents + 600) % 1200) + 1200) % 1200) - 600;
      const next = [...prev, Math.round(cents)];
      if (next.length === singTargets.length) setPart('done');
      return next;
    });
  });

  useEffect(() => () => audio.stop(), []);

  const listenScore = answers.filter(Boolean).length;
  const singScore = singResults.filter((c) => Math.abs(c) <= 50).length;
  const live = reading.freq ? nearestNote(reading.freq) : null;

  return (
    <ToolShell id="perfect-pitch">
      <section className="card mx-auto flex w-full max-w-2xl flex-col items-center gap-5 text-center">
        {part === 'intro' && (
          <>
            <p className="text-muted">{l('Phần 1: nghe 6 nốt ngẫu nhiên và gọi tên, không có nốt mẫu. Phần 2: hát 3 nốt được gọi tên (cần micro).', 'Part 1: name 6 random notes with no reference. Part 2: sing 3 named notes (needs the mic).')}</p>
            <button type="button" className="btn btn-primary" onClick={() => void begin()}>{l('Bắt đầu', 'Start')}</button>
          </>
        )}
        {part === 'listen' && (
          <>
            <div className="text-lg font-semibold">{l(`Nốt ${i + 1}/6 là gì?`, `Note ${i + 1}/6?`)}</div>
            <button type="button" className="btn" onClick={() => void playNote(notes[i]!)}>▶ {l('Nghe lại', 'Replay')}</button>
            <div className="grid w-full grid-cols-4 gap-2 sm:grid-cols-6">
              {PC_NAMES.map((n, pc) => (
                <button key={n} type="button" className="h-display min-h-12 rounded-xl border border-line bg-surface-2 text-lg font-bold hover:border-accent" onClick={() => void answer(pc)}>
                  {displayNoteName(midiToName(60 + pc, profile.settings.accidentals, false), profile.settings.noteNaming)}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">{answers.map((a, k) => <span key={k} className={`h-3 w-3 rounded-full ${a ? 'bg-good' : 'bg-bad'}`} />)}</div>
          </>
        )}
        {part === 'sing' && (
          <>
            <div className="text-lg font-semibold">{l(`Hát nốt ${name(singTargets[singResults.length]!)} (không có nốt mẫu)`, `Sing ${name(singTargets[singResults.length]!)} (no reference)`)}</div>
            <div className="h-display text-5xl font-bold">{live ? name(live.midi) : '…'}</div>
            <p className="text-sm text-muted">{l('Giữ nốt khoảng nửa giây. Được hát ở quãng tám nào cũng được.', 'Hold it for half a second. Any octave is fine.')}</p>
            <button type="button" className="btn" onClick={() => setPart('done')}>{l('Bỏ qua phần hát', 'Skip singing')}</button>
          </>
        )}
        {part === 'done' && (
          <>
            <Yumika mood={listenScore >= 4 ? 'cheer' : 'wave'} size={110} outfit={profile.settings.mascotOutfit ?? 'casual'} />
            <div className="h-display text-4xl font-bold">{listenScore}/6</div>
            <div className="text-muted">{l('nốt nghe đúng', 'notes named')}</div>
            {singResults.length > 0 && (
              <div className="text-sm">
                {l(`Hát: ${singScore}/${singResults.length} nốt trong ±50 cent`, `Singing: ${singScore}/${singResults.length} within ±50 cents`)}
                <div className="mt-1 text-muted">{singResults.map((c, k) => `${name(singTargets[k]!)} ${c > 0 ? '+' : ''}${c}¢`).join(' · ')}</div>
              </div>
            )}
            <p className="max-w-md text-sm text-muted">
              {listenScore >= 5 ? l('Rất có thể bạn có cao độ tuyệt đối!', 'You may well have perfect pitch!') : listenScore >= 3 ? l('Cảm giác cao độ khá tốt. Luyện thêm nhé.', 'A good sense of pitch. Keep practising.') : l('Bình thường thôi — đa số người cần nốt mẫu. Hãy luyện cao độ tương đối với các game.', 'Normal — most people need a reference. Train relative pitch with the games.')}
            </p>
            <button type="button" className="btn btn-primary" onClick={() => void begin()}>{l('Làm lại', 'Test again')}</button>
          </>
        )}
      </section>
    </ToolShell>
  );
}
