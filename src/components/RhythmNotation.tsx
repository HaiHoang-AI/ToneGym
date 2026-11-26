import { useEffect, useRef } from 'react';
import { Beam, Dot, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow';
import { vexDuration, type RhythmPattern } from '../theory';

/** Splits the event list into bars (events never cross bar lines in our generator). */
function splitBars(p: RhythmPattern) {
  const bars: RhythmPattern['events'][] = [];
  let current: RhythmPattern['events'] = [];
  let filled = 0;
  for (const e of p.events) {
    current.push(e);
    filled += e.dur;
    if (filled >= p.beatsPerBar - 1e-9) {
      bars.push(current);
      current = [];
      filled = 0;
    }
  }
  if (current.length) bars.push(current);
  return bars;
}

/** Rhythm on a single-line staff, drawn with VexFlow. Re-renders when the theme colour changes. */
export function RhythmNotation({ pattern, theme, height = 120 }: { pattern: RhythmPattern; theme?: string; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = '';
    const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#e9ecf2';
    const bars = splitBars(pattern);
    const width = Math.max(320, el.clientWidth || 640);
    const renderer = new Renderer(el, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const ctx = renderer.getContext();
    ctx.setFillStyle(ink);
    ctx.setStrokeStyle(ink);
    const barWidth = (width - 20) / bars.length;
    bars.forEach((events, i) => {
      const stave = new Stave(10 + i * barWidth, 10, barWidth, { num_lines: 1 } as never);
      if (i === 0) stave.addTimeSignature(`${pattern.beatsPerBar}/4`);
      stave.setContext(ctx).draw();
      const notes = events.map((e) => {
        const { code, dots } = vexDuration(e.dur);
        const note = new StaveNote({ keys: ['b/4'], duration: code + (e.rest ? 'r' : ''), auto_stem: false, stem_direction: 1 });
        note.setStyle({ fillStyle: ink, strokeStyle: ink });
        if (dots) Dot.buildAndAttach([note], { all: true });
        return note;
      });
      const voice = new Voice({ num_beats: pattern.beatsPerBar, beat_value: 4 }).setStrict(false);
      voice.addTickables(notes);
      const beams = Beam.generateBeams(notes.filter((n) => !n.isRest()));
      new Formatter().joinVoices([voice]).format([voice], barWidth - (i === 0 ? 60 : 30));
      voice.draw(ctx, stave);
      beams.forEach((b) => b.setStyle({ fillStyle: ink, strokeStyle: ink }).setContext(ctx).draw());
    });
  }, [pattern, theme, height]);

  return <div ref={ref} className="w-full overflow-x-auto" aria-label="Rhythm notation" role="img" />;
}
