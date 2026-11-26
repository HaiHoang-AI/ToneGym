import { useEffect, useRef } from 'react';
import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow';
import { accidentalOf, toVexKey } from '../theory';

export type Clef = 'treble' | 'bass' | 'alto';

export interface StaffSpec {
  clef: Clef;
  /** Each stack is one chord (or single note); stacks are read left to right. */
  stacks: string[][];
}

/** A short staff with whole notes, drawn with VexFlow in the current theme's ink colour. */
export function Staff({ spec, theme, height = 150, label }: { spec: StaffSpec; theme?: string; height?: number; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = '';
    const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#e9ecf2';
    const width = Math.min(560, Math.max(260, 140 + spec.stacks.length * 70));
    const renderer = new Renderer(el, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const ctx = renderer.getContext();
    ctx.setFillStyle(ink);
    ctx.setStrokeStyle(ink);
    ctx.scale(1.25, 1.25);
    const stave = new Stave(6, 6, width / 1.25 - 14);
    stave.addClef(spec.clef);
    stave.setContext(ctx).draw();
    const notes = spec.stacks.map((stack) => {
      const sorted = [...stack];
      const note = new StaveNote({ clef: spec.clef, keys: sorted.map(toVexKey), duration: 'w', align_center: spec.stacks.length === 1 });
      sorted.forEach((name, i) => {
        const acc = accidentalOf(name);
        if (acc) note.addModifier(new Accidental(acc), i);
      });
      note.setStyle({ fillStyle: ink, strokeStyle: ink });
      return note;
    });
    const voice = new Voice({ num_beats: 4 * notes.length, beat_value: 4 }).setStrict(false);
    voice.addTickables(notes);
    new Formatter().joinVoices([voice]).format([voice], width / 1.25 - 90);
    voice.draw(ctx, stave);
  }, [spec, theme, height]);

  return <div ref={ref} className="flex justify-center" role="img" aria-label={label ?? 'Staff notation'} data-staff={spec.stacks.map((s) => s.join('+')).join(' ')} />;
}
