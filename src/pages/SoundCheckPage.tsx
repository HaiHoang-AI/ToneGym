import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { audio } from '../audio/engine';
import { useAudioStatus } from '../audio/useAudioStatus';
import { useProfile } from '../app/ProfileContext';
import { PianoKeyboard, useComputerKeyboard, type KeyMark } from '../components/PianoKeyboard';
import {
  buildChord, buildScale, getChord, getInterval, getScale, intervalNotes, localName,
  parseProgression, PROGRESSIONS, realizeProgression, type IntervalId,
} from '../theory';

interface Demo {
  id: string;
  label: string;
  /** Each step is a set of notes; played in order and highlighted on the keyboard. */
  steps: number[][];
  gap: number;
}

const STATUS_STYLES = {
  idle: 'border-line text-muted',
  loading: 'border-teal/40 text-teal',
  ready: 'border-good/40 text-good',
  fallback: 'border-accent/50 text-accent',
} as const;

export function SoundCheckPage() {
  const { t, i18n } = useTranslation();
  const profile = useProfile();
  const status = useAudioStatus();
  const [marks, setMarks] = useState<Record<number, KeyMark>>({});
  const [playing, setPlaying] = useState<string | null>(null);
  const lang = i18n.language;

  const intervalDemo = (id: IntervalId, dir: 'ascending' | 'harmonic'): Demo => {
    const { notes, harmonic } = intervalNotes(60, id, dir);
    return {
      id: `iv-${id}-${dir}`,
      label: t('sound.interval', { name: `${id} · ${localName(getInterval(id).name, lang)}` }),
      steps: harmonic ? [notes] : notes.map((n) => [n]),
      gap: 0.7,
    };
  };
  const chordDemo = (root: number, rootName: string, id: string, inversion = 0): Demo => {
    const def = getChord(id);
    return {
      id: `ch-${id}-${inversion}`,
      label: t('sound.chord', { name: `${rootName}${def.symbol}${inversion ? ` (${inversion})` : ''}` }),
      steps: [buildChord(root, def, { inversion })],
      gap: 1.2,
    };
  };
  const scaleDemo = (root: number, rootName: string, id: string): Demo => ({
    id: `sc-${id}`,
    label: t('sound.scale', { name: `${rootName} ${localName(getScale(id).name, lang)}` }),
    steps: buildScale(root, getScale(id)).map((n) => [n]),
    gap: 0.32,
  });
  const progressionDemo = (id: string): Demo => {
    const def = PROGRESSIONS.find((p) => p.id === id)!;
    return {
      id: `pr-${id}`,
      label: t('sound.progression', { name: `${def.numerals.replace(/-/g, '–')} · ${localName(def.name, lang)}` }),
      steps: realizeProgression(parseProgression(def.numerals), 60).map((c) => c.notes),
      gap: 1.0,
    };
  };

  const demos: Demo[] = [
    intervalDemo('M3', 'ascending'),
    intervalDemo('P5', 'harmonic'),
    intervalDemo('TT', 'ascending'),
    chordDemo(60, 'C', 'maj7'),
    chordDemo(57, 'A', 'min', 1),
    chordDemo(55, 'G', 'dom9'),
    scaleDemo(60, 'C', 'major'),
    scaleDemo(57, 'A', 'minorPentatonic'),
    scaleDemo(62, 'D', 'dorian'),
    progressionDemo('popFour'),
    progressionDemo('twoFiveOne7'),
    progressionDemo('andalusian'),
  ];

  const play = async (demo: Demo) => {
    audio.stop();
    await audio.start();
    setPlaying(demo.id);
    await audio.playSequence(
      demo.steps.map((notes, i) => ({ notes, at: i * demo.gap, duration: demo.gap * 1.3 })),
      (i) => setMarks(Object.fromEntries((demo.steps[i] ?? []).map((n) => [n, 'active' as KeyMark]))),
    );
    setMarks({});
    setPlaying((current) => (current === demo.id ? null : current));
  };

  const stop = () => {
    audio.stop();
    setMarks({});
    setPlaying(null);
  };

  const onComputerKey = useCallback(async (midi: number) => {
    await audio.start();
    audio.playNotes([midi], 1.2);
    setMarks({ [midi]: 'active' });
    window.setTimeout(() => setMarks({}), 200);
  }, []);
  const base = useComputerKeyboard(onComputerKey);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{t('sound.title')}</h1>
        <p className="max-w-3xl text-sm text-muted">{t('sound.intro')}</p>
        <div className={`inline-flex rounded-lg border px-3 py-1.5 text-sm ${STATUS_STYLES[status]}`} role="status">
          {t(`sound.status.${status}`)}
        </div>
      </div>

      <div className="card space-y-3 p-3 sm:p-4">
        <PianoKeyboard
          from={36}
          to={84}
          marks={marks}
          naming={profile.settings.noteNaming}
          accidentals={profile.settings.accidentals}
        />
        <p className="text-xs text-muted">{t('sound.octave', { n: Math.floor(base / 12) - 1 })}</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{t('sound.demos')}</h2>
          <button type="button" className="btn" onClick={stop} disabled={!playing}>
            ■ {t('common.stop')}
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {demos.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => void play(d)}
              className={`btn justify-start text-left ${playing === d.id ? 'border-teal text-teal' : ''}`}
            >
              ▶ {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
